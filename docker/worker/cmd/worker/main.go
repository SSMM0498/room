package main

import (
	"log"
	"net/http"
	"os"
	"worker/internal/filesystem"
	"worker/internal/terminal"
	"worker/internal/watcher"
	"worker/internal/ws"
)

func main() {
	workspaceDir := os.Getenv("WORKER_WORKSPACE_DIR")
	if workspaceDir == "" {
		workspaceDir = "/workspace"
		log.Printf("WORKER: WARNING - WORKER_WORKSPACE_DIR not set, falling back to default: %s", workspaceDir)
	}
	if err := os.MkdirAll(workspaceDir, os.ModePerm); err != nil {
		log.Fatalf("WORKER: Could not create workspace directory %s: %v", workspaceDir, err)
	}

	hub := ws.NewHub()
	go hub.Run()

	fsSvc := filesystem.NewService(workspaceDir)
	termSvc := terminal.NewService(workspaceDir)
	watchSvc, err := watcher.NewService(workspaceDir)
	if err != nil {
		log.Fatalf("WORKER: Failed to create watcher service: %v", err)
	}

	wsHandler := ws.NewHandler(hub, fsSvc, termSvc, watchSvc)
	http.HandleFunc("/", wsHandler.ServeHTTP)
	
	defer watchSvc.Close()
	
	log.Println("WORKER: Starting ws server on :3002...")
	err = http.ListenAndServe(":3002", nil)
	if err != nil {
		log.Fatalf("WORKER: ListenAndServe failed: %v", err)
	}
}
