from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Product
from app.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.crud import products as crud

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("", response_model=ProductResponse, status_code=201)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Create a new product."""
    return crud.create_product(db, product)


@router.get("", response_model=list[ProductResponse])
def get_products(
    search: Optional[str] = Query(None, description="Search by name or SKU"),
    db: Session = Depends(get_db),
):
    """Retrieve all products, optionally filtered by search term."""
    query = db.query(Product)
    if search:
        term = f"%{search}%"
        query = query.filter(
            Product.name.ilike(term) | Product.sku.ilike(term)
        )
    return query.order_by(Product.created_at.desc()).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Retrieve a specific product by ID."""
    return crud.get_product(db, product_id)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    """Update a product."""
    return crud.update_product(db, product_id, product)


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete a product."""
    return crud.delete_product(db, product_id)
