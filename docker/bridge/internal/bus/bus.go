// file: bridge/internal/bus/bus.go
package bus

import (
	"bridge/pkg/types"
	"sync"
)

// A simple pub/sub event bus
type EventBus struct {
	subscribers map[string][]chan *types.Message
	mu          sync.RWMutex
}

var (
	once   sync.Once
	busInstance *EventBus
)

func GetInstance() *EventBus {
	once.Do(func() {
		busInstance = &EventBus{
			subscribers: make(map[string][]chan *types.Message),
		}
	})
	return busInstance
}

func (b *EventBus) Subscribe(topic string, ch chan *types.Message) {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.subscribers[topic] = append(b.subscribers[topic], ch)
}

func (b *EventBus) Publish(topic string, msg *types.Message) {
	b.mu.RLock()
	defer b.mu.RUnlock()
	if chans, found := b.subscribers[topic]; found {
		// Use a goroutine to prevent blocking the publisher
		go func() {
			for _, ch := range chans {
				ch <- msg
			}
		}()
	}
}