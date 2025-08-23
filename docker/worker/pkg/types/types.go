package types

type Message struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data,omitempty"`
}

type Acknowledge struct {
	Event string      `json:"event"`
	Data  interface{} `json:"data,omitempty"`
	Error string      `json:"error,omitempty"`
}

type FileRequest struct {
	TargetPath  string `json:"targetPath"`
	FileContent string `json:"fileContent,omitempty"`
	AckID       string `json:"ackID,omitempty"`
}

type MoveRequest struct {
	TargetPath string `json:"targetPath"`
	NewPath    string `json:"newPath"`
	AckID      string `json:"ackID,omitempty"`
}

type DirectoryEntry struct {
	Type string `json:"type"`
	Path string `json:"path"`
	Name string `json:"name"`
}

type TerminalRequest struct {
	ID string `json:"id"`
}

type TerminalInput struct {
	ID    string `json:"id"`
	Input string `json:"input"`
}

type HydrateFileRequest struct {
	TargetPath    string `json:"targetPath"`
	ContentBase64 string `json:"contentBase64"` // Content is sent as a base64 string
	AckID         string `json:"ackID,omitempty"`
}
