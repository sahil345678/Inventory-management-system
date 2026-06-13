import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import products, customers, orders, dashboard

app = FastAPI(
    title="Inventory & Order Management API",
    description="A production-ready API for managing products, customers, and orders.",
    version="1.0.0",
)

# CORS configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.on_event("startup")
def on_startup():
    """Create database tables and seed with demo data on first startup."""
    Base.metadata.create_all(bind=engine)
    # Auto-seed with demo data if database is empty
    from app.database import SessionLocal
    from app.seed import seed_database
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/", tags=["Health"])
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Inventory & Order Management API",
        "version": "1.0.0",
    }
