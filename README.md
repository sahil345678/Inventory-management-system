# 📦 InvenTrack — Inventory & Order Management System

A full-stack, containerized application for managing products, customers, and orders with real-time inventory tracking.

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.11 + FastAPI + SQLAlchemy |
| **Frontend** | React 18 + Vite |
| **Database** | PostgreSQL 16 |
| **Containerization** | Docker + Docker Compose |

## ✨ Features

- ✅ Product CRUD with unique SKU validation
- ✅ Customer CRUD with unique email validation
- ✅ Multi-item order creation with automatic total calculation
- ✅ Automatic stock reduction on order placement
- ✅ Stock restoration on order cancellation
- ✅ Insufficient stock prevention
- ✅ Dashboard with revenue stats, inventory value & low-stock alerts
- ✅ Search & filter on all tables
- ✅ Auto-seeded demo data on first startup
- ✅ Responsive dark-themed UI with animations
- ✅ Fully containerized with Docker Compose

---

## 🚀 Quick Start (Docker Compose — Recommended)

### Prerequisites
- **Docker Desktop** installed ([Download for Windows](https://www.docker.com/products/docker-desktop/) | [Mac](https://www.docker.com/products/docker-desktop/) | [Linux](https://docs.docker.com/engine/install/))

### Steps (Works on Windows, Mac, and Linux)

```bash
# 1. Clone the repository
git clone <repository-url>
cd ETHARA-AI

# 2. Copy the environment file
cp .env.example .env          # Linux/Mac
copy .env.example .env        # Windows CMD
# Or just manually copy the file

# 3. Start all services with one command
docker compose up --build

# That's it! Wait for the build to complete, then open:
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# API Docs:  http://localhost:8000/docs
```

> **Note:** On first startup, the database will be automatically seeded with 12 products, 8 customers, and 8 orders.

### Stopping the Application
```bash
docker compose down              # Stop services
docker compose down -v           # Stop + delete database data
```

---

## 💻 Local Development (Without Docker)

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL running on localhost:5432

### Backend
```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL=postgresql://admin:changeme@localhost:5432/inventory_db   # Linux/Mac
set DATABASE_URL=postgresql://admin:changeme@localhost:5432/inventory_db      # Windows CMD
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## 📡 API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/docs` | Swagger API documentation |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/products` | Create product |
| GET | `/products` | List products (`?search=term`) |
| GET | `/products/{id}` | Get product by ID |
| PUT | `/products/{id}` | Update product |
| DELETE | `/products/{id}` | Delete product |

### Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/customers` | Create customer |
| GET | `/customers` | List customers (`?search=term`) |
| GET | `/customers/{id}` | Get customer by ID |
| DELETE | `/customers/{id}` | Delete customer |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create order |
| GET | `/orders` | List all orders |
| GET | `/orders/{id}` | Get order details |
| DELETE | `/orders/{id}` | Delete/cancel order (restores stock) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Summary stats (revenue, inventory value, low stock) |

---

## 🏗 Business Rules

| Rule | Implementation |
|------|---------------|
| Unique Product SKU | DB unique constraint + API validation (409 Conflict) |
| Unique Customer Email | DB unique constraint + API validation (409 Conflict) |
| Non-negative Quantity | Pydantic validator + DB CHECK constraint |
| Stock Validation | Orders rejected if stock insufficient (400 Bad Request) |
| Auto Stock Reduction | Order creation deducts stock in a single transaction |
| Auto Stock Restoration | Order deletion restores product stock |
| Auto Total Calculation | Backend calculates `sum(price × quantity)` for all items |

---

## 🐳 Docker Architecture

```
┌─────────────────────────────────────────────────┐
│                Docker Compose                    │
├────────────┬────────────┬───────────────────────┤
│  Frontend  │  Backend   │     PostgreSQL         │
│  (Nginx)   │  (Uvicorn) │   (postgres:16-alpine) │
│  Port 3000 │  Port 8000 │     Port 5432          │
│  React App │  FastAPI   │   Named Volume: pgdata │
└────────────┴────────────┴───────────────────────┘
```

---

## 🌐 Deployment

### Backend → Render (Free Tier)
1. Push code to GitHub
2. Create a PostgreSQL database on Render
3. Create a Web Service, connect your GitHub repo
4. Set root directory: `backend`
5. Build command: `pip install -r requirements.txt`
6. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
7. Add env variable: `DATABASE_URL` = your Render PostgreSQL URL
8. Add env variable: `CORS_ORIGINS` = your Vercel frontend URL

### Frontend → Vercel
1. Import your GitHub repo on Vercel
2. Set root directory: `frontend`
3. Set env variable: `VITE_API_URL` = your Render backend URL
4. Build command: `npm run build` | Output: `dist`
