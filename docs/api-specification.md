# BadaVyapar — REST API Specification

> **Base URL**: `/api/v1`  
> **Protocol**: HTTPS / JSON (except webhook signature payloads which accept `application/json` as raw bytes)  
> **Auth Headers**: `Authorization: Bearer <accessToken>`  
> **Refresh Cookie**: `refreshToken=<token>; HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`

---

## 1. Standard Response Schemas

### 1.1 Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### 1.2 Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 156,
    "pages": 13
  }
}
```

### 1.3 Error Response
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [
    {
      "path": "email",
      "message": "Invalid email address format"
    }
  ]
}
```

---

## 2. API Endpoints Catalog

### 2.1 Authentication & Profile
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create new customer/vendor user account |
| `POST` | `/auth/login` | Public | Authenticate credentials; return JWT + refresh cookie |
| `POST` | `/auth/refresh` | Cookie | Exchange valid refresh cookie for new access token |
| `POST` | `/auth/logout` | Authenticated | Revoke refresh token and clear cookie |
| `GET` | `/users/me` | Authenticated | Fetch active user identity and roles |

### 2.2 Vendor Onboarding & Store Profile
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/vendor/applications` | Customer | Submit store application; assigns pending vendor profile |
| `GET` | `/vendor/profile` | Vendor | Retrieve authenticated vendor store profile & status |
| `PATCH` | `/vendor/profile` | Vendor (Approved) | Update store description, logo, and phone |

### 2.3 Administration (Vendor & Category Moderation)
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/admin/vendors` | Admin | List vendor applications (filterable by `status`) |
| `PATCH` | `/admin/vendors/:id/status` | Admin | Approve or reject vendor (`{ status, rejectionReason }`) |
| `POST` | `/admin/categories` | Admin | Create category or subcategory |
| `PATCH` | `/admin/categories/:id` | Admin | Update category details or active status |

### 2.4 Catalog & Search (Public)
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/products` | Public | Elasticsearch-backed product search, category filter, price sort |
| `GET` | `/products/:slug` | Public | Authoritative product detail with vendor store info |
| `GET` | `/categories` | Public | Retrieve active category hierarchy |

### 2.5 Vendor Catalog Management
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/vendor/products` | Vendor (Approved) | List products owned by the vendor |
| `POST` | `/vendor/products` | Vendor (Approved) | Create product (sets `status: PENDING` or `ACTIVE`) |
| `PATCH` | `/vendor/products/:id` | Vendor (Owner) | Update product title, price, stock, images |
| `DELETE` | `/vendor/products/:id` | Vendor (Owner) | Soft-delete product to `ARCHIVED` |
| `POST` | `/uploads/presign` | Vendor (Approved) | Generate secure short-lived S3 upload URL |

### 2.6 Cart (Redis Backed)
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/cart` | Customer | Fetch cart with live prices hydrated from MongoDB |
| `PUT` | `/cart/items/:productId` | Customer | Set quantity for an item (validated against current stock) |
| `DELETE` | `/cart/items/:productId` | Customer | Remove specific product from cart |
| `DELETE` | `/cart` | Customer | Empty the customer's cart |
| `GET` | `/cart/count` | Customer | Lightweight count of cart items for navbar badge |

### 2.7 Checkout & Order Management
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/checkout/preview` | Customer | Calculate totals, validate coupons, simulate breakdown |
| `POST` | `/checkout/session` | Customer | Create transaction: reserve stock, make Parent + SellerOrders, return Razorpay order |
| `GET` | `/orders` | Customer | Paginated history of customer's parent orders |
| `GET` | `/orders/:id` | Customer (Owner) | Order detail with itemized seller fulfillment status |
| `GET` | `/orders/:id/invoice.pdf` | Customer (Owner) / Admin | Stream authenticated PDF invoice generated via PDFKit |

### 2.8 Vendor Order Fulfillment
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/vendor/orders` | Vendor (Approved) | List `SellerOrders` assigned to vendor |
| `PATCH` | `/vendor/seller-orders/:id/status` | Vendor (Owner) | Transition state: `PLACED` → `PACKED` → `SHIPPED` → `DELIVERED` |

### 2.9 Payments & Webhooks
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/payments/razorpay/verify` | Customer | Verify frontend payment signature for quick UX feedback |
| `POST` | `/webhooks/razorpay` | Razorpay Signature | Webhook handler for `payment.captured`, `transfer.processed` |

### 2.10 Coupons & Customer Reviews
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `POST` | `/coupons/validate` | Customer | Check coupon eligibility against cart subtotal |
| `GET` | `/products/:id/reviews` | Public | Paginated product reviews |
| `POST` | `/products/:id/reviews` | Customer | Submit review (enforces 1 review per delivered purchase) |
| `POST` | `/admin/coupons` | Admin | Create promotional coupon code |
| `GET` | `/admin/coupons` | Admin | List promotional coupons |

### 2.11 Analytics
| Method | Path | Auth Required | Description |
|---|---|---|---|
| `GET` | `/admin/analytics/overview` | Admin | Platform GMV, total commissions, order counts, active vendors |
| `GET` | `/vendor/analytics` | Vendor (Approved) | Vendor net revenue, items sold, pending fulfillments |
