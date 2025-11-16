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
		// Special handling for init - forward to worker and trigger hydration
		case "init":
			log.Printf("[BRIDGE] Frontend → Worker (init): event=%s, data=%v", msg.Event, msg.Data)
			// Forward init message to worker (contains mode from frontend)
			c.Worker.SendFireAndForget(&msg)
			// Trigger hydration after sending init
			go c.Worker.TriggerHydration()

		// Events that require request-response pattern
		case "crud-read-file", "crud-read-folder", "create-terminal", "close-terminal", "crud-download-workspace",
			"hydrate-create-file", "crud-create-file", "crud-create-folder", "command-preview", "command-run",
			"crud-update-file", "crud-delete-resource", "crud-move-resource":
			log.Printf("[BRIDGE] Frontend → Worker (request-response): event=%s", msg.Event)
			go c.handleRequestResponse(msg)

		// Fire-and-forget events (no response expected from worker)
		case "terminal-input", "crud-collapse-folder", "crud-close-file", "watch", "create-initial-commit":
			log.Printf("[BRIDGE] Frontend → Worker (fire-and-forget): event=%s", msg.Event)
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
		log.Printf("[BRIDGE] Worker → Frontend: event=%s", message.Event)
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
		// Use Send channel instead of direct WriteJSON to avoid concurrent writes
		c.Send <- &types.Message{
			Event: msg.Event,
			Data:  map[string]interface{}{"ackID": internalAckID, "error": err.Error()},
		}
		return
	}
	log.Printf("BRIDGE: Send forwarding command '%s': %v", msg.Event, err)

	// Use Send channel instead of direct WriteJSON to avoid concurrent writes
	c.Send <- &types.Message{
		Event: ack.Event,
		Data:  ack.Data,
	}
}