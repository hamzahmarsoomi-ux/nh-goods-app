# NH GOODS - Product Requirements Document (PRD)

## App Identity
- **App Name (Home Screen):** NH GOODS
- **Company Name (Internal):** NH QUALITY GOODS LLC
- **Brand:** Vision & Faith (الرؤية والإيمان)
- **Theme:** Deep Navy Blue (#05101F) + Royal Gold (#D4AF37)

## Authentication
- Private login: Phone Number + PIN (no public registration)
- Admin creates all accounts
- JWT-based session management

## Languages Supported
- English, Español (Spanish), हिन्दी (Hindi), नेपाली (Nepali), اردو (Urdu with RTL)

## Features

### 1. Product Catalog
- 4 categories: Bakery, Cakes & Sweets, Premium Snacks, Energy & Beverages
- Search and category filtering
- Wholesale + retail pricing display
- Stock availability badges

### 2. Flash Deals
- Highlighted deals on home screen
- Special pricing for limited-time offers

### 3. Shopping Cart & Checkout
- Quantity controls, order notes
- **Payment Method Selection:** Bank Check (شيك بنكي) or Bank Transfer (تحويل بنكي)
- Grand Total display
- Full-screen success confirmation with invoice generation

### 4. One-Tap Reorder
- Repeat last order from home screen with one click

### 5. Snap & Ask (Visual Inquiry)
- Camera/gallery photo upload
- 3 inquiry types: Availability, Pricing, Sourcing Request
- Sent to admin dashboard with customer info

### 6. Geofencing Presence Detection
- GPS-based detection when customer is at registered shop (100m radius)
- Admin sees live "At Shop" / "Away" / "Offline" status
- Auto-refresh every 30 seconds
- One-click navigation to customer location

### 7. Admin Dashboard
- Customer Presence Tracking (priority feature)
- Manage Users (add/delete/toggle)
- Manage Products (CRUD)
- View & Update Order Status
- View Snap & Ask Inquiries with Quick Reply

### 8. Invoice Vault
- View delivered orders as invoices
- Download capability

### 9. WhatsApp Direct Line
- Contact owner at 603-461-1441

### 10. Service Badges
- "Free Delivery" and "No Minimum Order" displayed prominently

## Demo Credentials
- **Admin:** Phone: 1234567890, PIN: 1234
- **Customer:** Phone: 9876543210, PIN: 5678

## Tech Stack
- **Frontend:** React Native (Expo SDK 54), expo-router
- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **State Management:** Zustand
- **API Client:** Axios

## Future Enhancements
- Google Sheets integration for live inventory
- Push notifications
- PDF invoice generation & email delivery
- Background location tracking
