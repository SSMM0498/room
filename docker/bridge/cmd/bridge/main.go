package main

import (
	"bridge/internal/ws" // <-- USE CORRECT PACKAGE
	"log"
	"net/http"
)

func main() {
	hub := ws.NewHub() // <-- USE CORRECT PACKAGE
	go hub.Run()

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		ws.ServeWs(hub, w, r) // <-- USE CORRECT PACKAGE
	})
	
	log.Println("BRIDGE: Starting WebSocket server on :2024...")
	err := http.ListenAndServe(":2024", nil)
	if err != nil {
		log.Fatalf("BRIDGE: ListenAndServe failed: %v", err)
	}
}