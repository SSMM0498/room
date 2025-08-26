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
		docker build -t mrsedok/bridge-image ./docker/bridge/

build-worker:
		docker build -t mrsedok/worker-image ./docker/worker/

dev: dev-frontend dev-backend

dev-frontend:
		cd frontend && yarn dev

dev-backend:
		cd backend && go run . serve

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
		docker run -it mrsedok/bridge-image:latest /bin/sh

run-worker:
		docker run -it mrsedok/worker-image:latest /bin/sh

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
	   @echo " + dev: Start development servers for all components"
	   @echo " + dev-<component>: Start development server for a specific component"
	   @echo " + test: Run tests for all components"
	   @echo " + test-<component>: Run tests for a specific component"
	   @echo " + deploy: Deploy all components to Kubernetes"
	   @echo " + deploy-<component>: Deploy a specific component to Kubernetes"
	   @echo " + clean: Clean up all build artifacts and Docker images"
	   @echo " + clean-<component>: Clean up build artifacts for a specific component"
	   @echo " + help: Display this help message"