# AND Bank — Complete Project Structure

```
AND-Bank/
├── README.md
├── .gitignore
├── docker-compose.yml                    # Orchestrates all microservices
├── docker-compose.dev.yml               # Dev overrides
├── docker-compose.test.yml              # Testing environment
├── Makefile                             # Convenience commands
├── .env.example                         # Root env template
│
├── .github/
│   └── workflows/
│       ├── ci.yml                       # CI pipeline (lint, test, build)
│       ├── cd-staging.yml               # CD to staging on merge to develop
│       └── cd-production.yml            # CD to production on merge to main
│
├── frontend/                            # React + Vite + Tailwind
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   ├── .env.example
│   ├── .env.development
│   ├── .env.production
│   ├── Dockerfile
│   ├── nginx.conf                       # For production build serving
│   ├── vitest.config.js                 # Unit testing config
│   ├── public/
│   │   ├── favicon.ico
│   │   └── logo.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       │
│       ├── assets/
│       │   ├── images/
│       │   └── fonts/
│       │
│       ├── components/                  # Reusable UI components
│       │   ├── ui/
│       │   │   ├── Button.jsx
│       │   │   ├── Input.jsx
│       │   │   ├── Modal.jsx
│       │   │   ├── Toast.jsx
│       │   │   ├── Loader.jsx
│       │   │   ├── Badge.jsx
│       │   │   ├── Card.jsx
│       │   │   ├── Table.jsx
│       │   │   ├── Pagination.jsx
│       │   │   └── Avatar.jsx
│       │   ├── layout/
│       │   │   ├── Navbar.jsx
│       │   │   ├── Sidebar.jsx
│       │   │   ├── AdminSidebar.jsx
│       │   │   ├── Footer.jsx
│       │   │   └── PageWrapper.jsx
│       │   ├── auth/
│       │   │   ├── ProtectedRoute.jsx
│       │   │   ├── AdminRoute.jsx
│       │   │   └── OTPInput.jsx
│       │   └── shared/
│       │       ├── ChatWidget.jsx
│       │       ├── NotificationBell.jsx
│       │       └── CurrencyDisplay.jsx
│       │
│       ├── pages/
│       │   ├── auth/
│       │   │   ├── Login.jsx
│       │   │   ├── Register.jsx           # New account opening
│       │   │   ├── OTPVerify.jsx          # MFA OTP screen
│       │   │   └── ForgotPassword.jsx
│       │   ├── user/
│       │   │   ├── Dashboard.jsx
│       │   │   ├── Balance.jsx
│       │   │   ├── Statement.jsx
│       │   │   ├── Transfer.jsx
│       │   │   ├── UPI.jsx
│       │   │   ├── Loans.jsx
│       │   │   ├── LoanApply.jsx
│       │   │   ├── Profile.jsx
│       │   │   └── Chat.jsx
│       │   └── admin/
│       │       ├── AdminDashboard.jsx
│       │       ├── UserManagement.jsx
│       │       ├── UserDetail.jsx
│       │       ├── Transactions.jsx
│       │       ├── LoanManagement.jsx
│       │       ├── CardManagement.jsx
│       │       ├── Reports.jsx
│       │       └── Settings.jsx
│       │
│       ├── hooks/                        # Custom React hooks
│       │   ├── useAuth.js
│       │   ├── useBalance.js
│       │   ├── useTransactions.js
│       │   ├── useWebSocket.js
│       │   └── useOTP.js
│       │
│       ├── store/                        # Zustand state management
│       │   ├── authStore.js
│       │   ├── bankStore.js
│       │   └── notificationStore.js
│       │
│       ├── services/                     # API calls
│       │   ├── api.js                    # Axios base instance
│       │   ├── authService.js
│       │   ├── userService.js
│       │   ├── transactionService.js
│       │   ├── loanService.js
│       │   ├── adminService.js
│       │   └── chatService.js
│       │
│       ├── utils/
│       │   ├── formatCurrency.js
│       │   ├── formatDate.js
│       │   ├── validators.js
│       │   └── constants.js
│       │
│       └── tests/
│           ├── components/
│           ├── pages/
│           ├── hooks/
│           └── services/
│
└── backend/
    ├── README.md
    ├── Makefile
    │
    ├── api-gateway/                      # Nginx API Gateway
    │   ├── nginx.conf
    │   ├── Dockerfile
    │   └── ssl/
    │
    ├── services/
    │   │
    │   ├── auth-service/                 # Authentication & MFA
    │   │   ├── Dockerfile
    │   │   ├── requirements.txt
    │   │   ├── manage.py
    │   │   ├── .env.example
    │   │   ├── auth_service/
    │   │   │   ├── settings/
    │   │   │   │   ├── base.py
    │   │   │   │   ├── development.py
    │   │   │   │   └── production.py
    │   │   │   ├── urls.py
    │   │   │   ├── wsgi.py
    │   │   │   └── asgi.py
    │   │   └── apps/
    │   │       └── authentication/
    │   │           ├── models.py          # User, OTPRecord, Session
    │   │           ├── serializers.py
    │   │           ├── views.py           # Login, Register, OTP, Logout
    │   │           ├── urls.py
    │   │           ├── services.py        # OTP generation & email/SMS
    │   │           ├── permissions.py
    │   │           ├── admin.py
    │   │           └── tests/
    │   │               ├── test_models.py
    │   │               ├── test_views.py
    │   │               └── test_services.py
    │   │
    │   ├── user-service/                  # User profiles & accounts
    │   │   ├── Dockerfile
    │   │   ├── requirements.txt
    │   │   ├── manage.py
    │   │   ├── .env.example
    │   │   ├── user_service/
    │   │   │   ├── settings/
    │   │   │   │   ├── base.py
    │   │   │   │   ├── development.py
    │   │   │   │   └── production.py
    │   │   │   ├── urls.py
    │   │   │   └── wsgi.py
    │   │   └── apps/
    │   │       ├── users/
    │   │       │   ├── models.py          # UserProfile, Photo
    │   │       │   ├── serializers.py
    │   │       │   ├── views.py           # Profile CRUD
    │   │       │   ├── urls.py
    │   │       │   └── tests/
    │   │       └── accounts/
    │   │           ├── models.py          # BankAccount, AccountNumber
    │   │           ├── serializers.py
    │   │           ├── views.py           # Balance, Statement
    │   │           ├── urls.py
    │   │           ├── utils.py           # Account number generator
    │   │           └── tests/
    │   │
    │   ├── transaction-service/           # Transactions & UPI
    │   │   ├── Dockerfile
    │   │   ├── requirements.txt
    │   │   ├── manage.py
    │   │   ├── .env.example
    │   │   ├── transaction_service/
    │   │   │   ├── settings/
    │   │   │   ├── urls.py
    │   │   │   └── wsgi.py
    │   │   └── apps/
    │   │       ├── transactions/
    │   │       │   ├── models.py          # Transaction, TransactionLog
    │   │       │   ├── serializers.py
    │   │       │   ├── views.py
    │   │       │   ├── urls.py
    │   │       │   ├── services.py        # Transfer logic
    │   │       │   └── tests/
    │   │       └── upi/
    │   │           ├── models.py          # UPIId, VPA
    │   │           ├── serializers.py
    │   │           ├── views.py
    │   │           ├── urls.py
    │   │           └── tests/
    │   │
    │   ├── loan-service/                  # Loan applications & management
    │   │   ├── Dockerfile
    │   │   ├── requirements.txt
    │   │   ├── manage.py
    │   │   ├── .env.example
    │   │   ├── loan_service/
    │   │   │   ├── settings/
    │   │   │   ├── urls.py
    │   │   │   └── wsgi.py
    │   │   └── apps/
    │   │       └── loans/
    │   │           ├── models.py          # LoanApplication, LoanRepayment
    │   │           ├── serializers.py
    │   │           ├── views.py
    │   │           ├── urls.py
    │   │           ├── services.py        # Eligibility, EMI calc
    │   │           └── tests/
    │   │
    │   ├── card-service/                  # Debit card management
    │   │   ├── Dockerfile
    │   │   ├── requirements.txt
    │   │   ├── manage.py
    │   │   ├── .env.example
    │   │   ├── card_service/
    │   │   │   ├── settings/
    │   │   │   ├── urls.py
    │   │   │   └── wsgi.py
    │   │   └── apps/
    │   │       └── cards/
    │   │           ├── models.py          # DebitCard, CardRequest
    │   │           ├── serializers.py
    │   │           ├── views.py
    │   │           ├── urls.py
    │   │           ├── services.py        # Card generation
    │   │           └── tests/
    │   │
    │   ├── notification-service/          # Email, SMS, Push notifications
    │   │   ├── Dockerfile
    │   │   ├── requirements.txt
    │   │   ├── manage.py
    │   │   ├── .env.example
    │   │   ├── notification_service/
    │   │   │   ├── settings/
    │   │   │   ├── urls.py
    │   │   │   └── wsgi.py
    │   │   └── apps/
    │   │       └── notifications/
    │   │           ├── models.py
    │   │           ├── views.py
    │   │           ├── tasks.py           # Celery async tasks
    │   │           ├── email_templates/
    │   │           │   ├── otp.html
    │   │           │   ├── welcome.html
    │   │           │   └── transaction.html
    │   │           └── tests/
    │   │
    │   ├── admin-service/                 # Admin operations
    │   │   ├── Dockerfile
    │   │   ├── requirements.txt
    │   │   ├── manage.py
    │   │   ├── .env.example
    │   │   ├── admin_service/
    │   │   │   ├── settings/
    │   │   │   ├── urls.py
    │   │   │   └── wsgi.py
    │   │   └── apps/
    │   │       └── administration/
    │   │           ├── models.py          # AdminAction, AuditLog
    │   │           ├── serializers.py
    │   │           ├── views.py
    │   │           ├── urls.py
    │   │           └── tests/
    │   │
    │   └── chat-service/                  # Chat assistant (WebSocket)
    │       ├── Dockerfile
    │       ├── requirements.txt
    │       ├── manage.py
    │       ├── .env.example
    │       ├── chat_service/
    │       │   ├── settings/
    │       │   ├── urls.py
    │       │   ├── wsgi.py
    │       │   └── asgi.py                # Django Channels
    │       └── apps/
    │           └── chat/
    │               ├── models.py          # ChatSession, Message
    │               ├── consumers.py       # WebSocket consumer
    │               ├── routing.py
    │               ├── views.py
    │               └── tests/
    │
    ├── shared/                            # Shared Django utilities
    │   ├── __init__.py
    │   ├── middleware.py                  # JWT validation
    │   ├── pagination.py
    │   ├── exceptions.py
    │   ├── permissions.py
    │   └── utils.py
    │
    └── infrastructure/
        ├── mysql/
        │   ├── init.sql                   # DB initialization scripts
        │   └── migrations_backup/
        ├── redis/
        │   └── redis.conf
        ├── celery/
        │   └── celeryconfig.py
        └── monitoring/
            ├── prometheus.yml
            └── grafana/
```
