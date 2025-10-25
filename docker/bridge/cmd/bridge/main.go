package main

import (
	"bridge/internal/worker" // <-- Import worker package
	"bridge/internal/ws"
	"fmt"
	"log"
	"net/http"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables from .env file
	if err := godotenv.Load(); err != nil {
		log.Printf("[BRIDGE] Warning: Error loading .env file: %v", err)
	} else {
		log.Println("[BRIDGE] Environment variables loaded from .env file")
	}

	hub := ws.NewHub()
	go hub.Run()

	worker.GetInstance()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws.ServeWs(hub, w, r)
	})

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		// Set the content type header to plain text
		w.Header().Set("Content-Type", "text/plain; charset=utf-8")
		// Set the status code to 200 OK
		w.WriteHeader(http.StatusOK)
		// Write the "OK" response body
		fmt.Fprintln(w, "OK BRIDGE")
	})

	log.Println("[BRIDGE] Starting WebSocket server on localhost:2024...")
	log.Println("[BRIDGE] Go to http://localhost:2024/health...")
	err := http.ListenAndServe(":2024", nil)
	if err != nil {
		log.Fatalf("[BRIDGE] ListenAndServe failed: %v", err)
	}
}
