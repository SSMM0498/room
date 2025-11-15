# Build Environment
FROM golang:1.25-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Copy the Go module files first to leverage Docker's layer caching.
# This step is only re-run if go.mod or go.sum changes.
COPY go.mod go.sum ./
RUN go mod tidy
RUN go mod tidy

# Copy the rest of the application's source code
COPY . .

# Build the application into a static, CGO-disabled binary. This ensures it has
# no dependencies on C libraries and can run in a minimal container.
# The output binary is named 'worker-server' and placed in the /bin directory.
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/worker-server ./cmd/worker

# Final Production Image
FROM alpine:latest

# Install Git for version control
RUN apk add --no-cache git

# Configure Git with default user for commits
RUN git config --global user.name "Room Recorder" && \
    git config --global user.email "recorder@room.dev"

# It's a good practice to run as a non-root user.
# We create a user and group specifically for our application.
RUN addgroup -S roomgroup && adduser -S roomuser -G roomgroup

# Copy only the compiled binary from the 'builder' stage into this final image
COPY --from=builder /bin/worker-server /usr/local/bin/worker-server

# Set the owner of the binary to our new user
RUN chown roomuser:roomgroup /usr/local/bin/worker-server

# The /workspace volume will be mounted by Kubernetes or Docker Compose.
# We create the directory and set ownership so the app can write to it.
RUN mkdir /workspace && chown roomuser:roomgroup /workspace
VOLUME /workspace

WORKDIR /

# Switch to the non-root user
USER roomuser

# Expose the port that the Worker WebSocket server will listen on.
# This is documentation for the user and for tools like Kubernetes.
EXPOSE 3002

# The command that will be executed when the container starts.
# It simply runs our compiled application.
CMD ["worker-server"]