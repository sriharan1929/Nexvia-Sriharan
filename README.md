# 🏪 BadaVyapar (badavyapar.com) — Multi-Vendor E-Commerce Marketplace

> A production-ready multi-vendor e-commerce platform engineered with React (TypeScript), Node.js (Express + TypeScript), MongoDB, Elasticsearch, Redis, AWS S3, and Razorpay Route.

---

## 🌟 Key Architecture & Highlights

- **Multi-Vendor Checkout**: Customers purchase from multiple independent sellers in a single checkout session.
- **Parent Order + SellerOrders Pattern**: Decentralized fulfillment; each vendor sees and updates only their items (`PLACED` → `PACKED` → `SHIPPED` → `DELIVERED`).
- **Decoupled Status Life Cycle**: Independent tracking for Payment (`PAID`/`FAILED`), Fulfillment (`SHIPPED`), and Settlement (`TRANSFERRED`).
- **Financial Precision**: All monetary values calculated in 64-bit integer paise (`1 INR = 100 paise`) using `Math.round` with zero fraction drift.
- **Authoritative Source of Truth**: MongoDB is the sole financial authority; Redis and Elasticsearch act as search/cache indices with automatic database fallback.
- **Razorpay Route Automated Transfers**: Instant split payouts to vendor linked accounts after platform commission deduction.
- **Direct S3 Uploads**: Secure image ingestion via presigned URLs without streaming files through the application server.
- **Verified Buyer Reviews**: Reviews strictly restricted to customers with delivered purchases; aggregated live into product rating summaries.
- **Promotional Coupons**: Percentage and flat discount codes with minimum cart subtotals and usage caps, apportioned proportionally across sellers.
- **Authenticated PDF Invoices**: Computer-generated tax invoices streamed on-demand using PDFKit with historical item and address snapshots.

---

## 🏗️ Repository Layout

```
Market_Place/
├── client/              # React 19 + TypeScript + Vite + Tailwind CSS v4 frontend
│   ├── src/
│   │   ├── app/         # Providers, router, layout shell
│   │   ├── components/  # Reusable UI primitives (Button, Input, Navbar, etc.)
│   │   ├── features/    # Domain modules (auth, catalog, cart, checkout, vendor, admin)
│   │   ├── hooks/       # Custom React hooks (useAuth, useCart)
│   │   ├── lib/         # Axios client, currency helpers, constants
│   │   └── types/       # Shared TypeScript interfaces
├── server/              # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── config/      # MongoDB, Redis, Elasticsearch, S3, Environment
│   │   ├── controllers/ # Request handlers (Auth, Catalog, Cart, Checkout, Orders, Payments, Coupons, Reviews, Analytics)
│   │   ├── middleware/  # Auth, validation, error handler, rate limiters
│   │   ├── models/      # Mongoose schemas (User, Product, Order, SellerOrder, Payment, VendorTransfer, Review, Coupon, etc.)
│   │   ├── routes/      # Express REST routes
│   │   ├── scripts/     # Seeding & search reindexing utilities
│   │   ├── services/    # Business logic & commission calculation
│   │   ├── tests/       # Vitest automated test suite (55 tests)
│   │   └── types/       # Enums and request types
├── docs/                # Architecture, schema, and API documentation
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-specification.md
│   └── commission-policy.md
├── .env.example
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js >= 18
- MongoDB instance (local `mongodb://localhost:27017/badavyapar` or MongoDB Atlas)
- Redis instance (local `redis://localhost:6379` or Upstash; automatic in-memory fallback included)
- Elasticsearch cluster (optional for local dev; automatic MongoDB regex search fallback included)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
cp .env.example server/.env
```

### 3. Server Setup & Database Seed
```bash
cd server
npm install
npm run seed     # Populates demo admin, sellers, products, categories & coupons
npm run dev      # Launches Express API on http://localhost:5000
```
Health endpoint: `http://localhost:5000/api/v1/health`

### 4. Client Setup
```bash
cd client
npm install
npm run dev      # Launches Vite dev server on http://localhost:5173
```
Storefront: `http://localhost:5173`

---

## 🔑 Demo Credentials

All seeded demo accounts share the password: `BadaVyapar@123`

| Role | Email | Description |
|---|---|---|
| **Platform Admin** | `admin@badavyapar.com` | Moderation console, vendor approvals, marketplace GMV analytics & coupons |
| **Vendor 1 (Approved)** | `seller.tech@badavyapar.com` | TechNexus Electronics — Keyboard, mouse, USB-C dock listings & fulfillment |
| **Vendor 2 (Approved)** | `seller.craft@badavyapar.com` | Vedic Craft Handlooms — Pashmina shawls, cotton bedspreads & dinner sets |
| **Vendor (Pending)** | `seller.urban@badavyapar.com` | Urban Vogue Studio — Under-review seller application |
| **Customer** | `customer@badavyapar.com` | Priya Verma — Pre-configured buyer account |

### Active Demo Promo Coupons
- `SAVE10`: 10% discount on orders of ₹1,000+ (capped at ₹500)
- `FLAT200`: Flat ₹200 discount on orders of ₹1,500+
- `WELCOME50`: Flat ₹50 discount on orders of ₹500+

---

## 🧪 Testing & Verification

Run the comprehensive test suite (55 automated tests covering authentication, catalog, Elasticsearch DSL, Redis cart, multi-vendor order lifecycle, payment signatures, Route settlements, coupons, reviews, and 7 failure/concurrency scenarios):

```bash
# Run server test suite
npm --prefix server test

# Verify production builds
npm --prefix server run build
npm --prefix client run build
```

---

## 📚 Architectural Documentation
- [System Architecture](file:///e:/Market_Place/docs/architecture.md)
- [Database Schema & ERD](file:///e:/Market_Place/docs/database-schema.md)
- [REST API Specification](file:///e:/Market_Place/docs/api-specification.md)
- [Commission & Settlement Policy](file:///e:/Market_Place/docs/commission-policy.md)
