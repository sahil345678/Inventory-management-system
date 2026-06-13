from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, EmailStr


# ── Product Schemas ──────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sku: str = Field(..., min_length=1, max_length=100)
    price: float = Field(..., ge=0)
    quantity_in_stock: int = Field(..., ge=0)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    price: Optional[float] = Field(None, ge=0)
    quantity_in_stock: Optional[int] = Field(None, ge=0)


class ProductResponse(BaseModel):
    id: int
    name: str
    sku: str
    price: float
    quantity_in_stock: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ── Customer Schemas ─────────────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=1, max_length=255)
    phone: str = Field(..., min_length=1, max_length=50)


class CustomerResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Order Schemas ────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate] = Field(..., min_length=1)


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    quantity: int
    unit_price: float
    subtotal: float

    class Config:
        from_attributes = True


class OrderResponse(BaseModel):
    id: int
    customer_id: int
    customer_name: Optional[str] = None
    total_amount: float
    status: str
    created_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True


# ── Dashboard Schema ─────────────────────────────────────────────────────────

class RecentOrderSummary(BaseModel):
    id: int
    customer_name: str
    total_amount: float
    item_count: int
    created_at: datetime


class DashboardResponse(BaseModel):
    total_products: int
    total_customers: int
    total_orders: int
    total_revenue: float
    total_inventory_value: float
    low_stock_products: List[ProductResponse]
    recent_orders: List[RecentOrderSummary]
