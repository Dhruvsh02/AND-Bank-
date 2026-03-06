#!/bin/bash
# AND Bank — Backend Setup Script
# Backend runs in Docker. Frontend runs locally with npm.

set -e
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║         AND Bank — Backend Setup                 ║"
echo "║   Docker: MySQL + Redis + Nginx + Microservices  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if ! command -v docker &> /dev/null; then echo -e "${RED}❌ Docker not found${NC}"; exit 1; fi

COMPOSE="docker compose"
if ! docker compose version &> /dev/null 2>&1; then
    if command -v docker-compose &> /dev/null; then COMPOSE="docker-compose"
    else echo -e "${RED}❌ Docker Compose not found${NC}"; exit 1; fi
fi
echo -e "${GREEN}✅ Docker found ($COMPOSE)${NC}"

echo ""; echo "► Stopping existing containers..."
$COMPOSE down --remove-orphans 2>/dev/null || true

echo ""; echo "► Starting MySQL and Redis..."
$COMPOSE up -d mysql redis

echo "   Waiting for MySQL (up to 60s)..."
for i in $(seq 1 12); do
    if $COMPOSE exec -T mysql mysqladmin ping -uroot -pANDBank@Root2024! --silent 2>/dev/null; then
        echo -e "   ${GREEN}✅ MySQL ready${NC}"; break
    fi
    echo "   ... ${i}0s"; sleep 5
done

echo ""; echo "► Building all backend services..."
$COMPOSE up -d --build api-gateway auth-service user-service transaction-service loan-service card-service notification-service admin-service chat-service celery-worker

echo ""; echo "   Waiting 15s for services to initialize..."; sleep 15

echo ""; echo "► Running migrations..."
for SVC in auth-service user-service transaction-service loan-service card-service notification-service admin-service chat-service; do
    echo -n "   $SVC... "
    $COMPOSE exec -T $SVC python manage.py migrate --run-syncdb --no-input 2>/dev/null && echo -e "${GREEN}✅${NC}" || echo -e "${YELLOW}⚠️${NC}"
done

echo ""; echo "► Creating admin account..."
$COMPOSE exec -T auth-service python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(email='admin@andbank.com').exists():
    User.objects.create_superuser(email='admin@andbank.com', password='Admin@1234!', first_name='AND', last_name='Admin', role='admin', is_verified=True, status='active')
    print('Admin created: admin@andbank.com / Admin@1234!')
else:
    print('Admin already exists')
" 2>/dev/null || echo "  (skipped)"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅  Backend ready!                             ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  API Gateway:  http://localhost:80              ║"
echo "║  Admin login:  admin@andbank.com / Admin@1234!  ║"
echo "╠══════════════════════════════════════════════════╣"
echo "║  Now start frontend (separate terminal):        ║"
echo "║    cd frontend && npm install && npm run dev    ║"
echo "║    → http://localhost:3000                      ║"
echo "╚══════════════════════════════════════════════════╝"
