package filesystem

import (
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"worker/pkg/types"
)

type Service struct {
	baseDir    string // The root workspace directory
	mode       string // "RECORDING" or "PLAYBACK"
	gitInitMux sync.Mutex // Mutex to ensure git is only initialized once
	gitInited  bool // Track if git has been initialized
}

func (s *Service) securePath(relativePath string) (string, error) {
	// Strip /workspace prefix if present to make it relative
	cleanPath := strings.TrimPrefix(relativePath, "/workspace")
	cleanPath = strings.TrimPrefix(cleanPath, "/workspace/")

	// If the path is just "/workspace", make it empty (root of workspace)
	if cleanPath == "" || cleanPath == "/" {
		return s.baseDir, nil
	}

	// Clean the path to handle any .. or . segments
	cleanPath = filepath.Clean(cleanPath)

	// Security check: ensure the cleaned path doesn't try to escape
	if strings.HasPrefix(cleanPath, "..") {
		return "", fmt.Errorf("invalid path: attempts to escape workspace")
	}

	return filepath.Join(s.baseDir, cleanPath), nil
}

func NewService(baseDir string) *Service {
	return &Service{baseDir: baseDir}
}

func (s *Service) GetBaseDir() string {
	return s.baseDir
}

func (s *Service) ReadFolder(relativePath string) ([]types.DirectoryEntry, error) {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return nil, err }

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return nil, err
	}

	var dirEntries []types.DirectoryEntry
	for _, entry := range entries {
		// Filter out .git directory
		if entry.Name() == ".git" {
			continue
		}

		entryType := "file"
		if entry.IsDir() {
			entryType = "directory"
		}

		// Construct the path relative to /workspace
		entryRelativePath := strings.TrimPrefix(relativePath, "/workspace")
		if entryRelativePath == "" {
			entryRelativePath = "/"
		}
		entryPath := filepath.Join("/workspace", entryRelativePath, entry.Name())

		dirEntries = append(dirEntries, types.DirectoryEntry{
			Type: entryType,
			Path: filepath.ToSlash(entryPath), // Ensure forward slashes for consistency
			Name: entry.Name(),
		})
	}
	return dirEntries, nil
}

func (s *Service) ReadFile(relativePath string) (string, error) {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return "", err }

	content, err := os.ReadFile(fullPath)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

func (s *Service) CreateFile(relativePath string, content string) (string, error) {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return "", err }

	if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
		return "", err
	}

	// Commit the change and return the hash
	return s.commitChanges(fmt.Sprintf("FS_CREATE_FILE: %s", relativePath))
}

func (s *Service) CreateFileBase64(relativePath string, contentBase64 string) (string, error) {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return "", err }

	// 1. Decode the base64 content to handle binary files correctly.
	decodedContent, err := base64.StdEncoding.DecodeString(contentBase64)
	if err != nil {
		return "", fmt.Errorf("failed to decode base64 content for file %s: %w", relativePath, err)
	}

	// 2. Ensure the parent directory exists before writing the file.
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return "", fmt.Errorf("failed to create directory %s: %w", dir, err)
	}

	// 3. Write the decoded binary data to the file.
	if err := os.WriteFile(fullPath, decodedContent, 0644); err != nil {
		return "", err
	}

	// Commit the change and return the hash
	return s.commitChanges(fmt.Sprintf("FS_HYDRATE_FILE: %s", relativePath))
}

func (s *Service) CreateFolder(relativePath string) (string, error) {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return "", err }

	if err := os.MkdirAll(fullPath, os.ModePerm); err != nil {
		return "", err
	}

	// Commit the change and return the hash
	return s.commitChanges(fmt.Sprintf("FS_CREATE_FOLDER: %s", relativePath))
}

func (s *Service) UpdateFile(relativePath string, content string) (string, error) {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return "", err }

	if err := os.WriteFile(fullPath, []byte(content), 0644); err != nil {
		return "", err
	}

	// Commit the change and return the hash
	return s.commitChanges(fmt.Sprintf("FS_UPDATE_FILE: %s", relativePath))
}

func (s *Service) DeleteResource(relativePath string) (string, error) {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return "", err }

	if err := os.RemoveAll(fullPath); err != nil {
		return "", err
	}

	// Commit the change and return the hash
	return s.commitChanges(fmt.Sprintf("FS_DELETE_RESOURCE: %s", relativePath))
}

func (s *Service) MoveResource(oldPath, newRelativePath string) (string, error) {
	oldFullPath, err := s.securePath(oldPath)
	if err != nil { return "", err }
	newFullPath, err := s.securePath(newRelativePath)
	if err != nil { return "", err }

	if err := os.Rename(oldFullPath, newFullPath); err != nil {
		return "", err
	}

	// Commit the change and return the hash
	return s.commitChanges(fmt.Sprintf("FS_MOVE_RESOURCE: %s -> %s", oldPath, newRelativePath))
}

// ============================================================================
// GIT VERSION CONTROL METHODS
// ============================================================================

// executeGitCommand runs a git command in the workspace directory
func (s *Service) executeGitCommand(args ...string) (string, error) {
	cmd := exec.Command("git", args...)
	cmd.Dir = s.baseDir
	output, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("git %s failed: %w, output: %s", strings.Join(args, " "), err, string(output))
	}
	return strings.TrimSpace(string(output)), nil
}

// InitializeGit sets up the git repository based on the mode
func (s *Service) InitializeGit(mode string) error {
	s.gitInitMux.Lock()
	defer s.gitInitMux.Unlock()

	// If already initialized, skip
	if s.gitInited {
		log.Printf("[FS] Git already initialized, skipping")
		return nil
	}

	s.mode = mode
	gitDir := filepath.Join(s.baseDir, ".git")

	if mode == "RECORDING" {
		// RECORDING MODE: Always start fresh
		if _, err := os.Stat(gitDir); err == nil {
			log.Println("[FS] RECORDING mode: Removing existing .git directory for fresh recording")
			if err := os.RemoveAll(gitDir); err != nil {
				return fmt.Errorf("failed to remove existing .git directory: %w", err)
			}
		}

		log.Println("[FS] RECORDING mode: Initializing fresh git repository")

		// Initialize git repository
		if _, err := s.executeGitCommand("init"); err != nil {
			return fmt.Errorf("git init failed: %w", err)
		}

		// Add all files
		if _, err := s.executeGitCommand("add", "."); err != nil {
			return fmt.Errorf("git add failed: %w", err)
		}

		// Create initial commit
		if _, err := s.executeGitCommand("commit", "-m", "Initial commit"); err != nil {
			// If no files to commit, that's okay
			log.Printf("[FS] Initial commit warning (likely empty workspace): %v", err)
		}

		log.Println("[FS] ✅ Git repository initialized successfully for RECORDING")
	} else {
		// PLAYBACK MODE: Use hydrated .git directory
		if _, err := os.Stat(gitDir); err != nil {
			log.Println("[FS] PLAYBACK mode: No .git directory found - will be hydrated from S3")
		} else {
			log.Println("[FS] PLAYBACK mode: Using existing .git directory from hydration")
		}
	}

	s.gitInited = true
	return nil
}

// commitChanges creates a git commit with the given message and returns the commit hash
// In PLAYBACK mode, this is a no-op and returns empty string
func (s *Service) commitChanges(message string) (string, error) {
	// Only commit in RECORDING mode
	if s.mode != "RECORDING" {
		return "", nil // Silent no-op in PLAYBACK mode
	}

	// Add all changes
	if _, err := s.executeGitCommand("add", "."); err != nil {
		return "", fmt.Errorf("git add failed: %w", err)
	}

	// Commit changes
	if _, err := s.executeGitCommand("commit", "-m", message); err != nil {
		// If nothing to commit, return empty hash (not an error)
		if strings.Contains(err.Error(), "nothing to commit") {
			log.Printf("[FS] No changes to commit for: %s", message)
			return "", nil
		}
		return "", fmt.Errorf("git commit failed: %w", err)
	}

	// Get the commit hash
	hash, err := s.executeGitCommand("rev-parse", "HEAD")
	if err != nil {
		return "", fmt.Errorf("git rev-parse failed: %w", err)
	}

	log.Printf("[FS] ✅ Committed: %s (hash: %s)", message, hash[:8])
	return hash, nil
}

// GetCurrentCommitHash returns the current HEAD commit hash
// Returns empty string if Git is not initialized or an error occurs
func (s *Service) GetCurrentCommitHash() (string, error) {
	if !s.gitInited {
		return "", fmt.Errorf("git not initialized")
	}

	hash, err := s.executeGitCommand("rev-parse", "HEAD")
	if err != nil {
		return "", fmt.Errorf("git rev-parse failed: %w", err)
	}

	return strings.TrimSpace(hash), nil
}

// CheckoutCommit checks out a specific git commit by hash or branch name
// This is used during playback to restore workspace state at a specific point in time
// If the input looks like a branch name (no special chars), it checks out the branch
// Otherwise, it treats it as a commit hash
func (s *Service) CheckoutCommit(target string) error {
	// First, discard any local changes
	if _, err := s.executeGitCommand("reset", "--hard", "HEAD"); err != nil {
		return fmt.Errorf("git reset failed: %w", err)
	}

	// Checkout the target (branch or commit hash)
	if _, err := s.executeGitCommand("checkout", target); err != nil {
		return fmt.Errorf("git checkout %s failed: %w", target, err)
	}

	// Log appropriate message based on target type
	if len(target) == 40 || len(target) < 10 {
		// Looks like a commit hash (SHA-1 is 40 chars, or short hash)
		displayHash := target
		if len(target) > 8 {
			displayHash = target[:8]
		}
		log.Printf("[FS] ✅ Checked out commit: %s", displayHash)
	} else {
		log.Printf("[FS] ✅ Checked out branch: %s", target)
	}
	return nil
}

// CreateBranchAndCheckout creates a new branch from a specific commit and checks it out
// This is used when the user pauses playback to interact with the code
func (s *Service) CreateBranchAndCheckout(commitHash string, branchName string) error {
	// First, discard any local changes
	if _, err := s.executeGitCommand("reset", "--hard", "HEAD"); err != nil {
		return fmt.Errorf("git reset failed: %w", err)
	}

	// Checkout the commit first (detached HEAD state)
	if _, err := s.executeGitCommand("checkout", commitHash); err != nil {
		return fmt.Errorf("git checkout %s failed: %w", commitHash, err)
	}

	// Create and checkout a new branch from this commit
	if _, err := s.executeGitCommand("checkout", "-b", branchName); err != nil {
		return fmt.Errorf("git checkout -b %s failed: %w", branchName, err)
	}

	log.Printf("[FS] ✅ Created and checked out branch: %s from commit: %s", branchName, commitHash[:8])
	return nil
}
