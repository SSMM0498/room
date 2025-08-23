package ws

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync"

	"bridge/internal/minioClient"
	"bridge/internal/worker"
	"bridge/pkg/types"

	"github.com/minio/minio-go/v7"
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
	hydration sync.Once
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

	go func() {
		hydration.Do(func() {
			log.Println("BRIDGE: First client connected. Starting workspace hydration...")
			err := hydrateWorkspace(r.Host, workerClient)
			if err != nil {
				log.Printf("BRIDGE: ⛔ WORKSPACE HYDRATION FAILED: %v", err)
				// In a real app, you might want to terminate the pod or notify clients of the failure.
			}
		})
	}()

	go client.WritePump()
	go client.ReadPump()
}

func hydrateWorkspace(host string, workerClient *worker.Client) error {
	// 1. Extract Workspace ID from the host (e.g., jkl4mno5pqr.room.com -> jkl4mno5pqr)
	parts := strings.Split(host, ".")
	if len(parts) == 0 {
		return fmt.Errorf("invalid host format for hydration: %s", host)
	}
	workspaceID := parts[0]

	// 2. Initialize clients
	minioClient, err := minioClient.NewClient()
	if err != nil {
		return err
	}

	// 3. Get the S3 path
	s3Path := "workspaces/" + workspaceID

	// 4. List objects in MinIO
	bucketName := "r00m" // Should be from config
	objectCh := minioClient.ListObjects(context.Background(), bucketName, minio.ListObjectsOptions{
		Prefix:    s3Path,
		Recursive: true,
	})

	var wg sync.WaitGroup
	log.Printf("BRIDGE: Hydrating from s3://%s/%s", bucketName, s3Path)

	for object := range objectCh {
		if object.Err != nil {
			log.Printf("MINIO Error listing object: %v", object.Err)
			continue
		}
		// Skip directories
		if strings.HasSuffix(object.Key, "/") {
			continue
		}

		wg.Add(1)
		go func(objKey string) {
			defer wg.Done()

			// 5. Get object content
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

			// 6. Base64 encode and prepare worker command
			contentBase64 := base64.StdEncoding.EncodeToString(contentBytes)
			targetPath := strings.Replace(objKey, s3Path, "/workspace", 1)

			hydrateMsg := &types.Message{
				Event: "hydrate-create-file",
				Data: types.HydrateFileRequest{
					TargetPath:    targetPath,
					ContentBase64: contentBase64,
				},
			}

			// 7. Send command to worker (fire and forget is okay for hydration)
			workerClient.SendFireAndForget(hydrateMsg)
			log.Printf("BRIDGE: Sent file for hydration: %s", targetPath)

		}(object.Key)
	}

	wg.Wait()
	log.Println("BRIDGE: ✅ Workspace hydration complete.")
	return nil
}
