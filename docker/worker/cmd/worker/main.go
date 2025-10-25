package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"worker/internal/filesystem"
	"worker/internal/terminal"
	"worker/internal/watcher"
	"worker/internal/ws"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("WORKER: Warning - Error loading .env file: %v", err)
	} else {
		log.Println("WORKER: Environment variables loaded from .env file")
	}

	workspaceDir := os.Getenv("WORKER_WORKSPACE_DIR")
	env := os.Getenv("ENV")

	if workspaceDir == "" {
		// In DEV mode, use the project's workspace folder directly
		if env == "DEV" {
			workspaceDir = "/workspace"
			log.Printf("WORKER: DEV mode - using local workspace directory: %s", workspaceDir)
		} else {
			workspaceDir = "/workspace"
			log.Printf("WORKER: WARNING - WORKER_WORKSPACE_DIR not set, falling back to default: %s", workspaceDir)
		}
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

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		// Set the content type header to plain text
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		// Set the status code to 200 OK
		w.WriteHeader(http.StatusOK)
		// Write the "OK" response body
		fmt.Fprintln(w, "OK WORKER")
	})
	
	defer watchSvc.Close()
	
	log.Println("WORKER: Starting ws server on :3002...")
	log.Println("[BRIDGE] Go to http://localhost:3002/health...")
	err = http.ListenAndServe(":3002", nil)
	if err != nil {
		log.Fatalf("WORKER: ListenAndServe failed: %v", err)
	}
}
