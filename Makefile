.PHONY: help install build start stop restart logs \
        db-start db-stop db-restart db-logs \
        server-start server-stop server-restart server-logs \
        client-start client-stop client-restart client-logs \
        dev clean status kill-ports

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m # No Color

# Port definitions
CLIENT_PORT := 3000
SERVER_PORT := 3001

# PID files
SERVER_PID_FILE := .server.pid
CLIENT_PID_FILE := .client.pid

# Default target
help:
	@echo ""
	@echo "$(GREEN)SUNDERING - Project Management$(NC)"
	@echo ""
	@echo "$(YELLOW)Full Stack Commands:$(NC)"
	@echo "  make start        - Start everything (db, server, client)"
	@echo "  make stop         - Stop everything"
	@echo "  make restart      - Restart everything"
	@echo "  make status       - Show status of all services"
	@echo "  make logs         - Show logs from all services"
	@echo ""
	@echo "$(YELLOW)Database Commands:$(NC)"
	@echo "  make db-start     - Start PostgreSQL and Redis containers"
	@echo "  make db-stop      - Stop database containers"
	@echo "  make db-restart   - Restart database containers"
	@echo "  make db-logs      - Show database logs"
	@echo ""
	@echo "$(YELLOW)Server Commands:$(NC)"
	@echo "  make server-start - Start the game server"
	@echo "  make server-stop  - Stop the game server"
	@echo "  make server-restart - Restart the game server"
	@echo "  make server-logs  - Show server logs"
	@echo ""
	@echo "$(YELLOW)Client Commands:$(NC)"
	@echo "  make client-start - Start the client dev server"
	@echo "  make client-stop  - Stop the client dev server"
	@echo "  make client-restart - Restart the client dev server"
	@echo "  make client-logs  - Show client logs"
	@echo ""
	@echo "$(YELLOW)Development Commands:$(NC)"
	@echo "  make install      - Install all dependencies"
	@echo "  make build        - Build shared package"
	@echo "  make dev          - Start in development mode (db + server + client)"
	@echo "  make clean        - Clean node_modules and build artifacts"
	@echo "  make kill-ports   - Force kill processes on ports 3000-3003"
	@echo ""

# =============================================================================
# UTILITY COMMANDS
# =============================================================================

# Force kill all processes on ports 3000-3003
kill-ports:
	@echo "$(YELLOW)Force killing all processes on ports 3000-3003...$(NC)"
	@lsof -ti :3000,:3001,:3002,:3003 2>/dev/null | xargs -r kill -9 2>/dev/null || true
	@rm -f $(SERVER_PID_FILE) $(CLIENT_PID_FILE)
	@echo "$(GREEN)Ports cleared$(NC)"

# =============================================================================
# FULL STACK COMMANDS
# =============================================================================

start: db-start
	@echo "$(GREEN)Starting all services...$(NC)"
	@sleep 2
	@$(MAKE) server-start
	@sleep 1
	@$(MAKE) client-start
	@echo "$(GREEN)All services started!$(NC)"
	@$(MAKE) status

stop:
	@echo "$(YELLOW)Stopping all services...$(NC)"
	@$(MAKE) client-stop || true
	@$(MAKE) server-stop || true
	@$(MAKE) db-stop || true
	@echo "$(GREEN)All services stopped!$(NC)"

restart:
	@echo "$(YELLOW)Restarting all services...$(NC)"
	@$(MAKE) kill-ports
	@$(MAKE) db-stop || true
	@sleep 2
	@$(MAKE) start

status:
	@echo ""
	@echo "$(GREEN)╔══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(GREEN)║                  SUNDERING - Service Status                  ║$(NC)"
	@echo "$(GREEN)╚══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)┌─ Database Services ─────────────────────────────────────────┐$(NC)"
	@if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "sundering-postgres"; then \
		echo "$(GREEN)│  ✓ PostgreSQL$(NC)    Running"; \
		echo "│    └─ Connection: postgresql://localhost:5433/sundering"; \
	else \
		echo "$(RED)│  ✗ PostgreSQL$(NC)    Not running"; \
	fi
	@if docker ps --format "{{.Names}}" 2>/dev/null | grep -q "sundering-redis"; then \
		echo "$(GREEN)│  ✓ Redis$(NC)         Running"; \
		echo "│    └─ Connection: redis://localhost:6380"; \
	else \
		echo "$(RED)│  ✗ Redis$(NC)         Not running"; \
	fi
	@echo "$(YELLOW)└──────────────────────────────────────────────────────────────┘$(NC)"
	@echo ""
	@echo "$(YELLOW)┌─ Application Services ──────────────────────────────────────┐$(NC)"
	@SERVER_ON_PORT=$$(lsof -ti :$(SERVER_PORT) 2>/dev/null | head -1); \
	if [ -n "$$SERVER_ON_PORT" ]; then \
		echo "$(GREEN)│  ✓ Game Server$(NC)   Running (PID: $$SERVER_ON_PORT)"; \
		echo "│    ├─ HTTP API:    http://localhost:$(SERVER_PORT)"; \
		echo "│    ├─ WebSocket:   ws://localhost:$(SERVER_PORT)"; \
		echo "│    └─ Monitor:     http://localhost:$(SERVER_PORT)/colyseus"; \
	else \
		echo "$(RED)│  ✗ Game Server$(NC)   Not running"; \
	fi
	@CLIENT_ON_PORT=$$(lsof -ti :$(CLIENT_PORT) 2>/dev/null | head -1); \
	if [ -n "$$CLIENT_ON_PORT" ]; then \
		echo "$(GREEN)│  ✓ Client$(NC)        Running (PID: $$CLIENT_ON_PORT)"; \
		echo "│    └─ URL:         http://localhost:$(CLIENT_PORT)"; \
	else \
		echo "$(RED)│  ✗ Client$(NC)        Not running"; \
	fi
	@echo "$(YELLOW)└──────────────────────────────────────────────────────────────┘$(NC)"
	@echo ""
	@echo "$(YELLOW)┌─ Quick Commands ────────────────────────────────────────────┐$(NC)"
	@echo "│  make start      - Start all services"
	@echo "│  make stop       - Stop all services"
	@echo "│  make restart    - Restart all services"
	@echo "│  make kill-ports - Force kill processes on ports"
	@echo "$(YELLOW)└──────────────────────────────────────────────────────────────┘$(NC)"
	@echo ""

logs:
	@echo "$(YELLOW)Use specific log commands:$(NC)"
	@echo "  make db-logs"
	@echo "  make server-logs"
	@echo "  make client-logs"

# =============================================================================
# DATABASE COMMANDS
# =============================================================================

db-start:
	@echo "$(GREEN)Starting database containers...$(NC)"
	@docker compose down --remove-orphans 2>/dev/null || true
	@docker compose up -d
	@echo "$(GREEN)Waiting for databases to be ready...$(NC)"
	@sleep 3
	@docker compose ps

db-stop:
	@echo "$(YELLOW)Stopping database containers...$(NC)"
	@docker compose down --remove-orphans 2>/dev/null || true
	@echo "$(GREEN)Database containers stopped$(NC)"

db-restart:
	@echo "$(YELLOW)Restarting database containers...$(NC)"
	@docker compose down --remove-orphans 2>/dev/null || true
	@sleep 1
	@docker compose up -d
	@sleep 3
	@docker compose ps

db-logs:
	@docker compose logs -f --tail=50

# =============================================================================
# SERVER COMMANDS
# =============================================================================

server-start:
	@echo "$(GREEN)Starting game server...$(NC)"
	@if lsof -ti :$(SERVER_PORT) >/dev/null 2>&1; then \
		echo "$(YELLOW)Port $(SERVER_PORT) already in use, stopping existing process...$(NC)"; \
		lsof -ti :$(SERVER_PORT) | xargs -r kill -9 2>/dev/null || true; \
		sleep 1; \
	fi
	@rm -f $(SERVER_PID_FILE)
	@cd packages/server && pnpm dev > ../../.server.log 2>&1 & echo $$! > ../../$(SERVER_PID_FILE)
	@sleep 3
	@if lsof -ti :$(SERVER_PORT) >/dev/null 2>&1; then \
		echo "$(GREEN)Server started successfully$(NC)"; \
		echo "  HTTP:      http://localhost:$(SERVER_PORT)"; \
		echo "  WebSocket: ws://localhost:$(SERVER_PORT)"; \
		echo "  Monitor:   http://localhost:$(SERVER_PORT)/colyseus"; \
	else \
		echo "$(RED)Server failed to start. Check logs with: make server-logs$(NC)"; \
	fi

server-stop:
	@echo "$(YELLOW)Stopping game server...$(NC)"
	@if [ -f $(SERVER_PID_FILE) ]; then \
		PID=$$(cat $(SERVER_PID_FILE)); \
		if [ -n "$$PID" ] && kill -0 $$PID 2>/dev/null; then \
			kill $$PID 2>/dev/null || true; \
			sleep 1; \
			kill -9 $$PID 2>/dev/null || true; \
		fi; \
		rm -f $(SERVER_PID_FILE); \
	fi
	@lsof -ti :$(SERVER_PORT) 2>/dev/null | xargs -r kill -9 2>/dev/null || true
	@echo "$(GREEN)Server stopped$(NC)"

server-restart:
	@echo "$(YELLOW)Restarting game server...$(NC)"
	@$(MAKE) server-stop
	@sleep 1
	@$(MAKE) server-start

server-logs:
	@if [ -f .server.log ]; then \
		tail -f .server.log; \
	else \
		echo "$(RED)No server log file found. Is the server running?$(NC)"; \
	fi

# =============================================================================
# CLIENT COMMANDS
# =============================================================================

client-start:
	@echo "$(GREEN)Starting client dev server...$(NC)"
	@if lsof -ti :$(CLIENT_PORT) >/dev/null 2>&1; then \
		echo "$(YELLOW)Port $(CLIENT_PORT) already in use, stopping existing process...$(NC)"; \
		lsof -ti :$(CLIENT_PORT) | xargs -r kill -9 2>/dev/null || true; \
		sleep 1; \
	fi
	@rm -f $(CLIENT_PID_FILE)
	@cd packages/client && pnpm dev > ../../.client.log 2>&1 & echo $$! > ../../$(CLIENT_PID_FILE)
	@sleep 3
	@if lsof -ti :$(CLIENT_PORT) >/dev/null 2>&1; then \
		echo "$(GREEN)Client started successfully$(NC)"; \
		echo "  URL: http://localhost:$(CLIENT_PORT)"; \
	else \
		echo "$(RED)Client failed to start. Check logs with: make client-logs$(NC)"; \
	fi

client-stop:
	@echo "$(YELLOW)Stopping client dev server...$(NC)"
	@if [ -f $(CLIENT_PID_FILE) ]; then \
		PID=$$(cat $(CLIENT_PID_FILE)); \
		if [ -n "$$PID" ] && kill -0 $$PID 2>/dev/null; then \
			kill $$PID 2>/dev/null || true; \
			sleep 1; \
			kill -9 $$PID 2>/dev/null || true; \
		fi; \
		rm -f $(CLIENT_PID_FILE); \
	fi
	@lsof -ti :$(CLIENT_PORT) 2>/dev/null | xargs -r kill -9 2>/dev/null || true
	@echo "$(GREEN)Client stopped$(NC)"

client-restart:
	@echo "$(YELLOW)Restarting client dev server...$(NC)"
	@$(MAKE) client-stop
	@sleep 1
	@$(MAKE) client-start

client-logs:
	@if [ -f .client.log ]; then \
		tail -f .client.log; \
	else \
		echo "$(RED)No client log file found. Is the client running?$(NC)"; \
	fi

# =============================================================================
# DEVELOPMENT COMMANDS
# =============================================================================

install:
	@echo "$(GREEN)Installing dependencies...$(NC)"
	@pnpm install

build:
	@echo "$(GREEN)Building shared package...$(NC)"
	@pnpm --filter @sundering/shared build

dev: install build start
	@echo ""
	@echo "$(GREEN)Development environment ready!$(NC)"
	@echo ""
	@echo "  Client:  http://localhost:$(CLIENT_PORT)"
	@echo "  Server:  http://localhost:$(SERVER_PORT)"
	@echo "  Monitor: http://localhost:$(SERVER_PORT)/colyseus"
	@echo ""

clean:
	@echo "$(YELLOW)Cleaning project...$(NC)"
	@$(MAKE) kill-ports 2>/dev/null || true
	@$(MAKE) db-stop 2>/dev/null || true
	@rm -rf node_modules
	@rm -rf packages/*/node_modules
	@rm -rf packages/*/dist
	@rm -rf packages/client/.vite
	@rm -f .server.log .client.log
	@rm -f .server.pid .client.pid
	@echo "$(GREEN)Clean complete$(NC)"
