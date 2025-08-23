package terminal

import (
	"fmt"
	"os"
	"os/exec"
	"sync"

	"github.com/creack/pty"
	"github.com/google/uuid"
)

type Manager struct {
	terminals map[string]*os.File
	mu        sync.Mutex
}

func NewManager() *Manager {
	return &Manager{
		terminals: make(map[string]*os.File),
	}
}

func (m *Manager) Create(id string, onData func(data []byte)) (string, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if id == "" {
		id = uuid.New().String()
	}

	if _, ok := m.terminals[id]; ok {
		return "", fmt.Errorf("terminal with id %s already exists", id)
	}

	cmd := exec.Command("bash")
	ptmx, err := pty.Start(cmd)
	if err != nil {
		return "", fmt.Errorf("failed to start pty: %w", err)
	}

	m.terminals[id] = ptmx

	go func() {
		defer m.Close(id) // Ensure cleanup when the reader exits.

		buf := make([]byte, 4096)
		for {
			n, err := ptmx.Read(buf)
			if err != nil {
				// This error often occurs when the PTY is closed, which is normal.
				// We can log it for debugging but it's not a critical failure.
				// log.Printf("Terminal %s reader exited: %v", id, err)
				return
			}
			if n > 0 {
				// Send a copy of the buffer slice to the callback.
				dataCopy := make([]byte, n)
				copy(dataCopy, buf[:n])
				onData(dataCopy)
			}
		}
	}()

	return id, nil
}

func (m *Manager) Write(id string, data string) error {
	m.mu.Lock()
	ptmx, ok := m.terminals[id]
	m.mu.Unlock()

	if !ok {
		return fmt.Errorf("terminal not found: %s", id)
	}

	_, err := ptmx.Write([]byte(data))
	return err
}

func (m *Manager) Close(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if ptmx, ok := m.terminals[id]; ok {
		ptmx.Close()
		delete(m.terminals, id)
	}
}