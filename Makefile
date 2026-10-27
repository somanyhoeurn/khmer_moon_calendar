# Khmer Moon Calendar - common development tasks. Run from the repository root.
SHELL := /usr/bin/env bash
COMPOSE := docker compose
PROD_COMPOSE := docker compose -f infra/deployment/docker-compose.prod.yml --env-file .env

.PHONY: help setup dev up down logs migrate seed test test-e2e lint typecheck build prod-up prod-migrate clean

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-14s %s\n", $$1, $$2}'

setup: ## Install dependencies, migrate and seed a local database
	bash scripts/setup.sh

dev: ## Run backend and frontend locally (no Docker)
	bash scripts/dev.sh

up: ## Start the Docker development stack
	$(COMPOSE) up --build -d

down: ## Stop the Docker development stack
	$(COMPOSE) down

logs: ## Follow Docker logs
	$(COMPOSE) logs -f

migrate: ## Apply database migrations (Docker stack)
	$(COMPOSE) exec backend alembic upgrade head

seed: ## Load verified seed data (Docker stack)
	$(COMPOSE) exec backend python -m app.db.seed

test: ## Run backend and frontend tests
	bash scripts/test.sh

test-e2e: ## Run Playwright end-to-end tests against a running stack
	npx playwright test

lint: ## Lint and type-check everything
	bash scripts/lint.sh

typecheck: ## Type-check backend and frontend
	cd backend && python -m mypy app
	npm --prefix frontend run typecheck

build: ## Build the production frontend bundle
	npm --prefix frontend run build

prod-up: ## Build and start the production stack (Nginx on :80)
	$(PROD_COMPOSE) up -d --build

prod-migrate: ## Run migrations + seed in production
	$(PROD_COMPOSE) run --rm migrate

clean: ## Remove build artifacts and caches
	rm -rf frontend/.next frontend/coverage test-results backend/.pytest_cache backend/.mypy_cache backend/.ruff_cache
