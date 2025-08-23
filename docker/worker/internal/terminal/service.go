package terminal

import (
	"worker/pkg/types"
)

type Service struct {
	manager *Manager
}

func NewService() *Service {
	return &Service{
		manager: NewManager(),
	}
}

func (s *Service) CreateTerminal(id string, onData func(data []byte)) (string, error) {
	return s.manager.Create(id, onData)
}

func (s *Service) WriteToTerminal(data types.TerminalInput) error {
	return s.manager.Write(data.ID, data.Input)
}

func (s *Service) CloseTerminal(id string) {
	s.manager.Close(id)
}