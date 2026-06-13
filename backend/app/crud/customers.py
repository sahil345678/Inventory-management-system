from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models import Customer
from app.schemas import CustomerCreate


def create_customer(db: Session, customer_data: CustomerCreate) -> Customer:
    """Create a new customer. Raises 409 if email already exists."""
    existing = db.query(Customer).filter(Customer.email == customer_data.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Customer with email '{customer_data.email}' already exists."
        )
    customer = Customer(**customer_data.model_dump())
    db.add(customer)
    try:
        db.commit()
        db.refresh(customer)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Customer with email '{customer_data.email}' already exists."
        )
    return customer


def get_customers(db: Session) -> list[Customer]:
    """Retrieve all customers."""
    return db.query(Customer).order_by(Customer.created_at.desc()).all()


def get_customer(db: Session, customer_id: int) -> Customer:
    """Retrieve a customer by ID. Raises 404 if not found."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found."
        )
    return customer


def delete_customer(db: Session, customer_id: int) -> dict:
    """Delete a customer by ID. Raises 404 if not found."""
    customer = get_customer(db, customer_id)
    db.delete(customer)
    db.commit()
    return {"message": f"Customer '{customer.full_name}' deleted successfully."}
