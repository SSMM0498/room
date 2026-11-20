# Go environment for workspaces: the official Go image plus the worker.
#
# The worker binary is taken from the generic worker image, so every environment
# runs the same worker. Build that image first:
#   make build-worker build-environments
FROM mrsedok/worker-image:latest AS worker

FROM golang:1.27-alpine

# Same tools and Git setup as the generic image (docker/worker/Dockerfile):
# Bash for the terminals, a Git identity for every user, and /workspace trusted
# although the volume mounted there belongs to root.
RUN apk add --no-cache git bash curl
RUN git config --system user.name "Room Recorder" && \
    git config --system user.email "recorder@room.dev" && \
    git config --system --add safe.directory /workspace

RUN addgroup -S roomgroup && adduser -S roomuser -G roomgroup

COPY --from=worker /usr/local/bin/worker-server /usr/local/bin/worker-server

RUN mkdir /workspace && chown roomuser:roomgroup /workspace
VOLUME /workspace

USER roomuser

# Compile the packages a first program usually needs once, here, so that the
# first `go run` in a workspace does not spend its time on them.
RUN go build fmt net/http encoding/json os strings errors time

WORKDIR /

# 3002: worker WebSocket server. 2025: preview proxy.
EXPOSE 3002 2025

CMD ["worker-server"]
