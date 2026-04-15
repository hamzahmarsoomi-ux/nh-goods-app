from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
import certifi
import ssl
if 'mongodb+srv' in mongo_url or 'mongodb.net' in mongo_url:
    client = AsyncIOMotorClient(
        mongo_url, 
        tls=True,
        tlsCAFile=certifi.where(),
        tlsAllowInvalidCertificates=True,
        serverSelectionTimeoutMS=15000,
        connectTimeoutMS=15000,
        socketTimeoutMS=15000
    )
else:
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
    ein_number: Optional[str] = None
    can_see_prices: bool = True
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
    image_url: Optional[str] = None
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
    image_url: Optional[str] = None
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
    shop_address: Optional[str] = None
    items: List[CartItem]
    total: float
    payment_method: str = "bank_transfer"  # bank_check, bank_transfer
    status: str = "pending"
    notes: Optional[str] = None
    voice_order_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class OrderCreate(BaseModel):
    items: List[CartItem]
    notes: Optional[str] = None
    voice_order_base64: Optional[str] = None
    payment_method: str = "bank_transfer"

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

class InquiryCreate(BaseModel):
    image_base64: str
    inquiry_type: str  # availability, pricing, request
    message: Optional[str] = None

class InquiryReply(BaseModel):
    reply: str

class MessageCreate(BaseModel):
    receiver_id: str
    text: Optional[str] = None
    file_base64: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None

class MarketplaceCreate(BaseModel):
    product_name: str
    description: Optional[str] = None
    price: float
    quantity: int
    image_base64: Optional[str] = None  # image, pdf, file

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
            "is_admin": user.get("is_admin", False),
            "can_see_prices": user.get("can_see_prices", True)
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
        "ein_number": data.ein_number,
        "can_see_prices": data.can_see_prices,
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
    
    users = await db.users.find({}, {"_id": 0, "pin_hash": 0}).limit(200).to_list(200)
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
    
    logs = await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return logs

@api_router.get("/admin/analytics-summary")
async def get_analytics_summary(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    users = await db.users.find({"is_admin": {"$ne": True}}, {"_id": 0, "pin_hash": 0}).limit(200).to_list(200)
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    summary = []
    for u in users:
        uid = u["id"]
        login_count = await db.activity_logs.count_documents({"user_id": uid, "action": "login"})
        today_logins = await db.activity_logs.count_documents({"user_id": uid, "action": "login", "timestamp": {"$gte": today_start}})
        cart_add_count = await db.activity_logs.count_documents({"user_id": uid, "action": "add_to_cart"})
        cart_remove_count = await db.activity_logs.count_documents({"user_id": uid, "action": "remove_from_cart"})
        order_count = await db.orders.count_documents({"user_id": uid})
        
        summary.append({
            "user_id": uid, "name": u["name"], "phone": u["phone_number"],
            "shop_name": u.get("shop_name"), "total_logins": login_count,
            "today_logins": today_logins, "cart_adds": cart_add_count,
            "cart_removes": cart_remove_count, "total_orders": order_count
        })
    
    summary.sort(key=lambda x: x["today_logins"], reverse=True)
    return summary

@api_router.get("/admin/user-analytics/{user_id}")
async def get_user_analytics(user_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "pin_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    logs = await db.activity_logs.find({"user_id": user_id}, {"_id": 0}).sort("timestamp", -1).limit(500).to_list(500)
    
    login_logs = [l for l in logs if l.get("action") == "login"]
    daily_logins = {}
    for l in login_logs:
        day = l["timestamp"].strftime("%Y-%m-%d")
        daily_logins[day] = daily_logins.get(day, 0) + 1
    
    cart_adds = len([l for l in logs if l.get("action") == "add_to_cart"])
    cart_removes = len([l for l in logs if l.get("action") == "remove_from_cart"])
    orders = await db.orders.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).limit(20).to_list(20)
    
    return {
        "user": user, "total_logins": len(login_logs),
        "daily_logins": daily_logins, "total_orders": len(orders),
        "total_spent": sum(o.get("total", 0) for o in orders),
        "cart_adds": cart_adds, "cart_removes": cart_removes,
        "recent_activity": logs[:20]
    }

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

@api_router.put("/admin/products/{product_id}/toggle-deal")
async def toggle_flash_deal(product_id: str, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_status = not product.get("is_flash_deal", False)
    deal_price = product.get("wholesale_price", product["price"]) * 0.8 if new_status else None
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"is_flash_deal": new_status, "flash_deal_price": deal_price}}
    )
    
    return {"is_flash_deal": new_status, "flash_deal_price": deal_price}

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
    
    update_data = {k: v for k, v in data.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    # If image_base64 is provided, clear image_url (new upload replaces old)
    if data.image_base64:
        update_data["image_url"] = None
    
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

class ActivityLogCreate(BaseModel):
    action: str
    details: Optional[Dict[str, Any]] = None

@api_router.post("/activity-log")
async def create_activity_log(data: ActivityLogCreate, current_user: dict = Depends(get_current_user)):
    await log_activity(current_user["id"], current_user["name"], data.action, data.details)
    return {"message": "Logged"}

# ==================== MARKETPLACE (Neighbor Exchange) ====================

@api_router.post("/marketplace")
async def create_listing(data: MarketplaceCreate, current_user: dict = Depends(get_current_user)):
    listing = {
        "id": str(uuid.uuid4()),
        "seller_id": current_user["id"],
        "seller_name": current_user["name"],
        "seller_phone": current_user["phone_number"],
        "shop_name": current_user.get("shop_name"),
        "product_name": data.product_name,
        "description": data.description,
        "price": data.price,
        "quantity": data.quantity,
        "image_base64": data.image_base64,
        "status": "active",
        "created_at": datetime.utcnow()
    }
    await db.marketplace.insert_one(listing)
    return {"id": listing["id"], "message": "Listed successfully"}

@api_router.get("/marketplace")
async def get_listings(current_user: dict = Depends(get_current_user)):
    listings = await db.marketplace.find({"status": "active"}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    return listings

@api_router.get("/marketplace/mine")
async def get_my_listings(current_user: dict = Depends(get_current_user)):
    listings = await db.marketplace.find({"seller_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return listings

@api_router.delete("/marketplace/{listing_id}")
async def delete_listing(listing_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.marketplace.delete_one({"id": listing_id, "seller_id": current_user["id"]})
    if result.deleted_count == 0:
        # Admin can delete any
        if current_user.get("is_admin"):
            await db.marketplace.delete_one({"id": listing_id})
        else:
            raise HTTPException(status_code=404, detail="Listing not found")
    return {"message": "Deleted"}

@api_router.get("/categories")
async def get_categories():

    return [
        {"id": "cakes_pastry", "name": "Cakes, Donuts & Pastry", "name_es": "Pasteles, Donas y Repostería", "name_hi": "केक, डोनट और पेस्ट्री", "name_ne": "केक, डोनट र पेस्ट्री", "name_ur": "کیک، ڈونٹس اور پیسٹری", "name_zh": "蛋糕、甜甜圈和糕点"},
        {"id": "nuts_seeds", "name": "Nuts, Seeds & Trail Mix", "name_es": "Nueces, Semillas y Mezcla", "name_hi": "नट्स, बीज और ट्रेल मिक्स", "name_ne": "नट्स, बीउ र ट्रेल मिक्स", "name_ur": "گری دار میوے، بیج اور ٹریل مکس", "name_zh": "坚果、种子和混合零食"},
        {"id": "energy_drinks", "name": "Energy Drinks", "name_es": "Bebidas Energéticas", "name_hi": "एनर्जी ड्रिंक्स", "name_ne": "ऊर्जा पेय", "name_ur": "انرجی ڈرنکس", "name_zh": "能量饮料"}
    ]

# ==================== ORDER ROUTES ====================

@api_router.post("/orders")
async def create_order(data: OrderCreate, current_user: dict = Depends(get_current_user)):
    subtotal = sum(item.price * item.quantity for item in data.items)
    delivery_fee = round(subtotal * 0.03, 2)  # 3% delivery fee
    total = round(subtotal + delivery_fee, 2)
    
    order = Order(
        user_id=current_user["id"],
        user_name=current_user["name"],
        user_phone=current_user["phone_number"],
        shop_name=current_user.get("shop_name"),
        shop_address=current_user.get("shop_address"),
        items=data.items,
        total=total,
        payment_method=data.payment_method,
        notes=data.notes
    )
    
    order_dict = order.dict()
    order_dict["subtotal"] = subtotal
    order_dict["delivery_fee"] = delivery_fee
    await db.orders.insert_one(order_dict)
    
    # Log activity
    await log_activity(
        current_user["id"],
        current_user["name"],
        "place_order",
        {"order_id": order.id, "total": total, "items_count": len(data.items), "payment_method": data.payment_method}
    )
    
    # Return clean response (exclude _id)
    return {k: v for k, v in order_dict.items() if k != '_id'}

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
    users = await db.users.find(
        {"is_admin": {"$ne": True}},
        {"_id": 0, "pin_hash": 0}
    ).limit(200).to_list(200)
    
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

# ==================== SNAP & ASK (INQUIRY) ROUTES ====================

@api_router.post("/inquiries")
async def create_inquiry(data: InquiryCreate, current_user: dict = Depends(get_current_user)):
    inquiry = {
        "id": str(uuid.uuid4()),
        "user_id": current_user["id"],
        "user_name": current_user["name"],
        "user_phone": current_user["phone_number"],
        "shop_name": current_user.get("shop_name"),
        "shop_address": current_user.get("shop_address"),
        "image_base64": data.image_base64,
        "inquiry_type": data.inquiry_type,
        "message": data.message,
        "status": "pending",
        "admin_reply": None,
        "created_at": datetime.utcnow()
    }
    await db.inquiries.insert_one(inquiry)
    await log_activity(current_user["id"], current_user["name"], "snap_ask", {"type": data.inquiry_type})
    
    # Also send as a message to admin chat
    inquiry_labels = {"availability": "Is this item in stock?", "pricing": "What is the wholesale price?", "request": "Can you source this product?"}
    inquiry_text = f"📸 Snap & Ask: {inquiry_labels.get(data.inquiry_type, data.inquiry_type)}"
    if data.message:
        inquiry_text += f"\n💬 {data.message}"
    
    # Find admin user
    admin_user = await db.users.find_one({"is_admin": True})
    if admin_user:
        admin_id = admin_user["id"] if "id" in admin_user else str(admin_user["_id"])
        conv_id = f"conv_{min(current_user['id'], admin_id)}_{max(current_user['id'], admin_id)}"
        
        # Create message with image
        msg = {
            "id": str(uuid.uuid4()),
            "conversation_id": conv_id,
            "sender_id": current_user["id"],
            "sender_name": current_user["name"],
            "recipient_id": admin_id,
            "text": inquiry_text,
            "image_base64": data.image_base64,
            "is_read": False,
            "created_at": datetime.utcnow()
        }
        await db.messages.insert_one(msg)
    
    return {"id": inquiry["id"], "message": "Inquiry sent successfully"}

@api_router.get("/inquiries")
async def get_inquiries(current_user: dict = Depends(get_current_user)):
    if current_user.get("is_admin"):
        docs = await db.inquiries.find().sort("created_at", -1).to_list(200)
    else:
        docs = await db.inquiries.find({"user_id": current_user["id"]}).sort("created_at", -1).to_list(200)
    return [{k: v for k, v in d.items() if k != '_id'} for d in docs]

@api_router.put("/admin/inquiries/{inquiry_id}/reply")
async def reply_inquiry(inquiry_id: str, data: InquiryReply, current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    result = await db.inquiries.update_one(
        {"id": inquiry_id},
        {"$set": {"admin_reply": data.reply, "status": "replied"}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return {"message": "Reply sent"}

# ==================== MESSAGING ROUTES ====================

@api_router.post("/messages")
async def send_message(data: MessageCreate, current_user: dict = Depends(get_current_user)):
    msg = {
        "id": str(uuid.uuid4()),
        "sender_id": current_user["id"],
        "sender_name": current_user["name"],
        "sender_is_admin": current_user.get("is_admin", False),
        "receiver_id": data.receiver_id,
        "text": data.text,
        "file_base64": data.file_base64,
        "file_name": data.file_name,
        "file_type": data.file_type,
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.messages.insert_one(msg)
    return {"id": msg["id"], "message": "Message sent"}

@api_router.get("/messages/{user_id}")
async def get_conversation(user_id: str, current_user: dict = Depends(get_current_user)):
    my_id = current_user["id"]
    msgs = await db.messages.find({
        "$or": [
            {"sender_id": my_id, "receiver_id": user_id},
            {"sender_id": user_id, "receiver_id": my_id}
        ]
    }).sort("created_at", 1).to_list(500)
    
    # Mark received messages as read
    await db.messages.update_many(
        {"sender_id": user_id, "receiver_id": my_id, "read": False},
        {"$set": {"read": True}}
    )
    
    return [{k: v for k, v in m.items() if k != '_id'} for m in msgs]

@api_router.get("/messages")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    my_id = current_user["id"]
    
    # Get all messages involving this user
    msgs = await db.messages.find({
        "$or": [{"sender_id": my_id}, {"receiver_id": my_id}]
    }, {"_id": 0, "file_base64": 0}).sort("created_at", -1).limit(500).to_list(500)
    
    # Collect unique partner IDs
    partner_ids = list(set(
        m["receiver_id"] if m["sender_id"] == my_id else m["sender_id"]
        for m in msgs
    ))
    
    # Batch fetch all partners
    partners_list = await db.users.find(
        {"id": {"$in": partner_ids}},
        {"_id": 0, "id": 1, "name": 1, "shop_name": 1}
    ).to_list(len(partner_ids))
    partners_dict = {p["id"]: p for p in partners_list}
    
    # Count unread per partner
    unread_counts = {}
    for pid in partner_ids:
        unread_counts[pid] = await db.messages.count_documents(
            {"sender_id": pid, "receiver_id": my_id, "read": False}
        )
    
    # Group by conversation partner
    conversations = {}
    for m in msgs:
        partner_id = m["receiver_id"] if m["sender_id"] == my_id else m["sender_id"]
        if partner_id not in conversations:
            partner = partners_dict.get(partner_id, {})
            conversations[partner_id] = {
                "partner_id": partner_id,
                "partner_name": partner.get("name", "Unknown"),
                "partner_shop": partner.get("shop_name"),
                "last_message": m.get("text") or f"[{m.get('file_type', 'file')}]",
                "last_time": m["created_at"],
                "unread": unread_counts.get(partner_id, 0)
            }
    
    return list(conversations.values())

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed the database with initial data (admin account and sample products)"""
    
    # Check if admin already exists
    admin = await db.users.find_one({"phone_number": "19971997"})
    if not admin:
        # Create admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "phone_number": "19971997",
            "pin_hash": hash_pin("181818"),
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
            # Cakes, Donuts & Pastry
            {"id": str(uuid.uuid4()), "name": "7 Days Soft Croissant Chocolate 2.65oz", "description": "6 Piece", "category": "cakes_pastry", "price": 8.5, "wholesale_price": 8.5, "unit": "case", "stock": 100, "is_available": True, "image_url": "https://customer-assets.emergentagent.com/job_nh-bakery-snacks/artifacts/th62bljq_Screenshot%202026-04-09%20154249.png", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "7 Days Soft Croissant Vanilla 2.65oz", "description": "6 Piece", "category": "cakes_pastry", "price": 8.5, "wholesale_price": 8.5, "unit": "case", "stock": 100, "is_available": True, "image_url": "https://customer-assets.emergentagent.com/job_nh-bakery-snacks/artifacts/206ksj4c_Screenshot%202026-04-09%20154446.png", "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "Hostess Chocolate Cup Cakes", "description": "12 Piece", "category": "cakes_pastry", "price": 9.5, "wholesale_price": 9.5, "unit": "case", "stock": 120, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "Hostess Chocolate Zinger Single-Serve Caddy", "description": "12 Piece", "category": "cakes_pastry", "price": 9.6, "wholesale_price": 9.6, "unit": "case", "stock": 90, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "Hostess Raspberry Zinger Single-Serve Caddy", "description": "12 Piece", "category": "cakes_pastry", "price": 9.4, "wholesale_price": 9.4, "unit": "case", "stock": 90, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "TWIZZLERS Strawberry Flavored Twists Peg Bag 7oz", "description": "12 Piece", "category": "cakes_pastry", "price": 31.2, "wholesale_price": 31.2, "unit": "case", "stock": 60, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "HERSHEY'S Milk Chocolate with Almonds King Size Bar 2.6oz", "description": "18 Piece", "category": "cakes_pastry", "price": 42.3, "wholesale_price": 42.3, "unit": "case", "stock": 50, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "REESE'S FAST BREAK King Size Bar 3.5oz", "description": "18 Piece", "category": "cakes_pastry", "price": 42.4, "wholesale_price": 42.4, "unit": "case", "stock": 50, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "REESES OREO Milk Chocolate & White Creme Cups with Peanut & Oreo", "description": "24 Piece", "category": "cakes_pastry", "price": 56.2, "wholesale_price": 56.2, "unit": "case", "stock": 40, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            # Nuts, Seeds & Trail Mix
            {"id": str(uuid.uuid4()), "name": "BIGS TAPATIO Chile Limon Sunflower Seeds 5.35oz", "description": "12 Piece", "category": "nuts_seeds", "price": 23.4, "wholesale_price": 23.4, "unit": "case", "stock": 80, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "BIGS Taco Bell Taco Supreme Sunflower Seeds 5.35oz", "description": "12 Piece", "category": "nuts_seeds", "price": 23.4, "wholesale_price": 23.4, "unit": "case", "stock": 80, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "Blue Diamond BOLD Wasabi & Soy Sauce Almonds 1.5oz", "description": "12 Piece", "category": "nuts_seeds", "price": 13.4, "wholesale_price": 13.4, "unit": "case", "stock": 100, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "Bugles Original Crispy Corn Snacks 3oz", "description": "6 Piece", "category": "nuts_seeds", "price": 11.7, "wholesale_price": 11.7, "unit": "case", "stock": 70, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "Pringles Crisps Salt & Vinegar 2.5oz", "description": "12 Piece", "category": "nuts_seeds", "price": 15.8, "wholesale_price": 15.8, "unit": "case", "stock": 150, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "Pringles Cheddar 2.5oz", "description": "12 Piece", "category": "nuts_seeds", "price": 15.8, "wholesale_price": 15.8, "unit": "case", "stock": 150, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "HERSHEY'S Milk Chocolate Dipped Pretzels 4.25oz", "description": "12 Piece", "category": "nuts_seeds", "price": 32.5, "wholesale_price": 32.5, "unit": "case", "stock": 60, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "Flipz Milk Chocolate Covered Pretzel 7.5oz", "description": "8 Piece", "category": "nuts_seeds", "price": 32.1, "wholesale_price": 32.1, "unit": "case", "stock": 50, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "HERSHEYS Cookies N Creme Dipped Pretzels Peg Bag", "description": "12 Piece", "category": "nuts_seeds", "price": 32.6, "wholesale_price": 32.6, "unit": "case", "stock": 60, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            # Energy Drinks
            {"id": str(uuid.uuid4()), "name": "Black Rifle Coffee Company Espresso Mocha RTD 15oz", "description": "12 Piece", "category": "energy_drinks", "price": 33.4, "wholesale_price": 33.4, "unit": "case", "stock": 100, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()},
            {"id": str(uuid.uuid4()), "name": "5-hour ENERGY Shot Extra Strength Strawberry Banana 1.93oz", "description": "12 Piece", "category": "energy_drinks", "price": 26.3, "wholesale_price": 26.3, "unit": "case", "stock": 150, "is_available": True, "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()}
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


# Serve static web files (for Railway deployment)
WEB_DIST = ROOT_DIR / "web_dist"
if WEB_DIST.exists():
    # Mount static assets FIRST (before catch-all)
    if (WEB_DIST / "_expo").exists():
        app.mount("/_expo", StaticFiles(directory=str(WEB_DIST / "_expo")), name="expo_static")
    if (WEB_DIST / "assets").exists():
        app.mount("/assets", StaticFiles(directory=str(WEB_DIST / "assets")), name="web_assets")

    @app.get("/{full_path:path}")
    async def serve_web(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        # Try exact file
        file_path = WEB_DIST / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        # Try .html extension
        html_path = WEB_DIST / f"{full_path}.html"
        if html_path.is_file():
            return FileResponse(html_path)
        # Try index.html in directory
        index_path = WEB_DIST / full_path / "index.html"
        if index_path.is_file():
            return FileResponse(index_path)
        # Fallback to root index.html
        root_index = WEB_DIST / "index.html"
        if root_index.is_file():
            return FileResponse(root_index)
        raise HTTPException(status_code=404)
