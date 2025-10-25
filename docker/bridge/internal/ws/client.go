package ws

import (
	"bridge/internal/worker"
	"bridge/pkg/types"
	"log"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type Client struct {
	ID     string
	Hub    *Hub
	Conn   *websocket.Conn
	Send   chan *types.Message
	Worker *worker.Client
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

		switch msg.Event {
		case "crud-read-file", "crud-read-folder", "create-terminal", "close-terminal":
			go c.handleRequestResponse(msg)

		case "crud-update-file", "crud-create-file", "crud-create-folder", "crud-delete-resource", "crud-move-resource", "terminal-input", "crud-collapse-folder", "crud-close-file", "command-preview", "command-run":
			// No response needed, just forward to the worker.
			c.Worker.SendFireAndForget(&msg)
			
		default:
			log.Printf("BRIDGE: Received unknown event type from client: %s", msg.Event)
		}
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

func (c *Client) handleRequestResponse(msg types.Message) {
	// The frontend is responsible for generating and tracking its own internalAckID.
	internalAckID := uuid.New().String()

	// Forward the command to the worker and wait for its acknowledgement.
	ack, err := c.Worker.ForwardCommand(&msg, internalAckID)
	if err != nil {
		log.Printf("BRIDGE: Error forwarding command '%s': %v", msg.Event, err)
		// Send an error response back to the client
		c.Conn.WriteJSON(types.Acknowledge{Event: msg.Event, Error: err.Error(), Data: map[string]interface{}{"ackID": internalAckID}})
		return
	}

	// Forward the successful acknowledgement from the worker back to the client.
	c.Conn.WriteJSON(ack)
}