package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
)

// Config represents the workspace configuration
type Config struct {
	Run     RunConfig     `toml:"run"`
	Preview PreviewConfig `toml:"preview"`
}

// RunConfig represents the run command configuration
type RunConfig struct {
	Command string `toml:"command"`
}

// PreviewConfig represents the preview command configuration
type PreviewConfig struct {
	Command string `toml:"command"`
	URL     string `toml:"url"`
}

// DefaultConfig returns a default configuration
func DefaultConfig() *Config {
	return &Config{
		Run: RunConfig{
			Command: "go run main.go",
		},
		Preview: PreviewConfig{
			Command: "npm run dev",
			URL:     "http://localhost:3000",
		},
	}
}

// LoadConfig loads the configuration from a TOML file
func LoadConfig(baseDir string) (*Config, error) {
	configPath := filepath.Join(baseDir, "config.toml")

	// Check if config file exists
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		// Create default config file
		defaultCfg := DefaultConfig()
		if err := SaveConfig(baseDir, defaultCfg); err != nil {
			return nil, fmt.Errorf("failed to create default config: %w", err)
		}
		return defaultCfg, nil
	}

	// Read existing config
	var cfg Config
	if _, err := toml.DecodeFile(configPath, &cfg); err != nil {
		return nil, fmt.Errorf("failed to decode config file: %w", err)
	}

	return &cfg, nil
}

// SaveConfig saves the configuration to a TOML file
func SaveConfig(baseDir string, cfg *Config) error {
	configPath := filepath.Join(baseDir, "config.toml")

	f, err := os.Create(configPath)
	if err != nil {
		return fmt.Errorf("failed to create config file: %w", err)
	}
	defer f.Close()

	encoder := toml.NewEncoder(f)
	if err := encoder.Encode(cfg); err != nil {
		return fmt.Errorf("failed to encode config: %w", err)
	}

	return nil
}
