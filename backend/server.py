from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import hashlib
import jwt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'nh_goods_db')]

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'nh_goods_super_secret_key_2025')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="NH GOODS API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    phone_number: str
    pin: str
    name: str
    shop_name: Optional[str] = None
    shop_address: Optional[str] = None
    shop_latitude: Optional[float] = None
    shop_longitude: Optional[float] = None
    language: str = "en"
    is_admin: bool = False

class UserLogin(BaseModel):
    phone_number: str
    pin: str

class UserResponse(BaseModel):
    id: str
    phone_number: str
    name: str
    shop_name: Optional[str] = None
    shop_address: Optional[str] = None
    shop_latitude: Optional[float] = None
    shop_longitude: Optional[float] = None
    language: str
    is_admin: bool
    created_at: datetime
    is_active: bool = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    shop_name: Optional[str] = None
    shop_address: Optional[str] = None
    shop_latitude: Optional[float] = None
    shop_longitude: Optional[float] = None
    language: Optional[str] = None

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    name_es: Optional[str] = None
    name_hi: Optional[str] = None
    name_ne: Optional[str] = None
    name_ur: Optional[str] = None
    description: Optional[str] = None
    description_es: Optional[str] = None
    description_hi: Optional[str] = None
    description_ne: Optional[str] = None
    description_ur: Optional[str] = None
    category: str  # bakery, cakes_sweets, premium_snacks, energy_beverages
    price: float
    wholesale_price: Optional[float] = None
    unit: str = "each"
    stock: int = 0
    image_base64: Optional[str] = None
    is_available: bool = True
    is_flash_deal: bool = False
    flash_deal_price: Optional[float] = None
    flash_deal_ends: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProductCreate(BaseModel):
    name: str
    name_es: Optional[str] = None
    name_hi: Optional[str] = None
    name_ne: Optional[str] = None
    name_ur: Optional[str] = None
    description: Optional[str] = None
    description_es: Optional[str] = None
    description_hi: Optional[str] = None
    description_ne: Optional[str] = None
    description_ur: Optional[str] = None
    category: str
    price: float
    wholesale_price: Optional[float] = None
    unit: str = "each"
    stock: int = 0
    image_base64: Optional[str] = None
    is_available: bool = True
    is_flash_deal: bool = False
    flash_deal_price: Optional[float] = None

class CartItem(BaseModel):
    product_id: str
    quantity: int
    price: float
    name: str

class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_phone: str
    shop_name: Optional[str] = None
    items: List[CartItem]
    total: float
    status: str = "pending"  # pending, confirmed, delivering, delivered, cancelled
    notes: Optional[str] = None
    voice_order_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    items: List[CartItem]
    notes: Optional[str] = None
    voice_order_base64: Optional[str] = None

class VoiceOrder(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    user_phone: str
    audio_base64: str
    status: str = "pending"  # pending, reviewed, processed
    admin_notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class VoiceOrderCreate(BaseModel):
    audio_base64: str

class ActivityLog(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str
    action: str  # login, view_product, add_to_cart, place_order, etc.
    details: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class LocationUpdate(BaseModel):
    latitude: float
    longitude: float

class CustomerPresence(BaseModel):
    user_id: str
    user_name: str
    phone_number: str
    shop_name: Optional[str] = None
    shop_address: Optional[str] = None
    shop_latitude: Optional[float] = None
    shop_longitude: Optional[float] = None
    is_at_shop: bool = False
    last_location_update: Optional[datetime] = None
    last_latitude: Optional[float] = None
    last_longitude: Optional[float] = None

# ==================== HELPER FUNCTIONS ====================

def hash_pin(pin: str) -> str:
    return hashlib.sha256(pin.encode()).hexdigest()

def create_token(user_id: str, is_admin: bool) -> str:
    payload = {
        "user_id": user_id,
        "is_admin": is_admin,
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Optional[Dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = verify_token(credentials.credentials)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    user = await db.users.find_one({"id": payload["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

async def log_activity(user_id: str, user_name: str, action: str, details: dict = None):
    log = ActivityLog(
        user_id=user_id,
        user_name=user_name,
        action=action,
        details=details
    )
    await db.activity_logs.insert_one(log.dict())

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"phone_number": data.phone_number})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user["pin_hash"] != hash_pin(data.pin):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is disabled")
    
    token = create_token(user["id"], user.get("is_admin", False))
    
    # Log activity
    await log_activity(user["id"], user["name"], "login")
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "phone_number": user["phone_number"],
            "name": user["name"],
            "shop_name": user.get("shop_name"),
            "shop_address": user.get("shop_address"),
            "shop_latitude": user.get("shop_latitude"),
            "shop_longitude": user.get("shop_longitude"),
            "language": user.get("language", "en"),
            "is_admin": user.get("is_admin", False)
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "phone_number": current_user["phone_number"],
        "name": current_user["name"],
        "shop_name": current_user.get("shop_name"),
        "shop_address": current_user.get("shop_address"),
        "shop_latitude": current_user.get("shop_latitude"),
        "shop_longitude": current_user.get("shop_longitude"),
        "language": current_user.get("language", "en"),
        "is_admin": current_user.get("is_admin", False)
    }

@api_router.put("/auth/profile")
async def update_profile(data: UserUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    if update_data:
        await db.users.update_one(
            {"id": current_user["id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"id": current_user["id"]})
    return {
        "id": updated_user["id"],
        "phone_number": updated_user["phone_number"],
        "name": updated_user["name"],
        "shop_name": updated_user.get("shop_name"),
        "language": updated_user.get("language", "en")
    }

# ==================== ADMIN ROUTES ====================

@api_router.post("/admin/users")
async def create_user(data: UserCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Check if phone number already exists
    existing = await db.users.find_one({"phone_number": data.phone_number})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    user = {
        "id": str(uuid.uuid4()),
        "phone_number": data.phone_number,
        "pin_hash": hash_pin(data.pin),
        "name": data.name,
        "shop_name": data.shop_name,
        "shop_address": data.shop_address,
        "shop_latitude": data.shop_latitude,
        "shop_longitude": data.shop_longitude,
        "language": data.language,
        "is_admin": data.is_admin,
        "is_active": True,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user)
    
    return {
        "id": user["id"],
        "phone_number": user["phone_number"],
        "name": user["name"],
        "shop_name": user["shop_name"],
        "is_admin": user["is_admin"],
        "created_at": user["created_at"]
    }

@api_router.get("/admin/users")
async def get_all_users(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find().to_list(1000)
    return [{
        "id": u["id"],
        "phone_number": u["phone_number"],
        "name": u["name"],
        "shop_name": u.get("shop_name"),
        "shop_address": u.get("shop_address"),
        "language": u.get("language", "en"),
        "is_admin": u.get("is_admin", False),
        "is_active": u.get("is_active", True),
        "created_at": u.get("created_at")
    } for u in users]

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "User deleted successfully"}

@api_router.put("/admin/users/{user_id}/toggle-status")
async def toggle_user_status(user_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_status = not user.get("is_active", True)
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": new_status}}
    )
    
    return {"is_active": new_status}

@api_router.get("/admin/activity")
async def get_activity_logs(
    limit: int = 100,
    current_user: dict = Depends(get_current_user)
):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    logs = await db.activity_logs.find().sort("timestamp", -1).limit(limit).to_list(limit)
    # Clean up ObjectId
    result = []
    for log in logs:
        log_dict = {k: v for k, v in log.items() if k != '_id'}
        result.append(log_dict)
    return result

@api_router.get("/admin/voice-orders")
async def get_voice_orders(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    orders = await db.voice_orders.find().sort("created_at", -1).to_list(100)
    return orders

@api_router.put("/admin/voice-orders/{order_id}")
async def update_voice_order(
    order_id: str,
    status: str,
    notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = {"status": status}
    if notes:
        update_data["admin_notes"] = notes
    
    await db.voice_orders.update_one(
        {"id": order_id},
        {"$set": update_data}
    )
    
    return {"message": "Voice order updated"}

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {"is_available": True}
    if category:
        query["category"] = category
    
    products = await db.products.find(query).to_list(1000)
    
    # Convert ObjectId to string and clean up
    result = []
    for p in products:
        product_dict = {k: v for k, v in p.items() if k != '_id'}
        result.append(product_dict)
    
    # Log activity
    await log_activity(
        current_user["id"],
        current_user["name"],
        "view_products",
        {"category": category}
    )
    
    return result

@api_router.get("/flash-deals")
async def get_flash_deals(current_user: dict = Depends(get_current_user)):
    """Get products marked as flash deals"""
    products = await db.products.find({
        "is_available": True,
        "is_flash_deal": True
    }).to_list(100)
    
    result = []
    for p in products:
        product_dict = {k: v for k, v in p.items() if k != '_id'}
        result.append(product_dict)
    
    return result

@api_router.get("/last-order")
async def get_last_order(current_user: dict = Depends(get_current_user)):
    """Get the user's last successful order for quick reorder"""
    last_order = await db.orders.find_one(
        {"user_id": current_user["id"], "status": {"$in": ["delivered", "confirmed", "pending"]}},
        sort=[("created_at", -1)]
    )
    
    if not last_order:
        return None
    
    # Clean up ObjectId
    order_dict = {k: v for k, v in last_order.items() if k != '_id'}
    return order_dict

@api_router.post("/reorder/{order_id}")
async def reorder(order_id: str, current_user: dict = Depends(get_current_user)):
    """Create a new order based on a previous order"""
    original_order = await db.orders.find_one({"id": order_id, "user_id": current_user["id"]})
    
    if not original_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Create new order with same items
    new_order = Order(
        user_id=current_user["id"],
        user_name=current_user["name"],
        user_phone=current_user["phone_number"],
        shop_name=current_user.get("shop_name"),
        items=original_order["items"],
        total=original_order["total"],
        notes=f"Reorder from #{order_id[-8:].upper()}"
    )
    
    await db.orders.insert_one(new_order.dict())
    
    # Log activity
    await log_activity(
        current_user["id"],
        current_user["name"],
        "reorder",
        {"original_order_id": order_id, "new_order_id": new_order.id}
    )
    
    return new_order

@api_router.get("/products/{product_id}")
async def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Log activity
    await log_activity(
        current_user["id"],
        current_user["name"],
        "view_product",
        {"product_id": product_id, "product_name": product["name"]}
    )
    
    return product

@api_router.post("/admin/products")
async def create_product(data: ProductCreate, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    product = Product(**data.dict())
    await db.products.insert_one(product.dict())
    return product

@api_router.put("/admin/products/{product_id}")
async def update_product(
    product_id: str,
    data: ProductCreate,
    current_user: dict = Depends(get_current_user)
):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    update_data = data.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    result = await db.products.update_one(
        {"id": product_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}

@api_router.delete("/admin/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product deleted"}

@api_router.get("/categories")
async def get_categories():
    return [
        {"id": "bakery", "name": "Bakery", "name_es": "Panadería", "name_hi": "बेकरी", "name_ne": "बेकरी", "name_ur": "بیکری"},
        {"id": "cakes_sweets", "name": "Cakes & Sweets", "name_es": "Pasteles y Dulces", "name_hi": "केक और मिठाई", "name_ne": "केक र मिठाई", "name_ur": "کیک اور مٹھائیاں"},
        {"id": "premium_snacks", "name": "Premium Snacks", "name_es": "Snacks Premium", "name_hi": "प्रीमियम स्नैक्स", "name_ne": "प्रिमियम स्न्याक्स", "name_ur": "پریمیم اسنیکس"},
        {"id": "energy_beverages", "name": "Energy & Beverages", "name_es": "Energía y Bebidas", "name_hi": "एनर्जी और पेय", "name_ne": "ऊर्जा र पेय", "name_ur": "انرجی اور مشروبات"}
    ]

# ==================== ORDER ROUTES ====================

@api_router.post("/orders")
async def create_order(data: OrderCreate, current_user: dict = Depends(get_current_user)):
    total = sum(item.price * item.quantity for item in data.items)
    
    order = Order(
        user_id=current_user["id"],
        user_name=current_user["name"],
        user_phone=current_user["phone_number"],
        shop_name=current_user.get("shop_name"),
        items=data.items,
        total=total,
        notes=data.notes
    )
    
    await db.orders.insert_one(order.dict())
    
    # Log activity
    await log_activity(
        current_user["id"],
        current_user["name"],
        "place_order",
        {"order_id": order.id, "total": total, "items_count": len(data.items)}
    )
    
    return order

@api_router.get("/orders")
async def get_user_orders(current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]} if not current_user.get("is_admin") else {}
    orders = await db.orders.find(query).sort("created_at", -1).to_list(1000)
    # Clean up ObjectId
    result = []
    for order in orders:
        order_dict = {k: v for k, v in order.items() if k != '_id'}
        result.append(order_dict)
    return result

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check access
    if not current_user.get("is_admin") and order["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return order

@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status: str,
    current_user: dict = Depends(get_current_user)
):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    valid_statuses = ["pending", "confirmed", "delivering", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# ==================== VOICE ORDER ROUTES ====================

@api_router.post("/voice-orders")
async def create_voice_order(data: VoiceOrderCreate, current_user: dict = Depends(get_current_user)):
    voice_order = VoiceOrder(
        user_id=current_user["id"],
        user_name=current_user["name"],
        user_phone=current_user["phone_number"],
        audio_base64=data.audio_base64
    )
    
    await db.voice_orders.insert_one(voice_order.dict())
    
    # Log activity
    await log_activity(
        current_user["id"],
        current_user["name"],
        "voice_order",
        {"voice_order_id": voice_order.id}
    )
    
    return {"id": voice_order.id, "message": "Voice order submitted successfully"}

# ==================== LOCATION ROUTES ====================

def calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in meters using Haversine formula"""
    from math import radians, cos, sin, asin, sqrt
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    r = 6371000  # Earth radius in meters
    return c * r

GEOFENCE_RADIUS_METERS = 100  # 100 meter radius for "at shop" detection

@api_router.post("/location/update")
async def update_location(data: LocationUpdate, current_user: dict = Depends(get_current_user)):
    # Check if user is near their shop (within geofence radius)
    shop_lat = current_user.get("shop_latitude")
    shop_lon = current_user.get("shop_longitude")
    
    is_at_shop = False
    distance = None
    
    if shop_lat and shop_lon:
        distance = calculate_distance(
            data.latitude, data.longitude,
            shop_lat, shop_lon
        )
        is_at_shop = distance <= GEOFENCE_RADIUS_METERS
    
    # Update user's location status in database
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {
            "last_latitude": data.latitude,
            "last_longitude": data.longitude,
            "last_location_update": datetime.utcnow(),
            "is_at_shop": is_at_shop
        }}
    )
    
    # Log activity (silent tracking)
    await log_activity(
        current_user["id"],
        current_user["name"],
        "location_update",
        {
            "latitude": data.latitude,
            "longitude": data.longitude,
            "is_at_shop": is_at_shop,
            "distance_to_shop": distance
        }
    )
    
    return {
        "is_at_shop": is_at_shop,
        "distance_to_shop": distance,
        "geofence_radius": GEOFENCE_RADIUS_METERS
    }

@api_router.get("/admin/customer-presence")
async def get_customer_presence(current_user: dict = Depends(get_current_user)):
    """Get real-time presence status of all customers for admin dashboard"""
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Get all non-admin users with their location data
    users = await db.users.find({"is_admin": {"$ne": True}}).to_list(1000)
    
    presence_list = []
    for user in users:
        # Check if location update is recent (within last 10 minutes)
        last_update = user.get("last_location_update")
        is_online = False
        if last_update:
            time_diff = datetime.utcnow() - last_update
            is_online = time_diff.total_seconds() < 600  # 10 minutes
        
        presence_list.append({
            "user_id": user["id"],
            "user_name": user["name"],
            "phone_number": user["phone_number"],
            "shop_name": user.get("shop_name"),
            "shop_address": user.get("shop_address"),
            "shop_latitude": user.get("shop_latitude"),
            "shop_longitude": user.get("shop_longitude"),
            "is_at_shop": user.get("is_at_shop", False) if is_online else False,
            "is_online": is_online,
            "last_location_update": user.get("last_location_update"),
            "last_latitude": user.get("last_latitude"),
            "last_longitude": user.get("last_longitude")
        })
    
    # Sort: at_shop first, then online, then offline
    presence_list.sort(key=lambda x: (
        not x["is_at_shop"],
        not x["is_online"],
        x["user_name"]
    ))
    
    return presence_list

# ==================== INVOICE ROUTES ====================

@api_router.get("/invoices")
async def get_invoices(current_user: dict = Depends(get_current_user)):
    query = {"user_id": current_user["id"]} if not current_user.get("is_admin") else {}
    query["status"] = "delivered"  # Only delivered orders have invoices
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(1000)
    
    invoices = []
    for order in orders:
        invoices.append({
            "id": order["id"],
            "order_id": order["id"],
            "date": order["created_at"],
            "total": order["total"],
            "items_count": len(order["items"]),
            "shop_name": order.get("shop_name", "")
        })
    
    return invoices

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed the database with initial data (admin account and sample products)"""
    
    # Check if admin already exists
    admin = await db.users.find_one({"phone_number": "1234567890"})
    if not admin:
        # Create admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "phone_number": "1234567890",
            "pin_hash": hash_pin("1234"),
            "name": "Admin",
            "shop_name": "NH GOODS HQ",
            "shop_address": "Hooksett, NH",
            "language": "en",
            "is_admin": True,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(admin_user)
        logger.info("Admin user created")
    
    # Check if we need demo customer
    demo_customer = await db.users.find_one({"phone_number": "9876543210"})
    if not demo_customer:
        customer = {
            "id": str(uuid.uuid4()),
            "phone_number": "9876543210",
            "pin_hash": hash_pin("5678"),
            "name": "Demo Customer",
            "shop_name": "Quick Stop Gas Station",
            "shop_address": "123 Main St, Manchester, NH",
            "shop_latitude": 42.9956,
            "shop_longitude": -71.4548,
            "language": "en",
            "is_admin": False,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
        await db.users.insert_one(customer)
        logger.info("Demo customer created")
    
    # Check if products exist
    product_count = await db.products.count_documents({})
    if product_count == 0:
        sample_products = [
            # Bakery
            {
                "id": str(uuid.uuid4()),
                "name": "7 Days Soft Croissants",
                "name_es": "Croissants Suaves 7 Days",
                "name_ur": "7 ڈیز سافٹ کروسینٹس",
                "description": "Soft, fluffy croissants perfect for breakfast",
                "category": "bakery",
                "price": 3.99,
                "wholesale_price": 2.49,
                "unit": "pack",
                "stock": 100,
                "is_available": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Mini Muffins Variety Pack",
                "name_es": "Paquete Variado de Mini Muffins",
                "name_ur": "منی مفنز ورائٹی پیک",
                "description": "Assorted mini muffins - blueberry, chocolate chip, banana",
                "category": "bakery",
                "price": 5.99,
                "wholesale_price": 3.99,
                "unit": "pack",
                "stock": 75,
                "is_available": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            # Cakes & Sweets
            {
                "id": str(uuid.uuid4()),
                "name": "Hostess Cupcakes",
                "name_es": "Cupcakes Hostess",
                "name_ur": "ہوسٹیس کپ کیکس",
                "description": "Classic chocolate cupcakes with cream filling",
                "category": "cakes_sweets",
                "price": 4.49,
                "wholesale_price": 2.99,
                "unit": "box",
                "stock": 120,
                "is_available": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Hostess Zingers",
                "name_es": "Zingers Hostess",
                "name_ur": "ہوسٹیس زنگرز",
                "description": "Raspberry iced devil's food cakes",
                "category": "cakes_sweets",
                "price": 4.49,
                "wholesale_price": 2.99,
                "unit": "box",
                "stock": 90,
                "is_available": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            # Premium Snacks
            {
                "id": str(uuid.uuid4()),
                "name": "Sahale Glazed Nuts",
                "name_es": "Nueces Glaseadas Sahale",
                "name_ur": "ساہالے گلیزڈ نٹس",
                "description": "Premium honey glazed mixed nuts",
                "category": "premium_snacks",
                "price": 6.99,
                "wholesale_price": 4.49,
                "unit": "bag",
                "stock": 60,
                "is_available": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Pringles Original",
                "name_es": "Pringles Original",
                "name_ur": "پرنگلز اوریجنل",
                "description": "Classic potato crisps in signature can",
                "category": "premium_snacks",
                "price": 2.99,
                "wholesale_price": 1.79,
                "unit": "can",
                "stock": 200,
                "is_available": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            # Energy & Beverages
            {
                "id": str(uuid.uuid4()),
                "name": "Black Rifle Coffee",
                "name_es": "Café Black Rifle",
                "name_ur": "بلیک رائفل کافی",
                "description": "Premium ready-to-drink cold brew coffee",
                "category": "energy_beverages",
                "price": 3.49,
                "wholesale_price": 2.29,
                "unit": "can",
                "stock": 150,
                "is_available": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "name": "5-hour Energy",
                "name_es": "5-hour Energy",
                "name_ur": "5 گھنٹے انرجی",
                "description": "Extra strength energy shot",
                "category": "energy_beverages",
                "price": 3.99,
                "wholesale_price": 2.49,
                "unit": "bottle",
                "stock": 180,
                "is_available": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        
        await db.products.insert_many(sample_products)
        logger.info(f"Seeded {len(sample_products)} products")
        
        # Mark some products as flash deals
        await db.products.update_one(
            {"name": "Sahale Glazed Nuts"},
            {"$set": {"is_flash_deal": True, "flash_deal_price": 3.49}}
        )
        await db.products.update_one(
            {"name": "Pringles Original"},
            {"$set": {"is_flash_deal": True, "flash_deal_price": 1.29}}
        )
        await db.products.update_one(
            {"name": "5-hour Energy"},
            {"$set": {"is_flash_deal": True, "flash_deal_price": 1.99}}
        )
    
    return {"message": "Database seeded successfully"}

@api_router.get("/")
async def root():
    return {"message": "NH GOODS API v1.0", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
