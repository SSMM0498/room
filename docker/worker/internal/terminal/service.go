package terminal

import (
	"worker/pkg/types"
)

type Service struct {
	manager      *Manager
	workspaceDir string
}

func NewService(workspaceDir string) *Service {
	return &Service{
		manager:      NewManager(),
		workspaceDir: workspaceDir,
	}
}

func (s *Service) CreateOrGetTerminal(id string, onData func(data []byte)) (string, error) {
	if s.workspaceDir == "./" {
		createdID, _, err := s.manager.CreateOrGet(id, "./workspace", onData)
		return createdID, err
	} else {
		createdID, _, err := s.manager.CreateOrGet(id, s.workspaceDir, onData)
		return createdID, err
	}
}

func (s *Service) WriteToTerminal(data types.TerminalInput) error {
	return s.manager.Write(data.ID, data.Input)
}

func (s *Service) CloseTerminal(id string) {
	s.manager.Close(id)
}
