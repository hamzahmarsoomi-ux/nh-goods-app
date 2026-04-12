# NH GOODS - تفاصيل المشروع الكاملة
# Complete Project Details for Website Builder

---

## 1. معلومات الشركة (Company Info)
- **اسم الشركة**: NH QUALITY GOODS LLC
- **العلامة التجارية**: Vision & Faith
- **اسم التطبيق**: NH GOODS
- **النوع**: تطبيق بيع الجملة (Wholesale B2B)
- **Package Name**: com.nhqualitygoods.nhgoods
- **إيميل التواصل**: hamzahmarsoomi@gmail.com

---

## 2. الألوان والتصميم (Theme & Design)
- **اللون الأساسي (Primary)**: Navy Blue - #0A1628
- **اللون الثانوي (Secondary)**: Gold - #D4AF37
- **لون الخلفية**: #0F1B2D (Dark Navy)
- **لون البطاقات**: #1A2742
- **لون النص الرئيسي**: #FFFFFF (أبيض)
- **لون النص الثانوي**: #8899AA
- **لون النجاح**: #00C853 (أخضر)
- **لون الخطأ**: #FF3D00 (أحمر)
- **الخط**: System default (San Francisco / Roboto)
- **التصميم**: Dark Mode دائم، زوايا مدورة 12px

---

## 3. الصفحات والميزات (Pages & Features)

### صفحات العميل (Customer Pages):
1. **Splash Screen** - شاشة البداية مع شعار NH GOODS
2. **Login** - تسجيل دخول برقم الهاتف + PIN (4-6 أرقام)
3. **Home** - الصفحة الرئيسية (عروض اليوم + الأقسام)
4. **Catalog** - كتالوج المنتجات مع فلتر بالأقسام
5. **Cart** - سلة المشتريات مع تعليمات الدفع "Check Photo"
6. **Orders** - تتبع الطلبات (Pending, Confirmed, Delivered, Rejected)
7. **Profile** - الملف الشخصي + تغيير اللغة + تسجيل الخروج
8. **Messages** - رسائل مع الإدارة + مشاركة ملفات PDF
9. **Snap & Ask** - التقاط صورة منتج والسؤال عن السعر

### صفحات الإدارة (Admin Pages):
1. **Admin Dashboard** - لوحة التحكم الرئيسية
2. **User Management** - إدارة العملاء (الاسم، المتجر، الموقع GPS، EIN)
3. **Product Management** - إضافة/تعديل/حذف المنتجات مع صور
4. **Today's Deals** - إدارة عروض اليوم
5. **Activity Analytics** - إحصائيات النشاط (تسجيلات دخول، إضافات للسلة)
6. **Order Management** - إدارة الطلبات (تأكيد/رفض/محادثة)
7. **Invoice Builder** - إنشاء فواتير رقمية (ترقيم HM-0001)
8. **Photo Tool** - أداة تصوير المنتجات
9. **Customer Presence** - عرض موقع العملاء (GPS Geofencing)

---

## 4. أقسام المنتجات (Product Categories)
1. Snacks (وجبات خفيفة)
2. Beverages (مشروبات)
3. Dairy (ألبان)
4. Grocery (بقالة)
5. Frozen (مجمدات)
6. Household (منزلية)
7. Candy (حلويات)
8. Energy Drinks (مشروبات طاقة)
9. Nuts & Seeds (مكسرات وبذور)
10. Personal Care (عناية شخصية)

---

## 5. اللغات المدعومة (Supported Languages)
1. English (الإنجليزية)
2. Español (الإسبانية)
3. اردو (الأوردو - RTL)
4. हिंदी (الهندية)
5. नेपाली (النيبالية)
6. 中文 (الصينية)

---

## 6. قاعدة البيانات (Database Schema)

### جدول المستخدمين (Users):
- phone_number (رقم الهاتف)
- pin_hash (كلمة المرور المشفرة)
- name (الاسم)
- language (اللغة)
- is_admin (هل هو مدير)
- shop_name (اسم المتجر)
- shop_address (عنوان المتجر)
- shop_latitude (خط العرض)
- shop_longitude (خط الطول)
- ein_number (رقم EIN)
- can_see_prices (يمكنه رؤية الأسعار)

### جدول المنتجات (Products):
- name (الاسم)
- description (الوصف)
- price (السعر - بالجملة فقط)
- stock (المخزون)
- category (القسم)
- image_base64 (الصورة)
- is_deal (عرض اليوم)

### جدول الطلبات (Orders):
- user_id (معرف العميل)
- items (المنتجات - اسم + كمية + سعر)
- total_amount (المبلغ الإجمالي)
- status (الحالة: pending/confirmed/delivered/rejected)
- payment_method (طريقة الدفع)
- created_at (تاريخ الإنشاء)

### جدول الرسائل (Messages):
- conversation_id (معرف المحادثة)
- sender_id (المرسل)
- text (النص)
- is_read (مقروءة)
- file_url (رابط الملف)
- file_name (اسم الملف)

### جدول الفواتير (Invoices):
- invoice_number (رقم الفاتورة - HM-0001)
- customer_name, customer_phone, customer_address
- items (المنتجات)
- subtotal, tax, total
- created_at

---

## 7. بيانات الدخول (Login Credentials)
- **المدير (Admin)**: رقم `19971997` / PIN `181818`
- **العميل (Customer)**: رقم `9876543210` / PIN `5678`

---

## 8. الروابط المهمة (Important Links)
- **GitHub**: https://github.com/hamzahmarsoomi-ux/nh-goods-app
- **APK (Android)**: https://expo.dev/artifacts/eas/ekHqXxwFPWRP58UMpxtMiT.apk
- **AAB (Google Play)**: https://expo.dev/artifacts/eas/aT2dAc1MDo8iNDMTXxByx.aab
- **MongoDB Atlas**: cluster0.fzdqwxz.mongodb.net (User: nhgoods_user / Pass: NHGoods2026Secure)

---

## 9. وصف التطبيق للنشر (App Description)

### وصف قصير:
Wholesale ordering app for NH Quality Goods - Browse, order & manage inventory.

### وصف كامل:
NH GOODS is the official wholesale ordering app for NH QUALITY GOODS LLC (Brand: Vision & Faith). Designed exclusively for registered wholesale customers, this app streamlines your entire ordering process from browsing products to receiving invoices.

KEY FEATURES:
- Product Catalog with wholesale pricing
- Easy ordering with cart and checkout
- Flash Deals - daily promotions
- Digital Invoicing (PDF)
- In-App Messaging with file sharing
- Snap & Ask - photo product inquiries
- Multi-language support (6 languages)
- GPS Geofencing for customer presence
- Admin Dashboard with analytics

---

## 10. التقنيات المستخدمة (Tech Stack)
- **Frontend**: React Native (Expo SDK 54) with Expo Router
- **Backend**: Python FastAPI
- **Database**: MongoDB
- **Authentication**: Phone + PIN with JWT tokens
- **Image Storage**: Base64
- **PDF Generation**: Server-side
- **Localization**: i18next (6 languages)
- **State Management**: Zustand
- **GPS**: expo-location with background tracking

---

## 11. API Endpoints الرئيسية
- POST /api/auth/login - تسجيل الدخول
- POST /api/auth/register - التسجيل
- GET /api/products - المنتجات
- GET /api/categories - الأقسام
- GET /api/flash-deals - عروض اليوم
- POST /api/orders - إنشاء طلب
- GET /api/orders - عرض الطلبات
- GET /api/messages - الرسائل
- POST /api/messages - إرسال رسالة
- GET /api/invoices - الفواتير
- POST /api/invoices - إنشاء فاتورة
- POST /api/snap-ask - صورة + سؤال
- GET /api/admin/users - إدارة العملاء
- GET /api/admin/activity - إحصائيات النشاط
- POST /api/location/update - تحديث الموقع
- GET /api/admin/customers/presence - موقع العملاء
