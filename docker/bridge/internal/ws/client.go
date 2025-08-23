package ws

import (
	"bridge/internal/worker"
	"bridge/pkg/types"
	"log"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Client struct {
	ID         string
	Hub        *Hub
	Conn       *websocket.Conn
	Send       chan *types.Message
	Worker     *worker.Client
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		var msg types.Message
		err := c.Conn.ReadJSON(&msg)
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("BRIDGE: read error: %v", err)
			}
			break
		}

		// Handle fire-and-forget messages
		if msg.Event == "terminal-input" {
			c.Worker.SendFireAndForget(&msg)
			continue
		}

		// Handle request-response messages
		go func() {
			ackID := uuid.New().String()
			ack, err := c.Worker.ForwardCommand(&msg, ackID)
			if err != nil {
				log.Printf("BRIDGE: Error forwarding command: %v", err)
				ack = types.Acknowledge{Error: err.Error()}
			}
			
			// Attach the original ackID to the response
			if data, ok := ack.Data.(map[string]interface{}); ok {
				data["ackID"] = ackID
				ack.Data = data
			}

			c.Conn.WriteJSON(ack)
		}()
	}
}

func (c *Client) WritePump() {
	defer c.Conn.Close()
	for {
		message, ok := <-c.Send
		if !ok {
			c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
			return
		}
		c.Conn.WriteJSON(message)
	}
}