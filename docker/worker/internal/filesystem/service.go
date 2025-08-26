package filesystem

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"worker/pkg/types"
)

type Service struct {
	baseDir string // The root workspace directory
}

func (s *Service) securePath(relativePath string) (string, error) {
	cleanPath := filepath.Clean(relativePath)
	if strings.HasPrefix(cleanPath, "..") {
		return "", fmt.Errorf("invalid path: attempts to escape workspace")
	}

	return filepath.Join(s.baseDir, cleanPath), nil
}

func NewService(baseDir string) *Service {
	return &Service{baseDir: baseDir}
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
		entryType := "file"
		if entry.IsDir() {
			entryType = "directory"
		}
		dirEntries = append(dirEntries, types.DirectoryEntry{
			Type: entryType,
			Path: filepath.Join(fullPath, entry.Name()),
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

func (s *Service) CreateFile(relativePath string, content string) error {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return err }

	return os.WriteFile(fullPath, []byte(content), 0644)
}

func (s *Service) CreateFileBase64(relativePath string, contentBase64 string) error {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return err }

	// 1. Decode the base64 content to handle binary files correctly.
	decodedContent, err := base64.StdEncoding.DecodeString(contentBase64)
	if err != nil {
		return fmt.Errorf("failed to decode base64 content for file %s: %w", relativePath, err)
	}

	// 2. Ensure the parent directory exists before writing the file.
	dir := filepath.Dir(fullPath)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", dir, err)
	}

	// 3. Write the decoded binary data to the file.
	return os.WriteFile(fullPath, decodedContent, 0644)
}

func (s *Service) CreateFolder(relativePath string) error {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return err }

	return os.MkdirAll(fullPath, os.ModePerm)
}

func (s *Service) UpdateFile(relativePath string, content string) error {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return err }

	return os.WriteFile(fullPath, []byte(content), 0644)
}

func (s *Service) DeleteResource(relativePath string) error {
	fullPath, err := s.securePath(relativePath)
	if err != nil { return err }

	return os.RemoveAll(fullPath)
}

func (s *Service) MoveResource(oldPath, newRelativePath string) error {
	oldFullPath, err := s.securePath(oldPath)
	if err != nil { return err }
	newFullPath, err := s.securePath(newRelativePath)
	if err != nil { return err }

	return os.Rename(oldFullPath, newFullPath)
}
