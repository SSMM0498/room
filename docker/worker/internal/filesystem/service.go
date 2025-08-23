package filesystem

import (
	"os"
	"fmt"
	"path/filepath"
	"encoding/base64"
	"worker/pkg/types"
)

type Service struct{}

func NewService() *Service {
	return &Service{}
}

func (s *Service) ReadFolder(path string) ([]types.DirectoryEntry, error) {
	entries, err := os.ReadDir(path)
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
			Path: filepath.Join(path, entry.Name()),
			Name: entry.Name(),
		})
	}
	return dirEntries, nil
}

func (s *Service) ReadFile(path string) (string, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return "", err
	}
	return string(content), nil
}

func (s *Service) CreateFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

func (s *Service) CreateFileBase64(path string, contentBase64 string) error {
	// 1. Decode the base64 content to handle binary files correctly.
	decodedContent, err := base64.StdEncoding.DecodeString(contentBase64)
	if err != nil {
		return fmt.Errorf("failed to decode base64 content for file %s: %w", path, err)
	}

	// 2. Ensure the parent directory exists before writing the file.
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, os.ModePerm); err != nil {
		return fmt.Errorf("failed to create directory %s: %w", dir, err)
	}

	// 3. Write the decoded binary data to the file.
	return os.WriteFile(path, decodedContent, 0644)
}

func (s *Service) CreateFolder(path string) error {
	return os.MkdirAll(path, os.ModePerm)
}

func (s *Service) UpdateFile(path string, content string) error {
	return os.WriteFile(path, []byte(content), 0644)
}

func (s *Service) DeleteResource(path string) error {
	return os.RemoveAll(path)
}

func (s *Service) MoveResource(oldPath, newPath string) error {
	return os.Rename(oldPath, newPath)
}