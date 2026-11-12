# 🏪 BadaVyapar (badavyapar.com) — Multi-Vendor E-Commerce Marketplace

> A production-ready multi-vendor e-commerce platform engineered with React (TypeScript), Node.js (Express + TypeScript), MongoDB, Elasticsearch, Redis, AWS S3, and Razorpay Route.

---

## 🌟 Key Architecture & Highlights

- **Multi-Vendor Checkout**: Customers purchase from multiple independent sellers in a single checkout.
- **Parent Order + SellerOrders Pattern**: Decentralized fulfillment; each vendor sees and updates only their items (`PLACED` → `PACKED` → `SHIPPED` → `DELIVERED`).
- **Decoupled Status Life Cycle**: Independent tracking for Payment (`PAID`/`FAILED`), Fulfillment (`SHIPPED`), and Settlement (`TRANSFERRED`).
- **Financial Precision**: All monetary values calculated in 64-bit integer paise (`1 INR = 100 paise`) using `Math.round`.
- **Authoritative Source of Truth**: MongoDB is the sole financial authority; Redis and Elasticsearch act as search/cache indices.
- **Direct S3 Uploads**: Secure image ingestion via presigned URLs without streaming files through the application server.

---

## 🏗️ Repository Layout

```
Market_Place/
├── client/              # React 19 + TypeScript + Vite + Tailwind CSS v4 frontend
│   ├── src/
│   │   ├── app/         # Providers, router, layout shell
│   │   ├── components/  # Reusable UI primitives (Button, Input, etc.)
│   │   ├── features/    # Domain modules (auth, catalog, cart, checkout, vendor, admin)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Axios client, currency helpers, constants
│   │   └── types/       # Shared TypeScript interfaces
├── server/              # Node.js + Express + TypeScript backend
│   ├── src/
│   │   ├── config/      # MongoDB, Redis, Elasticsearch, S3, Environment
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth, validation, error handler, rate limiters
│   │   ├── models/      # Mongoose schemas (Users, Products, Orders, etc.)
│   │   ├── routes/      # Express REST routes
│   │   ├── services/    # Business logic & commission calculation
│   │   ├── types/       # Enums and request types
│   │   └── index.ts     # Server entry point
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
- MongoDB instance (local or Atlas)
- Redis instance (local or Upstash)
- Elasticsearch cluster (optional for local mock / Elastic Cloud)

### 2. Environment Configuration
Copy `.env.example` in both root and `server/`:
```bash
cp .env.example .env
cp .env.example server/.env
```

### 3. Server Setup
```bash
cd server
npm install
npm run dev
```
Health endpoint: `http://localhost:5000/api/v1/health`

### 4. Client Setup
```bash
cd client
npm install
npm run dev
```
Storefront: `http://localhost:5173`

---

## 📚 Documentation Links
- [System Architecture](file:///e:/Market_Place/docs/architecture.md)
- [Database Schema & ERD](file:///e:/Market_Place/docs/database-schema.md)
- [REST API Specification](file:///e:/Market_Place/docs/api-specification.md)
- [Commission & Settlement Policy](file:///e:/Market_Place/docs/commission-policy.md)

