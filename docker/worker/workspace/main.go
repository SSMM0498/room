package main

import (
	"fmt"
	"net/http"
	"strings"
)

func helloHandler(w http.ResponseWriter, r *http.Request) {
	path := r.URL.Path
	w.Header().Set("Content-Type", "application/json")

	// Expected paths:
	//   /hello
	//   /hello/{name}
	if path == "/hello" {
		fmt.Fprintf(w, `{"message": "Hello, World!"}`)
		return
	}

	// Check if it starts with /hello/
	if strings.HasPrefix(path, "/hello/") {
		name := strings.TrimPrefix(path, "/hello/")
		// Escape double quotes in name (basic sanitization)
		name = strings.ReplaceAll(name, `"`, `\"`)
		fmt.Fprintf(w, `{"message": ">>> Hello, %s! 👋"}`, name)
		return
	}

	// If path doesn't match, return 404
	http.NotFound(w, r)
}

func main() {
	http.HandleFunc("/hello", helloHandler)
	http.HandleFunc("/hello/", helloHandler)

	fmt.Println("🚀 Server running on http://localhost:8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
