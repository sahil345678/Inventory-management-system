from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Customer
from app.schemas import CustomerCreate, CustomerResponse
from app.crud import customers as crud

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("", response_model=CustomerResponse, status_code=201)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer."""
    return crud.create_customer(db, customer)


@router.get("", response_model=list[CustomerResponse])
def get_customers(
    search: Optional[str] = Query(None, description="Search by name or email"),
    db: Session = Depends(get_db),
):
    """Retrieve all customers, optionally filtered by search term."""
    query = db.query(Customer)
    if search:
        term = f"%{search}%"
        query = query.filter(
            Customer.full_name.ilike(term) | Customer.email.ilike(term)
        )
    return query.order_by(Customer.created_at.desc()).all()


@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Retrieve a customer by ID."""
    return crud.get_customer(db, customer_id)


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Delete a customer."""
    return crud.delete_customer(db, customer_id)
