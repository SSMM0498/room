package worker

import (
	"log"
	"net/url"
	"sync"
	"time"

	"bridge/internal/bus"
	"bridge/pkg/types"

	"github.com/gorilla/websocket"
)

var (
	once   sync.Once
	client *Client
)

type Client struct {
	conn     *websocket.Conn
	mu       sync.Mutex
	ackChans map[string]chan types.Acknowledge
	isReady  chan struct{}
	eventBus *bus.EventBus
}

func GetInstance() *Client {
	once.Do(func() {
		client = &Client{
			ackChans: make(map[string]chan types.Acknowledge),
			isReady:  make(chan struct{}),
			eventBus: bus.GetInstance(),
		}
		go client.connect()
	})
	return client
}

func (c *Client) connect() {
	workerURL := url.URL{Scheme: "ws", Host: "localhost:3002", Path: "/"}
	for {
		log.Println("BRIDGE: Connecting to Worker...")
		conn, _, err := websocket.DefaultDialer.Dial(workerURL.String(), nil)
		if err != nil {
			log.Printf("BRIDGE: Worker connection failed: %v. Retrying in 5s...", err)
			time.Sleep(5 * time.Second)
			continue
		}
		c.conn = conn
		log.Println("BRIDGE: ✅ Connected to Worker.")
		close(c.isReady)

		go c.readPump()

		// Keep the connection alive
		select {}
	}
}

func (c *Client) readPump() {
	for {
		var msg types.Message
		err := c.conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("BRIDGE: Error reading from Worker: %v", err)
			c.isReady = make(chan struct{}) // Reset ready state
			go c.connect()                  // Attempt to reconnect
			return
		}

		// Handle broadcasts from Worker
		if msg.Event == "file-changed" || msg.Event == "terminal-data" {
			c.eventBus.Publish("worker.events", &msg)
		}

		// Handle acknowledgements
		if ackID, ok := msg.Data.(map[string]interface{})["ackID"].(string); ok {
			c.mu.Lock()
			if ch, exists := c.ackChans[ackID]; exists {
				ch <- types.Acknowledge{Event: msg.Event, Data: msg.Data}
				delete(c.ackChans, ackID)
			}
			c.mu.Unlock()
		}
	}
}

func (c *Client) ForwardCommand(msg *types.Message, ackID string) (types.Acknowledge, error) {
	<-c.isReady
	c.mu.Lock()
	ackChan := make(chan types.Acknowledge, 1)
	c.ackChans[ackID] = ackChan
	c.mu.Unlock()

	// Add ackID to the message payload
	if data, ok := msg.Data.(map[string]interface{}); ok {
		data["ackID"] = ackID
		msg.Data = data
	}

	err := c.conn.WriteJSON(msg)
	if err != nil {
		c.mu.Lock()
		delete(c.ackChans, ackID)
		c.mu.Unlock()
		return types.Acknowledge{}, err
	}

	select {
	case ack := <-ackChan:
		return ack, nil
	case <-time.After(10 * time.Second):
		c.mu.Lock()
		delete(c.ackChans, ackID)
		c.mu.Unlock()
		return types.Acknowledge{}, log.Output(1, "BRIDGE: Acknowledgement timeout")
	}
}

func (c *Client) SendFireAndForget(msg *types.Message) {
	<-c.isReady
	c.conn.WriteJSON(msg)
}
