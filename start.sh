#!/bin/bash

# AI Factory Floor Safety Monitor - Start Script
# ================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   AI Factory Floor Safety Monitor                ║"
echo "║   OSHA Compliance Monitoring System              ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "${GREEN}✓ Environment variables loaded${NC}"
else
  echo -e "${RED}✗ .env file not found! Please create one.${NC}"
  exit 1
fi

BACKEND_PORT=${BACKEND_PORT:-4000}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
DB_NAME=${DB_NAME:-factory_safety_monitor}
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# Function to clean up ports
cleanup_ports() {
  echo -e "\n${YELLOW}🔧 Cleaning up ports...${NC}"
  for port in $BACKEND_PORT $FRONTEND_PORT; do
    PID=$(lsof -ti:$port 2>/dev/null || true)
    if [ -n "$PID" ]; then
      echo -e "  Killing process on port $port (PID: $PID)"
      kill -9 $PID 2>/dev/null || true
      sleep 1
    fi
  done
  echo -e "${GREEN}✓ Ports cleaned${NC}"
}

# Function to cleanup on exit
cleanup() {
  echo -e "\n${YELLOW}🛑 Shutting down...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  echo -e "${GREEN}✓ All processes stopped${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Step 1: Clean ports
cleanup_ports

# Step 2: Check PostgreSQL
echo -e "\n${YELLOW}🐘 Checking PostgreSQL...${NC}"
if ! command -v psql &> /dev/null; then
  echo -e "${RED}✗ PostgreSQL not found! Please install it.${NC}"
  exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT -q 2>/dev/null; then
  echo -e "${YELLOW}  Starting PostgreSQL...${NC}"
  brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  sleep 2
fi

# Create database if it doesn't exist
echo -e "  Creating database '${DB_NAME}' if it doesn't exist..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" 2>/dev/null | grep -q 1 || \
  createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || true
echo -e "${GREEN}✓ PostgreSQL ready${NC}"

# Step 3: Install dependencies
echo -e "\n${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend && npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

echo -e "\n${YELLOW}📦 Installing frontend dependencies...${NC}"
cd ../frontend && npm install --silent 2>&1 | tail -1
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
cd ..

# Step 4: Seed database
echo -e "\n${YELLOW}🌱 Seeding database...${NC}"
cd backend && node src/seeds/seed.js
cd ..
echo -e "${GREEN}✓ Database seeded${NC}"

# Step 5: Start backend with hot reload (nodemon)
echo -e "\n${YELLOW}🚀 Starting backend server on port ${BACKEND_PORT}...${NC}"
cd backend && npx nodemon src/server.js &
BACKEND_PID=$!
cd ..
sleep 3

# Step 6: Start frontend with hot reload (Vite)
echo -e "\n${YELLOW}🚀 Starting frontend on port ${FRONTEND_PORT}...${NC}"
cd frontend && npx vite --port $FRONTEND_PORT &
FRONTEND_PID=$!
cd ..
sleep 2

echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════╗"
echo "║   🎉 Application is running!                    ║"
echo "║                                                  ║"
echo "║   Frontend:  http://localhost:${FRONTEND_PORT}              ║"
echo "║   Backend:   http://localhost:${BACKEND_PORT}              ║"
echo "║                                                  ║"
echo "║   Login Credentials:                             ║"
echo "║   Admin:      admin@factory.com / password123    ║"
echo "║   Manager:    manager@factory.com / password123  ║"
echo "║   Supervisor: supervisor@factory.com / password123║"
echo "║   Worker:     worker@factory.com / password123   ║"
echo "║                                                  ║"
echo "║   Press Ctrl+C to stop all services              ║"
echo "╚══════════════════════════════════════════════════╝"
echo -e "${NC}"

# Wait for both processes
wait
