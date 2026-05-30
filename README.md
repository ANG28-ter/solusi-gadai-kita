# Solusi Gadai Kita

Pawnshop modern ERP system is built with full-stack TypeScript technology. This application is designed to manage pawnshop operations, including customer management, pawnshops, auctions, cash, and reporting.

## 🚀 Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Database
- **JWT** - Authentication

### Frontend
- **Next.js 14** - React framework dengan App Router
- **React Query** - Data fetching & caching
- **Tailwind CSS** - Utility-first CSS
- **TypeScript** - Type safety

### Infrastructure
- **Monorepo** - Workspace-based project structure
- **Docker** - Containerization (optional)

## 📋 Features

✅ **Customer Management** - Customer CRUD with ID card photo
✅ **Pawn Management** - Create, edit, and manage pawn loans
✅ **Digital Contracts** - Generate and manage pawn contracts
✅ **Payments** - Record payments and calculate interest automatically
✅ **Auctions** - Manage collateral to be auctioned
✅ **Cash & Ledger** - Record cash inflows/outflows by category
✅ **Reporting** - Transaction reports and manager reviews
✅ **Multi-Branch** - Support for different branches
✅ **Role-Based Access** - Admin, Cashier, Manager
✅ **Notifications** - Real-time notifications

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm atau yarn

### Installation

1. Clone repository:
```bash
git clone https://github.com/ANG28-ter/solusi-gadai-kita.git
cd solusi-gadai-kita
```

2. Install dependencies:
```bash
npm install
```

3. Setup database:
```bash
# Buat database PostgreSQL
createdb pegadaian_dev

# Copy environment variables
cp .env.example .env

# Edit .env dengan kredensial database Anda
```

4. Run migrations:
```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

5. Start development servers:
```bash
# Terminal 1 - Backend API
cd apps/api
npm run start:dev

# Terminal 2 - Frontend Web
cd apps/web
npm run dev
```

6. Akses aplikasi:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Default Login
```
Username: admin
Password: admin123
```

## 📁 Struktur Project

```
solusi-gadai-kita/
├── apps/
│   ├── api/              # NestJS Backend
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules
│   │   │   ├── common/   # Shared utilities
│   │   │   └── main.ts
│   │   └── prisma/       # Database schema & migrations
│   │
│   └── web/              # Next.js Frontend
│       ├── src/
│       │   ├── app/      # App Router pages
│       │   ├── components/
│       │   ├── contexts/
│       │   └── lib/
│       └── public/
│
├── packages/
│   └── shared/           # Shared types & utilities
│
├── DEPLOYMENT.md         # VPS deployment guide
├── DEPLOYMENT_DEMO.md    # Free hosting deployment guide
└── README.md
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📝 API Documentation

API use RESTful endpoints dengan prefix `/api/v1`. example endpoints:

- `POST /api/v1/auth/login` - Login
- `GET /api/v1/customers` - List customers
- `POST /api/v1/loans` - Create loan
- `GET /api/v1/cash-ledger` - Get cash ledger

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 👨‍💻 Author

Developed by Aka as a portfolio project demonstrating full-stack development capabilities.

## 📧 Contact

For inquiries about this project, please contact: [akaverlangga28@gmail.com]

---

**Note**: This is a portfolio/demo project. For production use, ensure proper security audits and compliance with local regulations.
