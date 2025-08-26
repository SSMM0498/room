# Build Environment
FROM golang:1.25-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the Go module files first to leverage Docker's layer caching.
# This step is only re-run if go.mod or go.sum changes.
COPY go.mod go.sum ./
RUN go mod tidy

# Copy the rest of the application's source code
COPY . .

# Build the application into a static, CGO-disabled binary. This ensures it has
# no dependencies on C libraries and can run in a minimal container.
# The output binary is named 'bridge-server' and placed in the root directory.
RUN CGO_ENABLED=0 GOOS=linux go build -o /bridge-server ./cmd/bridge

# Final Production Image
FROM alpine:latest

# Set the working directory
WORKDIR /

# Copy the compiled binary from the 'builder' stage into this final image
COPY --from=builder /bridge-server /bridge-server

# Expose the port that the Bridge WebSocket server will listen on.
# This is documentation for the user and for tools like Kubernetes.
EXPOSE 2024

# The command that will be executed when the container starts.
# It simply runs our compiled application.
CMD ["/bridge-server"]