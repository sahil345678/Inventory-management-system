"""
Database seed script — automatically populates the database with demo data
on first startup if the database is empty.
"""
from sqlalchemy.orm import Session
from app.models import Product, Customer, Order, OrderItem


SEED_PRODUCTS = [
    {"name": "Wireless Mouse", "sku": "WM-001", "price": 29.99, "quantity_in_stock": 150},
    {"name": "Mechanical Keyboard", "sku": "KB-002", "price": 89.99, "quantity_in_stock": 75},
    {"name": "USB-C Hub 7-in-1", "sku": "HUB-003", "price": 45.50, "quantity_in_stock": 200},
    {"name": "27\" 4K Monitor", "sku": "MON-004", "price": 349.99, "quantity_in_stock": 30},
    {"name": "Laptop Stand Adjustable", "sku": "LS-005", "price": 54.99, "quantity_in_stock": 120},
    {"name": "Noise Cancelling Headphones", "sku": "HP-006", "price": 199.99, "quantity_in_stock": 45},
    {"name": "Webcam HD 1080p", "sku": "WC-007", "price": 69.99, "quantity_in_stock": 8},
    {"name": "Desk LED Light Bar", "sku": "LED-008", "price": 39.99, "quantity_in_stock": 3},
    {"name": "Ergonomic Office Chair", "sku": "CH-009", "price": 299.99, "quantity_in_stock": 12},
    {"name": "Wireless Charger Pad", "sku": "WCP-010", "price": 24.99, "quantity_in_stock": 5},
    {"name": "Bluetooth Speaker", "sku": "BS-011", "price": 79.99, "quantity_in_stock": 60},
    {"name": "External SSD 1TB", "sku": "SSD-012", "price": 109.99, "quantity_in_stock": 35},
]

SEED_CUSTOMERS = [
    {"full_name": "Sarah Johnson", "email": "sarah.johnson@gmail.com", "phone": "+1 415 555 0101"},
    {"full_name": "Michael Chen", "email": "m.chen@outlook.com", "phone": "+1 212 555 0202"},
    {"full_name": "Emily Davis", "email": "emily.davis@yahoo.com", "phone": "+1 310 555 0303"},
    {"full_name": "James Wilson", "email": "j.wilson@company.com", "phone": "+1 650 555 0404"},
    {"full_name": "Priya Patel", "email": "priya.patel@techcorp.io", "phone": "+91 98765 43210"},
    {"full_name": "Robert Martinez", "email": "r.martinez@email.com", "phone": "+1 305 555 0606"},
    {"full_name": "Lisa Thompson", "email": "lisa.t@startup.co", "phone": "+1 512 555 0707"},
    {"full_name": "David Kim", "email": "david.kim@design.studio", "phone": "+82 10 5555 0808"},
]

# (customer_index, [(product_index, quantity), ...])
SEED_ORDERS = [
    (0, [(3, 1), (1, 1)]),        # Sarah: monitor + keyboard
    (1, [(2, 3), (0, 2)]),        # Michael: 3 hubs + 2 mice
    (2, [(5, 1), (6, 1)]),        # Emily: headphones + webcam
    (3, [(8, 1), (4, 2), (7, 1)]),# James: chair + 2 stands + LED
    (4, [(11, 2), (9, 3), (10, 1)]),# Priya: 2 SSDs + 3 chargers + speaker
    (5, [(0, 5)]),                # Robert: 5 mice
    (6, [(3, 2), (1, 2), (5, 1)]),# Lisa: 2 monitors + 2 keyboards + headphones
    (7, [(7, 1), (6, 2)]),        # David: LED + 2 webcams
]


def seed_database(db: Session):
    """Seed the database with demo data if it's empty."""
    if db.query(Product).count() > 0:
        return  # Already seeded

    print("🌱 Seeding database with demo data...")

    # Create products
    products = []
    for p_data in SEED_PRODUCTS:
        product = Product(**p_data)
        db.add(product)
        products.append(product)
    db.flush()

    # Create customers
    customers = []
    for c_data in SEED_CUSTOMERS:
        customer = Customer(**c_data)
        db.add(customer)
        customers.append(customer)
    db.flush()

    # Create orders
    for cust_idx, items in SEED_ORDERS:
        total = 0.0
        order = Order(
            customer_id=customers[cust_idx].id,
            total_amount=0,
            status="completed",
        )
        db.add(order)
        db.flush()

        for prod_idx, qty in items:
            product = products[prod_idx]
            subtotal = product.price * qty
            total += subtotal
            order_item = OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=qty,
                unit_price=product.price,
                subtotal=subtotal,
            )
            db.add(order_item)
            product.quantity_in_stock -= qty

        order.total_amount = round(total, 2)

    db.commit()
    print("✅ Database seeded with 12 products, 8 customers, and 8 orders.")
