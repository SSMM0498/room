package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"worker/internal/filesystem"
	"worker/internal/terminal"
	"worker/pkg/types"

	"github.com/gorilla/websocket"
)

type Handler struct {
	hub        *Hub
	fsSvc      *filesystem.Service
	termSvc    *terminal.Service
}

func NewHandler(hub *Hub, fsSvc *filesystem.Service, termSvc *terminal.Service) *Handler {
	return &Handler{hub: hub, fsSvc: fsSvc, termSvc: termSvc}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}
	client := &Client{hub: h.hub, Conn: conn, Send: make(chan *types.Message, 256)}
	client.hub.Register <- client

	go client.writePump()
	client.readPump(h)
}

type Client struct {
	hub  *Hub
	Conn *websocket.Conn
	Send chan *types.Message
}

func (c *Client) readPump(h *Handler) {
	defer func() {
		c.hub.Unregister <- c
		c.Conn.Close()
	}()

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		
		var msg types.Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("WORKER: Error unmarshaling message: %v", err)
			continue
		}
		
		go h.routeMessage(c, msg)
	}
}

func (c *Client) writePump() {
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

func (h *Handler) routeMessage(client *Client, msg types.Message) {
	dataBytes, _ := json.Marshal(msg.Data)
	ack := types.Acknowledge{Event: msg.Event}
    var reqAckID string

	var tempData map[string]interface{}
	if json.Unmarshal(dataBytes, &tempData) == nil {
		if id, ok := tempData["ackID"].(string); ok {
			reqAckID = id
		}
	}
	ack.Data = map[string]interface{}{"ackID": reqAckID}

	switch msg.Event {
	case "init":
		log.Println("WORKER: Bridge initialized.")
		return
	case "hydrate-create-file":
		var req types.HydrateFileRequest
		json.Unmarshal(dataBytes, &req)
		err := h.fsSvc.CreateFile(req.TargetPath, req.ContentBase64)
		if err != nil {
			ack.Error = err.Error()
		}
	case "crud-read-folder":
		var req types.FileRequest
		json.Unmarshal(dataBytes, &req)
		entries, err := h.fsSvc.ReadFolder(req.TargetPath)
		if err != nil {
			ack.Error = err.Error()
		} else {
			ack.Data = map[string]interface{}{"folderContents": entries, "ackID": reqAckID}
		}
	case "crud-read-file":
		var req types.FileRequest
		json.Unmarshal(dataBytes, &req)
		content, err := h.fsSvc.ReadFile(req.TargetPath)
		if err != nil {
			ack.Error = err.Error()
		} else {
			ack.Data = map[string]interface{}{"fileContent": content, "ackID": reqAckID}
		}
	case "crud-update-file":
		var req types.FileRequest
		json.Unmarshal(dataBytes, &req)
		err := h.fsSvc.UpdateFile(req.TargetPath, req.FileContent)
		if err != nil {
			ack.Error = err.Error()
		}
    case "crud-create-file":
        var req types.FileRequest
		json.Unmarshal(dataBytes, &req)
		err := h.fsSvc.CreateFile(req.TargetPath, req.FileContent)
		if err != nil {
			ack.Error = err.Error()
		}
    case "crud-create-folder":
        var req types.FileRequest
		json.Unmarshal(dataBytes, &req)
		err := h.fsSvc.CreateFolder(req.TargetPath)
		if err != nil {
			ack.Error = err.Error()
		}
    case "crud-delete-resource":
        var req types.FileRequest
		json.Unmarshal(dataBytes, &req)
		err := h.fsSvc.DeleteResource(req.TargetPath)
		if err != nil {
			ack.Error = err.Error()
		}
    case "crud-move-resource":
        var req types.MoveRequest
		json.Unmarshal(dataBytes, &req)
		err := h.fsSvc.MoveResource(req.TargetPath, req.NewPath)
		if err != nil {
			ack.Error = err.Error()
		}
	case "create-terminal":
		var req types.TerminalRequest
		json.Unmarshal(dataBytes, &req)
		_, err := h.termSvc.CreateTerminal(req.ID, func(data []byte) {
			client.hub.Send(&types.Message{
				Event: "terminal-data",
				Data:  map[string]interface{}{"id": req.ID, "content": string(data)},
			})
		})
		if err != nil {
			ack.Error = err.Error()
		}
	case "terminal-input":
		var req types.TerminalInput
		json.Unmarshal(dataBytes, &req)
		h.termSvc.WriteToTerminal(req)
		return 
    case "close-terminal":
        var req types.TerminalRequest
        json.Unmarshal(dataBytes, &req)
        h.termSvc.CloseTerminal(req.ID)
	default:
		log.Printf("WORKER: Unknown event type: %s", msg.Event)
		return
	}

	if reqAckID != "" {
		// --- THIS IS THE FIX ---
		responseMsg := &types.Message{
			Event: ack.Event,
			Data:  ack.Data,
		}
		// If there was an error, we can add it to the Data payload
		if ack.Error != "" {
			if dataMap, ok := responseMsg.Data.(map[string]interface{}); ok {
				dataMap["error"] = ack.Error
			}
		}
		
		client.Send <- responseMsg
	}
}