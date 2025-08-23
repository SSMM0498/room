package types

// Message represents the generic structure for WebSocket communication.
type Message struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
}

// Acknowledge represents a generic response structure for command acknowledgements.
type Acknowledge struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data"`
	Error string      `json:"error,omitempty"`
}


type HydrateFileRequest struct {
	TargetPath    string `json:"targetPath"`
	ContentBase64 string `json:"contentBase64"` // Content is sent as a base64 string
	AckID         string `json:"ackID,omitempty"`
}
