package worker

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"bridge/internal/bus"
	"bridge/internal/minioClient"
	"bridge/pkg/types"

	"github.com/gorilla/websocket"
	"github.com/minio/minio-go/v7"
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
	send     chan *types.Message
	eventBus *bus.EventBus
}

func GetInstance() *Client {
	once.Do(func() {
		client = &Client{
			ackChans: make(map[string]chan types.Acknowledge),
			eventBus: bus.GetInstance(),
			send:     make(chan *types.Message, 256),
			isReady:  make(chan struct{}),
		}
		close(client.isReady)

		// Start the single, lifelong writePump
		go client.writePump()
		// Start the single, lifelong connection supervisor
		go client.supervisor()
	})
	return client
}

func (c *Client) supervisor() {
	workerHost := os.Getenv("WORKER_HOST")
	if workerHost == "" {
		workerHost = "localhost:3002" // sensible default
	}
	workerURL := url.URL{Scheme: "ws", Host: workerHost, Path: "/"}

	for {
		log.Println("BRIDGE: Attempting to connect to Worker...")

		conn, _, err := websocket.DefaultDialer.Dial(workerURL.String(), nil)
		if err != nil {
			log.Printf("BRIDGE: Worker connection failed: %v. Retrying in 5s...", err)
			time.Sleep(5 * time.Second)
			continue // Retry connection loop
		}

		// --- Connection Successful ---
		c.mu.Lock()
		c.conn = conn
		c.mu.Unlock()
		log.Println("BRIDGE: ✅ Connected to Worker.")

		// Create a new channel to signal when THIS specific readPump is done.
		readPumpDone := make(chan struct{})

		// The isReady channel is now managed ONLY within this loop.
		c.isReady = make(chan struct{})

		// Start the readPump for this connection.
		go c.readPump(readPumpDone)

		// Signal that the connection is now ready for use.
		// NOTE: Init message will be sent by frontend, not automatically by Bridge
		close(c.isReady)

		// Wait here until the readPump for this connection exits.
		// When it exits, it means the connection is lost.
		<-readPumpDone
		log.Println("BRIDGE: Disconnection detected. Restarting connection cycle.")
	}
}

func (c *Client) readPump(done chan<- struct{}) {
	defer func() {
		c.mu.Lock()
		c.conn.Close()
		c.conn = nil
		c.mu.Unlock()
		close(done) // Signal to the supervisor that this pump has finished.
	}()

	for {
		var msg types.Message
		err := c.conn.ReadJSON(&msg)
		if err != nil {
			log.Printf("BRIDGE: Error reading from Worker (disconnecting): %v", err)
			return // Exit to trigger the defer and signal disconnect.
		}

		log.Printf("[BRIDGE] Worker → Bridge: event=%s", msg.Event)

		if msg.Event == "file-changed" || msg.Event == "terminal-data" || msg.Event == "workspace:commit" {
			log.Printf("[BRIDGE] Publishing event to EventBus: %s", msg.Event)
			c.eventBus.Publish("worker.events", &msg)
		}

		if ackID, ok := msg.Data.(map[string]interface{})["ackID"].(string); ok {
			c.mu.Lock()
			if ch, exists := c.ackChans[ackID]; exists {
				log.Printf("[BRIDGE] Resolving ackID=%s for event=%s", ackID, msg.Event)
				ch <- types.Acknowledge{Event: msg.Event, Data: msg.Data}
				delete(c.ackChans, ackID)
			}
			c.mu.Unlock()
		}
	}
}

func (c *Client) writePump() {
	for msg := range c.send {
		c.mu.Lock()
		if c.conn == nil {
			log.Printf("BRIDGE: writePump trying to write event '%s', but connection is nil. Skipping.", msg.Event)
			c.mu.Unlock()
			continue
		}
		log.Printf("[BRIDGE] Bridge → Worker: event=%s", msg.Event)
		err := c.conn.WriteJSON(msg)
		c.mu.Unlock()

		if err != nil {
			log.Printf("BRIDGE: Error writing to Worker: %v", err)
		}
	}
}

func (c *Client) ForwardCommand(msg *types.Message, ackID string) (types.Acknowledge, error) {
	select {
	case <-c.isReady:
		// Connection is ready, proceed.
	default:
		return types.Acknowledge{}, fmt.Errorf("BRIDGE: Connection not ready for event %s", msg.Event)
	}

	c.mu.Lock()
	ackChan := make(chan types.Acknowledge, 1)
	c.ackChans[ackID] = ackChan
	c.mu.Unlock()

	// Add the internal ackID to the message payload.
	if data, ok := msg.Data.(map[string]interface{}); ok {
		data["ackID"] = ackID // This overwrites the frontend's ackID for the internal trip.
		msg.Data = data
	}

	c.send <- msg

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
	select {
	case <-c.isReady:
		// Connection is ready, proceed.
	default:
		// Silently drop if not ready, or log a warning.
		log.Printf("BRIDGE: Connection not ready, dropping fire-and-forget event %s", msg.Event)
		return
	}
	c.send <- msg
}

func (c *Client) TriggerHydration() {
	// Skip hydration in development mode
	env := os.Getenv("ENV")
	if env != "DEV" {
		c.hydrateWorkspace()
	} else {
		log.Println("[BRIDGE] DEV mode detected - skipping workspace hydration")
	}
}

func (c *Client) hydrateWorkspace() {
	// 1. Get Workspace ID from the environment variable.
	workspaceID := os.Getenv("WORKSPACE_ID")
	if workspaceID == "" {
		workspaceID = "demo"
		log.Printf("[BRIDGE] WARNING - WORKSPACE_ID not set, falling back to default for hydration: %s", workspaceID)
	}

	log.Printf("[BRIDGE] Starting workspace hydration for %s...", workspaceID)

	minioClient, err := minioClient.NewClient()
	if err != nil {
		log.Printf("[BRIDGE] ⛔ HYDRATION FAILED (MinIO connect): %v", err)
		return
	}

	recordID := strings.TrimPrefix(workspaceID, "ws-")
	s3Path := "workspaces/" + recordID
	bucketName := "room" // Should be from config

	objectCh := minioClient.ListObjects(context.Background(), bucketName, minio.ListObjectsOptions{
		Prefix:    s3Path,
		Recursive: true,
	})

	var wg sync.WaitGroup
	log.Printf("[BRIDGE] Hydrating from s3://%s/%s", bucketName, s3Path)

	for object := range objectCh {
		if object.Err != nil {
			log.Printf("[MINIO] Error listing object: %v", object.Err)
			continue
		}
		if strings.HasSuffix(object.Key, "/") {
			continue
		}

		wg.Add(1)
		go func(objKey string) {
			defer wg.Done()

			object, err := minioClient.GetObject(context.Background(), bucketName, objKey, minio.GetObjectOptions{})
			if err != nil {
				log.Printf("Failed to get object %s: %v", objKey, err)
				return
			}

			contentBytes, err := io.ReadAll(object)
			if err != nil {
				log.Printf("Failed to read object %s: %v", objKey, err)
				return
			}

			contentBase64 := base64.StdEncoding.EncodeToString(contentBytes)
			relativePath := strings.Replace(objKey, s3Path, "/workspace", 1)

			hydrateMsg := &types.Message{
				Event: "hydrate-create-file",
				Data: types.HydrateFileRequest{
					TargetPath:    relativePath,
					ContentBase64: contentBase64,
				},
			}

			c.SendFireAndForget(hydrateMsg)
		}(object.Key)
	}

	wg.Wait()
	log.Println("[BRIDGE] ✅ Workspace hydration complete.")

	// Notify frontend that hydration is complete
	c.SendFireAndForget(&types.Message{
		Event: "hydration-complete",
		Data:  map[string]interface{}{},
	})
}
