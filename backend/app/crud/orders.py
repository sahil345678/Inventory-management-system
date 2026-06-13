from sqlalchemy.orm import Session, joinedload
from fastapi import HTTPException, status
from app.models import Order, OrderItem, Product, Customer
from app.schemas import OrderCreate


def create_order(db: Session, order_data: OrderCreate) -> Order:
    """
    Create a new order with business logic:
    - Validates customer exists
    - Validates all products exist
    - Checks sufficient inventory for each item
    - Calculates unit_price, subtotal, and total_amount automatically
    - Reduces product stock within a single transaction
    """
    # Validate customer
    customer = db.query(Customer).filter(Customer.id == order_data.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order_data.customer_id} not found."
        )

    # Validate products and check stock
    order_items = []
    total_amount = 0.0

    for item in order_data.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found."
            )
        if product.quantity_in_stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for product '{product.name}' (SKU: {product.sku}). "
                    f"Available: {product.quantity_in_stock}, Requested: {item.quantity}."
                )
            )

        subtotal = product.price * item.quantity
        total_amount += subtotal

        order_items.append({
            "product": product,
            "quantity": item.quantity,
            "unit_price": product.price,
            "subtotal": subtotal,
        })

    # Create order
    order = Order(
        customer_id=order_data.customer_id,
        total_amount=round(total_amount, 2),
        status="completed",
    )
    db.add(order)
    db.flush()  # Get order.id

    # Create order items and reduce stock
    for item_data in order_items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"],
        )
        db.add(order_item)
        # Reduce stock
        item_data["product"].quantity_in_stock -= item_data["quantity"]

    db.commit()
    db.refresh(order)
    return order


def get_orders(db: Session) -> list[Order]:
    """Retrieve all orders with customer info."""
    return (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc())
        .all()
    )


def get_order(db: Session, order_id: int) -> Order:
    """Retrieve an order by ID with full details. Raises 404 if not found."""
    order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found."
        )
    return order


def delete_order(db: Session, order_id: int) -> dict:
    """Delete/cancel an order by ID. Restores product stock. Raises 404 if not found."""
    order = get_order(db, order_id)

    # Restore stock for each item
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.quantity_in_stock += item.quantity

    db.delete(order)
    db.commit()
    return {"message": f"Order #{order_id} deleted successfully. Stock restored."}
