from sqlalchemy import func
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models import Product, Customer, Order, OrderItem
from app.schemas import DashboardResponse, ProductResponse, RecentOrderSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

LOW_STOCK_THRESHOLD = 10


@router.get("", response_model=DashboardResponse)
def get_dashboard(db: Session = Depends(get_db)):
    """Return comprehensive summary statistics for the dashboard."""
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()

    # Total revenue from all orders
    total_revenue = db.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar()

    # Total inventory value (price × quantity for all products)
    inventory_value = db.query(
        func.coalesce(func.sum(Product.price * Product.quantity_in_stock), 0.0)
    ).scalar()

    # Low stock products
    low_stock = (
        db.query(Product)
        .filter(Product.quantity_in_stock <= LOW_STOCK_THRESHOLD)
        .order_by(Product.quantity_in_stock.asc())
        .all()
    )

    # Recent 5 orders with customer info
    recent_orders_raw = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items))
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )

    recent_orders = [
        RecentOrderSummary(
            id=o.id,
            customer_name=o.customer.full_name if o.customer else "Unknown",
            total_amount=o.total_amount,
            item_count=len(o.items),
            created_at=o.created_at,
        )
        for o in recent_orders_raw
    ]

    return DashboardResponse(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        total_inventory_value=round(inventory_value, 2),
        low_stock_products=low_stock,
        recent_orders=recent_orders,
    )
