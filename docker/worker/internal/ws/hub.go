package ws

import (
	"log"
	"worker/pkg/types"
)

type Hub struct {
	Client     *Client
	Register   chan *Client
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			if h.Client != nil {
				// Allow only one connection from the Bridge
				log.Println("WORKER: Bridge already connected. Rejecting new connection.")
				client.Conn.Close()
			} else {
				h.Client = client
				log.Println("WORKER: Bridge registered.")
			}
		case <-h.Unregister:
			if h.Client != nil {
				log.Println("WORKER: Bridge unregistered.")
				h.Client = nil
			}
		}
	}
}

func (h *Hub) Send(msg *types.Message) {
	if h.Client != nil {
		h.Client.Send <- msg
	}
}