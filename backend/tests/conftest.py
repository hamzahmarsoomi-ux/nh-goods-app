import pytest
import requests
import os

@pytest.fixture(scope="session")
def base_url():
    """Get base URL from environment"""
    url = os.environ.get('EXPO_PUBLIC_BACKEND_URL')
    if not url:
        pytest.fail("EXPO_PUBLIC_BACKEND_URL environment variable not set")
    return url.rstrip('/')

@pytest.fixture(scope="session")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session

@pytest.fixture(scope="session")
def admin_token(base_url, api_client):
    """Get admin auth token"""
    response = api_client.post(f"{base_url}/api/auth/login", json={
        "phone_number": "1234567890",
        "pin": "1234"
    })
    if response.status_code != 200:
        pytest.skip(f"Admin login failed: {response.status_code}")
    return response.json()["token"]

@pytest.fixture(scope="session")
def customer_token(base_url, api_client):
    """Get customer auth token"""
    response = api_client.post(f"{base_url}/api/auth/login", json={
        "phone_number": "9876543210",
        "pin": "5678"
    })
    if response.status_code != 200:
        pytest.skip(f"Customer login failed: {response.status_code}")
    return response.json()["token"]

@pytest.fixture
def admin_headers(admin_token):
    """Headers with admin auth"""
    return {"Authorization": f"Bearer {admin_token}"}

@pytest.fixture
def customer_headers(customer_token):
    """Headers with customer auth"""
    return {"Authorization": f"Bearer {customer_token}"}
