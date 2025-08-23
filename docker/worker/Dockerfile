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
RUN go mod tidy
RUN go mod download

# Copy the rest of the application's source code
COPY . .

# Build the application into a static, CGO-disabled binary. This ensures it has
# no dependencies on C libraries and can run in a minimal container.
# The output binary is named 'worker-server' and placed in the /bin directory.
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/worker-server ./cmd/worker


# -----------------------------------------------------------------------------
# Stage 2: The Final Production Image
#
# This stage uses a minimal base image and copies ONLY the compiled binary
# from the 'builder' stage.
# -----------------------------------------------------------------------------
FROM alpine:latest

# It's a good practice to run as a non-root user.
# We create a user and group specifically for our application.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only the compiled binary from the 'builder' stage into this final image
COPY --from=builder /bin/worker-server /usr/local/bin/worker-server

# Set the owner of the binary to our new user
RUN chown appuser:appgroup /usr/local/bin/worker-server

# The /workspace volume will be mounted by Kubernetes or Docker Compose.
# We create the directory and set ownership so the app can write to it.
RUN mkdir /workspace && chown appuser:appgroup /workspace
VOLUME /workspace

# Switch to the non-root user
USER appuser

# Expose the port that the Worker WebSocket server will listen on.
# This is documentation for the user and for tools like Kubernetes.
EXPOSE 3002

# The command that will be executed when the container starts.
# It simply runs our compiled application.
CMD ["worker-server"]