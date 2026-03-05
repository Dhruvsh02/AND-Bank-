# 🏦 AND Bank — Full Stack Banking Application

A complete, production-grade banking application with microservice architecture.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + Redux Toolkit
- **Backend**: Django (per microservice) + Django REST Framework
- **Database**: MySQL 8.0
- **Cache/Queue**: Redis + Celery
- **Auth**: JWT + OTP (pyotp)
- **Payments**: Razorpay Gateway
- **DevOps**: Docker + Nginx + GitHub Actions CI/CD

## Microservices
| Service | Port | Responsibility |
|---|---|---|
| API Gateway | 8000 | Route all requests |
| Auth Service | 8001 | Login, Register, OTP, JWT |
| User Service | 8002 | Profile, KYC, Photo |
| Account Service | 8003 | Accounts, Balances, Statements |
| Transaction Service | 8004 | Transfers, UPI, History |
| Loan Service | 8005 | Apply, Track, EMI |
| Payment Service | 8006 | Razorpay integration |
| Notification Service | 8007 | Email/SMS OTP |
| Admin Service | 8008 | Admin controls |
| Chat Service | 8009 | AI chat assistant |

## Quick Start

```bash
# 1. Clone and enter directory
cd AND-Bank

# 2. Copy environment files
cp .env.example .env
# Edit .env with your MySQL, Redis, Email credentials

# 3. Start with Docker Compose
docker-compose up --build

# 4. Run migrations (all services)
./infrastructure/scripts/migrate_all.sh

# 5. Create superadmin
./infrastructure/scripts/create_admin.sh

# Frontend available at: http://localhost:3000
# API Gateway at:        http://localhost:8000
```

## Manual Setup (Without Docker)

### Backend (each service)
```bash
cd backend/services/auth_service
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp config/.env.example config/.env
python manage.py migrate
python manage.py runserver 8001
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```
