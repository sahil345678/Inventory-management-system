from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import OrderCreate, OrderResponse
from app.crud import orders as crud

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderResponse, status_code=201)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    """Create a new order."""
    db_order = crud.create_order(db, order)
    return _serialize_order(db_order)


@router.get("", response_model=list[OrderResponse])
def get_orders(db: Session = Depends(get_db)):
    """Retrieve all orders."""
    orders = crud.get_orders(db)
    return [_serialize_order(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Retrieve order details by ID."""
    order = crud.get_order(db, order_id)
    return _serialize_order(order)


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db)):
    """Cancel/Delete an order."""
    return crud.delete_order(db, order_id)


def _serialize_order(order) -> dict:
    """Serialize order with nested customer and product info."""
    return {
        "id": order.id,
        "customer_id": order.customer_id,
        "customer_name": order.customer.full_name if order.customer else None,
        "total_amount": order.total_amount,
        "status": order.status,
        "created_at": order.created_at,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else None,
                "product_sku": item.product.sku if item.product else None,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ],
    }
