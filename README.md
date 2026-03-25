# Solusi Gadai Kita

Sistem ERP Pegadaian modern yang dibangun dengan teknologi full-stack TypeScript. Aplikasi ini dirancang untuk mengelola operasional pegadaian, termasuk manajemen nasabah, gadai, lelang, kas, dan pelaporan.

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

## 📋 Fitur Utama

- ✅ **Manajemen Nasabah** - CRUD nasabah dengan foto KTP
- ✅ **Manajemen Gadai** - Buat, edit, dan kelola pinjaman gadai
- ✅ **Kontrak Digital** - Generate dan kelola kontrak gadai
- ✅ **Pembayaran** - Catat pembayaran dan hitung bunga otomatis
- ✅ **Lelang** - Kelola barang jaminan yang akan dilelang
- ✅ **Kas & Ledger** - Pencatatan kas masuk/keluar dengan kategori
- ✅ **Pelaporan** - Laporan transaksi dan review manager
- ✅ **Multi-Branch** - Support untuk cabang berbeda
- ✅ **Role-Based Access** - Admin, Kasir, Manajer
- ✅ **Notifikasi** - Real-time notifications

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm atau yarn

### Installation

1. Clone repository:
```bash
git clone https://github.com/yourusername/solusi-gadai-kita.git
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

## 🌐 Deployment

### Demo/Portfolio (Gratis)
Lihat panduan lengkap di [DEPLOYMENT_DEMO.md](./DEPLOYMENT_DEMO.md) untuk deploy ke:
- **Database**: Neon (PostgreSQL gratis)
- **Backend**: Railway (gratis 500 jam/bulan)
- **Frontend**: Vercel (gratis)

### Production (VPS)
Lihat panduan lengkap di [DEPLOYMENT.md](./DEPLOYMENT.md) untuk deploy menggunakan Docker di VPS.

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

API menggunakan RESTful endpoints dengan prefix `/api/v1`. Contoh endpoints:

- `POST /api/v1/auth/login` - Login
- `GET /api/v1/customers` - List customers
- `POST /api/v1/loans` - Create loan
- `GET /api/v1/cash-ledger` - Get cash ledger

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is private and proprietary.

## 👨‍💻 Author

Developed by [Your Name] as a portfolio project demonstrating full-stack development capabilities.

## 📧 Contact

For inquiries about this project, please contact: [akaverlangga28@gmail.com]

---

**Note**: This is a portfolio/demo project. For production use, ensure proper security audits and compliance with local regulations.
