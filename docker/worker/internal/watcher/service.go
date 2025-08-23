package watcher

import (
	"log"

	"github.com/fsnotify/fsnotify"
)

type Service struct {
	watcher *fsnotify.Watcher
}

func NewService() (*Service, error) {
	watcher, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}
	return &Service{watcher: watcher}, nil
}

func (s *Service) Watch(path string, onEvent func(event fsnotify.Event)) error {
	go func() {
		for {
			select {
			case event, ok := <-s.watcher.Events:
				if !ok {
					return
				}
				onEvent(event)
			case err, ok := <-s.watcher.Errors:
				if !ok {
					return
				}
				log.Printf("WATCHER: error: %v", err)
			}
		}
	}()

	return s.watcher.Add(path)
}

func (s *Service) Close() {
	s.watcher.Close()
}