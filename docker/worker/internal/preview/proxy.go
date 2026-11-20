// Package preview makes the app started by the workspace's preview command
// reachable from the learner's browser when the worker runs inside a pod.
//
// On a developer's machine the mini-browser loads the address written in
// config.toml (http://localhost:3000) directly. Inside a pod that address only
// exists in the pod, so the worker serves it through a reverse proxy on a fixed
// port that the workspace Ingress exposes as its own sub-domain.
package preview

import (
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"

	"worker/internal/config"
)

// ProxyAddr is the port the workspace Service and Ingress route the preview to.
const ProxyAddr = ":2025"

// publicURLEnv names the variable holding the address the browser can reach the
// proxy on, e.g. http://preview-ws-abc.localhost. It is set by the pod manifest.
const publicURLEnv = "PREVIEW_PUBLIC_URL"

// Enabled reports whether the preview has to go through the proxy.
func Enabled() bool {
	return os.Getenv(publicURLEnv) != ""
}

// PublicURL returns the address the mini-browser must load for a preview whose
// app listens on appURL inside the workspace.
func PublicURL(appURL string) string {
	if public := os.Getenv(publicURLEnv); public != "" {
		return public
	}
	return appURL
}

// NewProxy forwards every request to the preview address of the workspace.
//
// The address is read from config.toml on each request, so editing the config
// and restarting the preview takes effect without restarting the worker.
func NewProxy(workspaceDir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// LoadConfig writes a default config.toml when there is none. A request
		// must not add files to the workspace, so the defaults are used as is.
		cfg := config.DefaultConfig()
		if _, err := os.Stat(filepath.Join(workspaceDir, "config.toml")); err == nil {
			cfg, err = config.LoadConfig(workspaceDir)
			if err != nil {
				http.Error(w, "Preview unavailable: "+err.Error(), http.StatusInternalServerError)
				return
			}
		}

		target, err := url.Parse(cfg.Preview.URL)
		if err != nil || target.Host == "" {
			http.Error(w, fmt.Sprintf("Preview unavailable: invalid preview url %q in config.toml", cfg.Preview.URL), http.StatusBadGateway)
			return
		}

		proxy := &httputil.ReverseProxy{
			// SetURL also rewrites the Host header to the app's own address, so dev
			// servers that reject unknown hosts answer as they do on localhost.
			Rewrite: func(pr *httputil.ProxyRequest) {
				pr.SetURL(target)
			},
			ErrorHandler: func(w http.ResponseWriter, _ *http.Request, err error) {
				log.Printf("[PREVIEW] %s is not answering: %v", target.Host, err)
				http.Error(w, fmt.Sprintf("Nothing is listening on %s yet. Start the preview command and reload.", target.Host), http.StatusBadGateway)
			},
		}
		proxy.ServeHTTP(w, r)
	})
}
