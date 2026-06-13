from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models import Product
from app.schemas import ProductCreate, ProductUpdate


def create_product(db: Session, product_data: ProductCreate) -> Product:
    """Create a new product. Raises 409 if SKU already exists."""
    existing = db.query(Product).filter(Product.sku == product_data.sku).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{product_data.sku}' already exists."
        )
    product = Product(**product_data.model_dump())
    db.add(product)
    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product with SKU '{product_data.sku}' already exists."
        )
    return product


def get_products(db: Session) -> list[Product]:
    """Retrieve all products."""
    return db.query(Product).order_by(Product.created_at.desc()).all()


def get_product(db: Session, product_id: int) -> Product:
    """Retrieve a product by ID. Raises 404 if not found."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found."
        )
    return product


def update_product(db: Session, product_id: int, product_data: ProductUpdate) -> Product:
    """Update a product. Raises 404 if not found, 409 if SKU conflicts."""
    product = get_product(db, product_id)
    update_dict = product_data.model_dump(exclude_unset=True)

    if "sku" in update_dict:
        existing = db.query(Product).filter(
            Product.sku == update_dict["sku"],
            Product.id != product_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product with SKU '{update_dict['sku']}' already exists."
            )

    for key, value in update_dict.items():
        setattr(product, key, value)

    try:
        db.commit()
        db.refresh(product)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="SKU conflict."
        )
    return product


def delete_product(db: Session, product_id: int) -> dict:
    """Delete a product by ID. Raises 404 if not found."""
    product = get_product(db, product_id)
    db.delete(product)
    db.commit()
    return {"message": f"Product '{product.name}' deleted successfully."}
