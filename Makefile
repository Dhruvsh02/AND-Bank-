.PHONY: help setup dev prod test clean logs migrate

help:
	@echo "AND Bank - Available Commands"
	@echo "─────────────────────────────────────"
	@echo "make setup      - First-time setup (copy .env files)"
	@echo "make dev        - Start all services in development mode"
	@echo "make prod       - Start all services in production mode"
	@echo "make test       - Run all tests (backend + frontend)"
	@echo "make migrate    - Run all DB migrations"
	@echo "make logs       - Tail all service logs"
	@echo "make clean      - Stop and remove all containers + volumes"
	@echo "make frontend   - Start only frontend dev server"
	@echo "make shell-auth - Open shell in auth-service container"

setup:
	@echo "🔧 Setting up AND Bank..."
	cp .env.example .env
	cp frontend/.env.example frontend/.env.development
	@for svc in auth-service user-service transaction-service loan-service card-service notification-service admin-service chat-service; do \
		cp backend/services/$$svc/.env.example backend/services/$$svc/.env; \
	done
	@echo "✅ .env files created. Edit them with your secrets before starting."

dev:
	@echo "🚀 Starting AND Bank in development mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

prod:
	@echo "🚀 Starting AND Bank in production mode..."
	docker-compose up -d --build

test:
	@echo "🧪 Running all tests..."
	$(MAKE) test-backend
	$(MAKE) test-frontend

test-backend:
	@echo "🧪 Running backend tests..."
	@for svc in auth-service user-service transaction-service loan-service card-service admin-service; do \
		echo "Testing $$svc..."; \
		docker-compose run --rm $$svc python manage.py test --verbosity=2; \
	done

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm run test

migrate:
	@echo "🗄️ Running database migrations..."
	@for svc in auth-service user-service transaction-service loan-service card-service notification-service admin-service chat-service; do \
		echo "Migrating $$svc..."; \
		docker-compose run --rm $$svc python manage.py migrate; \
	done

makemigrations:
	@for svc in auth-service user-service transaction-service loan-service card-service notification-service admin-service chat-service; do \
		echo "Making migrations for $$svc..."; \
		docker-compose run --rm $$svc python manage.py makemigrations; \
	done

logs:
	docker-compose logs -f

clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

frontend:
	cd frontend && npm run dev

shell-auth:
	docker-compose exec auth-service bash

shell-user:
	docker-compose exec user-service bash

shell-db:
	docker-compose exec mysql mysql -u root -p

superuser:
	docker-compose exec auth-service python manage.py createsuperuser
