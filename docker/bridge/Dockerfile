# -----------------------------------------------------------------------------
# Stage 1: The Build Environment
#
# This stage uses a full Go development image to build our application.
# It contains all the tools needed to compile the Go source code.
# -----------------------------------------------------------------------------
FROM golang:1.21-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the Go module files first to leverage Docker's layer caching.
# This step is only re-run if go.mod or go.sum changes.
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application's source code
COPY . .

# Build the application into a static, CGO-disabled binary. This ensures it has
# no dependencies on C libraries and can run in a minimal container.
# The output binary is named 'bridge-server' and placed in the root directory.
RUN CGO_ENABLED=0 GOOS=linux go build -o /bridge-server ./cmd/bridge


# -----------------------------------------------------------------------------
# Stage 2: The Final Production Image
#
# This stage uses a minimal base image and copies ONLY the compiled binary
# from the 'builder' stage. The final image will be very small.
# -----------------------------------------------------------------------------
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
CMD ["/bridge-server "]