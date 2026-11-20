.PHONY: build build-frontend build-backend build-bridge build-worker \
	       dev dev-frontend dev-backend \
	       dev-k8s k8s-setup k8s-check k8s-storage k8s-clean \
	       test test-frontend test-backend \
	       deploy deploy-backend deploy-bridge deploy-worker \
	       clean clean-frontend clean-bridge clean-worker \
	       help

build: build-frontend build-backend build-bridge build-worker

build-frontend:
		cd frontend && yarn build

build-backend:
		cd backend && go build .

build-bridge:
		docker build --progress=plain -t mrsedok/bridge-image ./docker/bridge/

build-worker:
		docker build --progress=plain -t mrsedok/worker-image ./docker/worker/

dev: dev-frontend dev-backend

dev-frontend:
		cd frontend && yarn dev

dev-backend:
		cd backend && go run . serve

dev-bridge:
		cd docker/bridge && ENV=DEV WORKSPACE_ID=demo WORKER_HOST=localhost:3002 go run cmd/bridge/main.go

dev-worker:
		cd docker/worker && ENV=DEV WORKER_WORKSPACE_DIR=$(PWD)/workspace go run cmd/worker/main.go

dev-docker:
		cd docker && docker-compose -f dev.docker-compose.yml up --build

# --- Local Kubernetes: one pod per workspace, routed by sub-domain as in production.
# Needs Docker Desktop with Kubernetes turned on (Settings > Kubernetes).
#   make k8s-setup   once
#   make dev-k8s     instead of dev-frontend (no dev-bridge / dev-worker needed)
# After changing the bridge or the worker, build-bridge / build-worker is enough:
# pods use the new image the next time a workspace starts.
K8S_CONTEXT ?= docker-desktop
KUBECTL = kubectl --context $(K8S_CONTEXT)

k8s-check:
		@$(KUBECTL) get nodes >/dev/null 2>&1 || { \
			echo "No Kubernetes cluster answers on context '$(K8S_CONTEXT)'."; \
			echo "Turn Kubernetes on in Docker Desktop (Settings > Kubernetes), then retry."; \
			exit 1; }

# Installs what every workspace pod relies on: the bridge and worker images and
# the ingress controller that routes the sub-domains.
k8s-setup: k8s-check build-bridge build-worker
		$(KUBECTL) create namespace ingress-nginx --dry-run=client -o yaml | $(KUBECTL) apply -f -
		$(KUBECTL) apply -f docker/ingress-controller.yaml
		$(KUBECTL) wait --namespace ingress-nginx --for=condition=Available deployment/ingress-nginx-controller --timeout=300s
		@echo "Ready. Start the app with: make dev-backend, then make dev-k8s"
		@echo "Workspaces start empty until their file storage is set up: make k8s-storage"

# Starts the object storage (SeaweedFS), uploads the workspace templates, and
# tells the pods where to find it. The credentials are the ones Nuxt uses
# (frontend/.env). Its file browser is at http://localhost:8888/buckets/.
k8s-storage: k8s-check
		docker compose --env-file frontend/.env -f docker/storage.docker-compose.yml up -d
		cd frontend && node --env-file=.env scripts/upload-templates.mjs
		@set -a; . frontend/.env; set +a; \
		$(KUBECTL) create secret generic room-minio \
			--from-literal=MINIO_ENDPOINT=host.docker.internal:$${MINIO_PORT:-9000} \
			--from-literal=MINIO_ACCESS_KEY="$$MINIO_ROOT_USER" \
			--from-literal=MINIO_SECRET_KEY="$$MINIO_ROOT_PASSWORD" \
			--from-literal=MINIO_BUCKET=$${MINIO_BUCKET:-room} \
			--dry-run=client -o yaml | $(KUBECTL) apply -f -

dev-k8s:
		cd frontend && WORKSPACE_RUNTIME=k8s yarn dev

# Removes every workspace pod. Workspaces are started again on demand.
k8s-clean:
		$(KUBECTL) delete deployment,service,ingress -l app.kubernetes.io/part-of=room-workspace

test: test-frontend test-backend 

test-frontend:
		cd frontend && yarn test

test-backend:
		cd backend && yarn test

deploy: deploy-backend deploy-bridge deploy-worker

deploy-backend:
		kubectl apply -f kubernetes/deployments/backend.yaml
		kubectl apply -f kubernetes/services/backend.yaml

deploy-bridge:
		docker push mrsedok/bridge-image:latest

deploy-worker:
		docker push mrsedok/worker-image:latest

run-bridge:
		docker rm bridge ; docker run -it -p 2024:2024 --name bridge mrsedok/bridge-image:latest

run-worker:
		docker rm worker ; docker run -it -p 3002:3002 --name worker mrsedok/worker-image:latest

clean: clean-frontend clean-bridge clean-worker

clean-frontend:
		rm -rf frontend/.nuxt

clean-backend:
		rm -rf pb_data

clean-bridge:
		docker image rm bridge-image:latest

clean-worker:
		docker image rm worker-image:latest

help:
	   @echo "Components:"
	   @echo " + frontend, backend, bridge, worker"
	   @echo "Available targets:"
	   @echo " + build: Build all components"
	   @echo " + build-<component>: Build a specific component (e.g., build-frontend)"
	   @echo " + dev: Start development servers for frontend and backend"
	   @echo " + dev-<component>: Start development server for a specific component"
	   @echo " + dev-bridge: Run bridge locally (requires worker running)"
	   @echo " + dev-worker: Run worker locally using local workspace folder"
	   @echo " + dev-docker: Run bridge and worker in Docker with local workspace mounted"
	   @echo " + k8s-setup: Prepare the local Kubernetes cluster (images, ingress) for per-workspace pods"
	   @echo " + k8s-storage: Start the object storage (SeaweedFS) and upload the workspace templates"
	   @echo " + dev-k8s: Start the frontend with every workspace running in its own local pod"
	   @echo " + k8s-clean: Delete every workspace pod from the local cluster"
	   @echo " + test: Run tests for all components"
	   @echo " + test-<component>: Run tests for a specific component"
	   @echo " + deploy: Deploy all components to Kubernetes"
	   @echo " + deploy-<component>: Deploy a specific component to Kubernetes"
	   @echo " + clean: Clean up all build artifacts and Docker images"
	   @echo " + clean-<component>: Clean up build artifacts for a specific component"
	   @echo " + help: Display this help message"