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

func (m *Manager) Get(id string) (*os.File, bool) {
	m.mu.Lock()
	defer m.mu.Unlock()
	ptmx, ok := m.terminals[id]
	return ptmx, ok
}

func (m *Manager) CreateOrGet(id string, cwd string, onData func(data []byte)) (string, *os.File, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if ptmx, ok := m.terminals[id]; ok {
		return id, ptmx, nil
	}

	if id == "" {
		id = uuid.New().String()
	}

	cmd := exec.Command("bash")
	cmd.Dir = cwd
	ptmx, err := pty.Start(cmd)
	if err != nil {
		return "", nil, fmt.Errorf("failed to start pty: %w", err)
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

	return id, ptmx, nil
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