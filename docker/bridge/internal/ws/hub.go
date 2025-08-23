package ws

import (
	"bridge/internal/bus"
	"bridge/pkg/types"
	"log"
)

type Hub struct {
	Clients map[*Client]bool
	Broadcast chan *types.Message
	Register chan *Client
	Unregister chan *Client
	eventBus *bus.EventBus
}

func NewHub() *Hub {
	return &Hub{
		Broadcast:  make(chan *types.Message),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
		Clients:    make(map[*Client]bool),
		eventBus:   bus.GetInstance(),
	}
}

func (h *Hub) Run() {
	workerEvents := make(chan *types.Message, 256)
	h.eventBus.Subscribe("worker.events", workerEvents)

	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
			log.Printf("BRIDGE: Client %s registered to hub", client.ID)

		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				log.Printf("BRIDGE: Client %s unregistered from hub", client.ID)
			}

		case message := <-h.Broadcast:
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}

		case message := <-workerEvents:
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
		}
	}
}
