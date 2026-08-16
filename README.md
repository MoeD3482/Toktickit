# TokTickIT - IT Service Desk Application

TokTickIT is a full-stack IT service desk application for managing Account & Access, Hardware, Software, and Network service requests.

## 🏗️ Technology Stack

- **Frontend:** React, TypeScript, Vite, Bootstrap 5
- **Backend:** Node.js, Express, TypeScript
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Testing:** Vitest, Supertest, React Testing Library

---

## 📁 Repository Structure

```text
toktickit/
├── client/          # React + TypeScript + Vite frontend
├── server/          # Express + Node.js + TypeScript + Prisma backend
│   ├── prisma/      # Prisma schema and seed scripts
│   ├── src/         # Express server source code
│   └── tests/       # API integration tests (Supertest + Vitest)
│       └── lab-01/
├── docs/            # Lab documentation & reports
│   └── lab-01/
│       ├── ai_use.md
│       ├── reviewer.md
│       └── tests.md
├── .env.example     # Environment variable template
├── .gitignore       # Git ignore settings
└── README.md        # Project foundation setup guide
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ or v20+
- **PostgreSQL**: v14+ running locally or in Docker
- **npm**: v9+

### Environment Setup

1. Copy `.env.example` configurations to local `.env` files:
   - Server: `cp server/.env.example server/.env` (or copy manually)
   - Client: `cp client/.env.example client/.env`

2. Configure `DATABASE_URL` in `server/.env` with your PostgreSQL credentials:
   ```env
   DATABASE_URL="postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public"
   PORT=3000
   ```

---

## 📦 Installation & Setup

### 1. Backend Setup (`/server`)

```bash
cd server
npm install
npx prisma generate
```

To run the backend development server:
```bash
npm run dev
```

### 2. Frontend Setup (`/client`)

```bash
cd client
npm install
```

To run the frontend development server:
```bash
npm run dev
```

---

## 🧪 Testing & Verification

### Run Backend Tests (Server)
```bash
cd server
npm test
```

### Run Frontend Tests (Client)
```bash
cd client
npm test
```

### Build Verification
```bash
# Build server
cd server
npm run build

# Build client
cd client
npm run build
```
