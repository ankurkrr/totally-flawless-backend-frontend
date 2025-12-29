# Postman Collections - Updated for Current Codebase

## 📁 Files

### 1. `flawless040124.json` (Legacy)
- **Status:** ⚠️ Legacy collection
- **Routes:** Uses old endpoints like `/get-bookings`, `/update-gratuity`
- **Compatibility:** Still works via `legacyRoutes.js` redirects
- **Use Case:** Backward compatibility only

### 2. `flawless-api-v2.json` (✅ **USE THIS ONE**)
- **Status:** ✅ Updated collection matching current codebase
- **Routes:** Uses current `/api/*` endpoints
- **Structure:** Matches actual route files in `routes/` folder
- **Use Case:** Primary collection for testing

---

## 🔄 What Changed?

### Old Collection (Legacy)
```
/get-bookings
/update-gratuity
/create-user
/get-otp
```

### New Collection (Current)
```
/api/bookings
/api/bookings/gratuity
/api/auth/create-user
/api/auth/get-otp
```

---

## ✅ Updated Collection Features

### 1. **Matches Current Code Structure**
- All endpoints use `/api/*` prefix
- Routes match `routes/*.js` files exactly
- Follows the testing order you specified

### 2. **Proper Authentication**
- All protected endpoints include `Authorization: Bearer {{auth_token}}`
- Auto-saves tokens from authentication responses

### 3. **Environment Variables**
- Auto-saves `user_id`, `artist_id`, `cart_id`, `booking_id`
- Uses `{{base_url}}` variable (set to `http://localhost:3000/api`)

### 4. **Testing Order**
Collection is organized in the exact order you specified:
1. Authentication
2. Catalog
3. Users
4. Artists
5. Cart
6. Bookings
7. Payments
8. Chat
9. Wishlist

### 5. **Complete Coverage**
Includes all endpoints from:
- ✅ `routes/authRoutes.js`
- ✅ `routes/catalogRoutes.js`
- ✅ `routes/userRoutes.js`
- ✅ `routes/artistRoutes.js`
- ✅ `routes/cartRoutes.js`
- ✅ `routes/bookingRoutes.js`
- ✅ `routes/paymentRoutes.js`
- ✅ `routes/chatRoutes.js`
- ✅ `routes/wishlistRoutes.js`

---

## 🚀 How to Use

### Step 1: Import Collection
1. Open Postman
2. Click **Import**
3. Select `flawless-api-v2.json`
4. Collection imported! ✅

### Step 2: Set Environment Variables
Create environment with:
- `base_url`: `http://localhost:3000/api`
- Other variables auto-populate from responses

### Step 3: Test in Order
Follow the folder order:
1. Start with **Authentication** → Get token
2. Then **Catalog** → Get service IDs
3. Continue through **Users**, **Artists**, etc.

---

## 📋 Endpoint Mapping

### Authentication (`/api/auth/*`)
- ✅ `GET /api/auth/check-email`
- ✅ `POST /api/auth/create-user`
- ✅ `GET /api/auth/get-otp`
- ✅ `POST /api/auth/token`
- ✅ `POST /api/auth/create-artist`
- ✅ `GET /api/auth/get-artist-otp`

### Catalog (`/api/catalog/*`)
- ✅ `GET /api/catalog/categories`
- ✅ `GET /api/catalog/prices`
- ✅ `GET /api/catalog/subcategories`

### Users (`/api/users/*`)
- ✅ `GET /api/users/profile`
- ✅ `POST /api/users/update`
- ✅ `POST /api/users/update-gratuity`
- ✅ `POST /api/users/addresses`
- ✅ `GET /api/users/addresses`
- ✅ `GET /api/users/addresses/:addressId`
- ✅ `POST /api/users/addresses/update`
- ✅ `DELETE /api/users/addresses/:addressId`

### Artists (`/api/artists/*`)
- ✅ `GET /api/artists/profile`
- ✅ `POST /api/artists/update`
- ✅ `POST /api/artists/update-video`
- ✅ `POST /api/artists/location`
- ✅ `GET /api/artists/bookings`

### Cart (`/api/cart/*`)
- ✅ `POST /api/cart`
- ✅ `GET /api/cart`
- ✅ `POST /api/cart/assign-artist`

### Bookings (`/api/bookings/*`)
- ✅ `POST /api/bookings`
- ✅ `GET /api/bookings`
- ✅ `GET /api/bookings/data`
- ✅ `POST /api/bookings/confirm`
- ✅ `POST /api/bookings/cancel`
- ✅ `POST /api/bookings/gratuity`
- ✅ `POST /api/bookings/rating`

### Payments (`/api/payments/*`)
- ✅ `POST /api/payments/gratuity`
- ✅ `POST /api/payments/booking`
- ✅ `POST /api/payments/booking-payment`

### Chat (`/api/chat/*`)
- ✅ `POST /api/chat`
- ✅ `GET /api/chat/messages`
- ✅ `GET /api/chat/list`

### Wishlist (`/api/wishlist/*`)
- ✅ `POST /api/wishlist`
- ✅ `GET /api/wishlist`
- ✅ `DELETE /api/wishlist/:wishlistId`
- ✅ `POST /api/wishlist/contact`

---

## 🔍 Verification

The collection matches the codebase structure:

### Route Files → Collection Folders
```
routes/authRoutes.js      → 1. Authentication
routes/catalogRoutes.js   → 2. Catalog
routes/userRoutes.js       → 3. Users
routes/artistRoutes.js     → 4. Artists
routes/cartRoutes.js       → 5. Cart
routes/bookingRoutes.js    → 6. Bookings
routes/paymentRoutes.js    → 7. Payments
routes/chatRoutes.js       → 8. Chat
routes/wishlistRoutes.js   → 9. Wishlist
```

### Endpoints Match Validators
All request payloads match the validation schemas in `validators/*.js` files.

---

## 📝 Notes

1. **Legacy Routes Still Work:** The old collection (`flawless040124.json`) still works via `legacyRoutes.js`, but use the new collection for current testing.

2. **Environment Variables:** The collection includes scripts to auto-save IDs from responses.

3. **Base URL:** Default is `http://localhost:3000/api` - update in environment if needed.

4. **Authentication:** Most endpoints require `Authorization: Bearer {{auth_token}}` header.

---

## ✅ Summary

**Yes, I've updated the connection folder!**

- ✅ Created `flawless-api-v2.json` matching current codebase
- ✅ All endpoints use `/api/*` routes (not legacy routes)
- ✅ Follows your specified testing order
- ✅ Includes all endpoints from route files
- ✅ Proper authentication headers
- ✅ Auto-saves environment variables

**Use `flawless-api-v2.json` for testing!** 🚀

