package watcher

import (
	"log"
	"path/filepath"
	"sync"

	"github.com/fsnotify/fsnotify"
)

type watchInfo struct {
	isExplicitlyWatched bool
	fileReferenceCount  int 
}

type Service struct {
	watcher  *fsnotify.Watcher
	watched  map[string]*watchInfo // Map of path -> watchInfo
	rootPath string
	mu       sync.Mutex
}

func NewService(rootPath string) (*Service, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}
	return &Service{
		watcher:  watcher,
		watched:  make(map[string]*watchInfo),
		rootPath: rootPath,
	}, nil
}

func (s *Service) StartEventLoop(onEvent func(event fsnotify.Event)) {
	for {
		select {
		case event, ok := <-s.watcher.Events:
			if !ok { return }
			onEvent(event)
		case err, ok := <-s.watcher.Errors:
			if !ok { return }
			log.Printf("[WATCHER] Error: %v", err)
		}
	}
}

func (s *Service) Watch(path string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	info, exists := s.watched[path]
	if !exists {
		info = &watchInfo{}
		s.watched[path] = info
		// If it wasn't watched for any reason before, add it to fsnotify.
		if err := s.watcher.Add(path); err != nil {
			log.Printf("WATCHER: Failed to add watch on %s: %v", path, err)
		} else {
			log.Printf("WATCHER: Started monitoring directory: %s (explicit)", path)
		}
	}
	info.isExplicitlyWatched = true
}

func (s *Service) Unwatch(path string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if info, exists := s.watched[path]; exists {
		info.isExplicitlyWatched = false
		s.checkAndRemoveWatch(path)
	}
}

func (s *Service) AddFileReference(filePath string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	parentDir := filepath.Dir(filePath)
	info, exists := s.watched[parentDir]
	if !exists {
		info = &watchInfo{}
		s.watched[parentDir] = info
		// If it wasn't watched before, add it to fsnotify.
		if err := s.watcher.Add(parentDir); err != nil {
			log.Printf("WATCHER: Failed to add watch on %s: %v", parentDir, err)
		} else {
			log.Printf("WATCHER: Started monitoring directory: %s (by file reference)", parentDir)
		}
	}
	info.fileReferenceCount++
}

func (s *Service) RemoveFileReference(filePath string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	parentDir := filepath.Dir(filePath)
	if info, exists := s.watched[parentDir]; exists {
		if info.fileReferenceCount > 0 {
			info.fileReferenceCount--
		}
		s.checkAndRemoveWatch(parentDir)
	}
}

func (s *Service) checkAndRemoveWatch(path string) {
	// Never remove the root path watcher.
	if path == s.rootPath {
		return
	}
	
	if info, exists := s.watched[path]; exists {
		// Only remove the watch if it's not explicitly watched AND has no more file references.
		if !info.isExplicitlyWatched && info.fileReferenceCount == 0 {
			if err := s.watcher.Remove(path); err != nil {
				log.Printf("WATCHER: Failed to remove watch on %s: %v", path, err)
			} else {
				log.Printf("WATCHER: Stopped monitoring directory: %s", path)
			}
			delete(s.watched, path)
		}
	}
}

func (s *Service) Close() {
	s.watcher.Close()
}
