"""NH GOODS API Tests - Comprehensive backend testing"""
import pytest
import requests
import time

class TestHealthAndSeed:
    """Health check and database seeding tests"""
    
    def test_health_check(self, base_url, api_client):
        """Test API health endpoint"""
        response = api_client.get(f"{base_url}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")
    
    def test_seed_database(self, base_url, api_client):
        """Test database seeding (idempotent)"""
        response = api_client.post(f"{base_url}/api/seed")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print("✓ Database seeded successfully")

class TestAuthentication:
    """Authentication flow tests"""
    
    def test_admin_login_success(self, base_url, api_client):
        """Test admin login with correct credentials"""
        response = api_client.post(f"{base_url}/api/auth/login", json={
            "phone_number": "1234567890",
            "pin": "1234"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["is_admin"] == True
        assert data["user"]["phone_number"] == "1234567890"
        print("✓ Admin login successful")
    
    def test_customer_login_success(self, base_url, api_client):
        """Test customer login with correct credentials"""
        response = api_client.post(f"{base_url}/api/auth/login", json={
            "phone_number": "9876543210",
            "pin": "5678"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        assert data["user"]["is_admin"] == False
        assert data["user"]["phone_number"] == "9876543210"
        print("✓ Customer login successful")
    
    def test_login_invalid_credentials(self, base_url, api_client):
        """Test login with invalid credentials"""
        response = api_client.post(f"{base_url}/api/auth/login", json={
            "phone_number": "0000000000",
            "pin": "0000"
        })
        assert response.status_code == 401
        print("✓ Invalid credentials rejected")
    
    def test_get_current_user(self, base_url, api_client, admin_headers):
        """Test getting current user info"""
        response = api_client.get(f"{base_url}/api/auth/me", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "phone_number" in data
        assert data["is_admin"] == True
        print("✓ Get current user successful")

class TestCategories:
    """Category endpoint tests"""
    
    def test_get_categories_no_auth(self, base_url, api_client):
        """Test getting categories without authentication"""
        response = api_client.get(f"{base_url}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 4
        category_ids = [cat["id"] for cat in data]
        assert "bakery" in category_ids
        assert "cakes_sweets" in category_ids
        assert "premium_snacks" in category_ids
        assert "energy_beverages" in category_ids
        print("✓ Categories retrieved (4 categories)")

class TestProducts:
    """Product endpoint tests"""
    
    def test_get_all_products(self, base_url, api_client, customer_headers):
        """Test getting all products"""
        response = api_client.get(f"{base_url}/api/products", headers=customer_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        # Verify no MongoDB _id in response
        for product in data:
            assert "_id" not in product
            assert "id" in product
            assert "name" in product
            assert "category" in product
            assert "price" in product
        print(f"✓ Retrieved {len(data)} products")
    
    def test_get_products_by_category(self, base_url, api_client, customer_headers):
        """Test filtering products by category"""
        response = api_client.get(f"{base_url}/api/products?category=bakery", headers=customer_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # All products should be bakery category
        for product in data:
            assert product["category"] == "bakery"
        print(f"✓ Retrieved {len(data)} bakery products")
    
    def test_get_products_requires_auth(self, base_url, api_client):
        """Test that products endpoint requires authentication"""
        response = api_client.get(f"{base_url}/api/products")
        assert response.status_code == 401
        print("✓ Products endpoint requires auth")

class TestFlashDeals:
    """Flash deals endpoint tests"""
    
    def test_get_flash_deals(self, base_url, api_client, customer_headers):
        """Test getting flash deal products"""
        response = api_client.get(f"{base_url}/api/flash-deals", headers=customer_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify flash deal properties
        for deal in data:
            assert deal["is_flash_deal"] == True
            assert "flash_deal_price" in deal
            assert "_id" not in deal
        print(f"✓ Retrieved {len(data)} flash deals")

class TestOrders:
    """Order management tests"""
    
    def test_create_order(self, base_url, api_client, customer_headers):
        """Test creating a new order"""
        order_data = {
            "items": [
                {
                    "product_id": "test-product-1",
                    "quantity": 2,
                    "price": 3.99,
                    "name": "Test Product"
                }
            ],
            "notes": "TEST_ORDER - Automated test order"
        }
        response = api_client.post(f"{base_url}/api/orders", json=order_data, headers=customer_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["total"] == 7.98
        assert len(data["items"]) == 1
        print(f"✓ Order created: {data['id']}")
        return data["id"]
    
    def test_get_user_orders(self, base_url, api_client, customer_headers):
        """Test getting user's orders"""
        response = api_client.get(f"{base_url}/api/orders", headers=customer_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} orders")
    
    def test_get_last_order(self, base_url, api_client, customer_headers):
        """Test getting last order for reorder feature"""
        response = api_client.get(f"{base_url}/api/last-order", headers=customer_headers)
        assert response.status_code == 200
        # Can be null if no orders exist
        data = response.json()
        if data:
            assert "id" in data
            assert "items" in data
            assert "_id" not in data
        print("✓ Last order retrieved")

class TestReorder:
    """Reorder functionality tests"""
    
    def test_reorder_existing_order(self, base_url, api_client, customer_headers):
        """Test reordering from an existing order"""
        # First create an order
        order_data = {
            "items": [
                {
                    "product_id": "reorder-test-1",
                    "quantity": 1,
                    "price": 5.99,
                    "name": "Reorder Test Product"
                }
            ],
            "notes": "TEST_REORDER - Original order"
        }
        create_response = api_client.post(f"{base_url}/api/orders", json=order_data, headers=customer_headers)
        assert create_response.status_code == 200
        original_order_id = create_response.json()["id"]
        
        # Now reorder
        time.sleep(0.5)  # Small delay
        reorder_response = api_client.post(f"{base_url}/api/reorder/{original_order_id}", headers=customer_headers)
        assert reorder_response.status_code == 200
        new_order = reorder_response.json()
        assert new_order["id"] != original_order_id
        assert len(new_order["items"]) == len(order_data["items"])
        assert new_order["total"] == 5.99
        print(f"✓ Reorder successful: {new_order['id']}")

class TestLocationTracking:
    """Location and geofencing tests"""
    
    def test_update_location(self, base_url, api_client, customer_headers):
        """Test updating user location"""
        location_data = {
            "latitude": 42.9956,
            "longitude": -71.4548
        }
        response = api_client.post(f"{base_url}/api/location/update", json=location_data, headers=customer_headers)
        assert response.status_code == 200
        data = response.json()
        assert "is_at_shop" in data
        assert "distance_to_shop" in data
        assert "geofence_radius" in data
        print(f"✓ Location updated: is_at_shop={data['is_at_shop']}")

class TestAdminEndpoints:
    """Admin-only endpoint tests"""
    
    def test_get_all_users_admin(self, base_url, api_client, admin_headers):
        """Test admin can get all users"""
        response = api_client.get(f"{base_url}/api/admin/users", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 2  # At least admin and demo customer
        print(f"✓ Admin retrieved {len(data)} users")
    
    def test_get_users_customer_forbidden(self, base_url, api_client, customer_headers):
        """Test customer cannot access admin endpoints"""
        response = api_client.get(f"{base_url}/api/admin/users", headers=customer_headers)
        assert response.status_code == 403
        print("✓ Customer blocked from admin endpoint")
    
    def test_create_user_admin(self, base_url, api_client, admin_headers):
        """Test admin can create new user"""
        user_data = {
            "phone_number": f"TEST_{int(time.time())}",
            "pin": "9999",
            "name": "TEST_User Automated",
            "shop_name": "TEST_Shop",
            "language": "en",
            "is_admin": False
        }
        response = api_client.post(f"{base_url}/api/admin/users", json=user_data, headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert data["phone_number"] == user_data["phone_number"]
        print(f"✓ User created: {data['id']}")
        
        # Cleanup: delete the test user
        delete_response = api_client.delete(f"{base_url}/api/admin/users/{data['id']}", headers=admin_headers)
        assert delete_response.status_code == 200
        print("✓ Test user cleaned up")
    
    def test_get_customer_presence(self, base_url, api_client, admin_headers):
        """Test admin can view customer presence"""
        response = api_client.get(f"{base_url}/api/admin/customer-presence", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Verify presence data structure
        for customer in data:
            assert "user_id" in customer
            assert "user_name" in customer
            assert "is_at_shop" in customer
            assert "is_online" in customer
        print(f"✓ Customer presence retrieved: {len(data)} customers")
    
    def test_get_activity_logs(self, base_url, api_client, admin_headers):
        """Test admin can view activity logs"""
        response = api_client.get(f"{base_url}/api/admin/activity", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Activity logs retrieved: {len(data)} entries")

class TestInvoices:
    """Invoice vault tests"""
    
    def test_get_invoices(self, base_url, api_client, customer_headers):
        """Test getting user invoices"""
        response = api_client.get(f"{base_url}/api/invoices", headers=customer_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Invoices retrieved: {len(data)} invoices")
