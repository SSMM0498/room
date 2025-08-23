package main

import (
	"log"
	"net/http"
	"worker/internal/filesystem"
	"worker/internal/terminal"
	"worker/internal/watcher"
	"worker/internal/ws"
	"worker/pkg/types"

	"github.com/fsnotify/fsnotify"
)

func main() {
	hub := ws.NewHub()
	go hub.Run()

	fsSvc := filesystem.NewService()
	termSvc := terminal.NewService()
	watchSvc, err := watcher.NewService()
	if err != nil {
		log.Fatalf("WORKER: Failed to create watcher service: %v", err)
	}
	defer watchSvc.Close()

	wsHandler := ws.NewHandler(hub, fsSvc, termSvc)
	http.HandleFunc("/", wsHandler.ServeHTTP)

	go func() {
		err := watchSvc.Watch("/workspace", func(event fsnotify.Event) {
			msg := &types.Message{
				Event: "file-changed",
				Data:  map[string]string{"event": event.Op.String(), "path": event.Name},
			}
			hub.Send(msg)
		})
		if err != nil {
			log.Fatalf("WORKER: Failed to start watching /workspace: %v", err)
		}
	}()

	log.Println("WORKER: Starting ws server on :3002...")
	err = http.ListenAndServe(":3002", nil)
	if err != nil {
		log.Fatalf("WORKER: ListenAndServe failed: %v", err)
	}
}
