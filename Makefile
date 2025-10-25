.PHONY: build build-frontend build-backend build-bridge build-worker \
	       dev dev-frontend dev-backend \
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
	   @echo " + test: Run tests for all components"
	   @echo " + test-<component>: Run tests for a specific component"
	   @echo " + deploy: Deploy all components to Kubernetes"
	   @echo " + deploy-<component>: Deploy a specific component to Kubernetes"
	   @echo " + clean: Clean up all build artifacts and Docker images"
	   @echo " + clean-<component>: Clean up build artifacts for a specific component"
	   @echo " + help: Display this help message"