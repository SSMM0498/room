package ws

import (
	"log"
	"net/http"

	"bridge/internal/worker"
	"bridge/pkg/types"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var (
	upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			return true // In production, validate the origin
		},
	}
)

func ServeWs(hub *Hub, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	workerClient := worker.GetInstance()

	client := &Client{
		ID:     uuid.New().String(),
		Hub:    hub,
		Conn:   conn,
		Send:   make(chan *types.Message, 256),
		Worker: workerClient,
	}
	client.Hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}
