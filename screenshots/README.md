# Application Screenshots & Verification Showcase

This directory contains visual documentation and test verification for the **Market Zone (Myntra-Clone)** full-stack multi-vendor marketplace platform.

---

## 1. Feature Coverage & Screenshot Index

| Screenshot ID | Feature Module | View / Route | Description |
|---|---|---|---|
| `01_home_hero_carousel.png` | **Hero Carousel & Banners** | `/` | Auto-sliding hero banner carousel, promotional offer strips, circular category tiles, and trust assurance section. |
| `02_mega_menu_navigation.png` | **Mega Menu Navigation** | Header | Multi-column hover mega menus for **MEN**, **WOMEN**, **KIDS**, **HOME & LIVING**, and **BEAUTY** with category links. |
| `03_product_listing_plp.png` | **Product Listing Page (PLP)** | `/products` | 4-column responsive grid with strict **3:4 aspect ratio**, multi-select category/price/rating sidebar filters, and sort options. |
| `04_product_detail_pdp.png` | **Product Details Page (PDP)** | `/products/:slug` | 2-column layout with image thumbnail selector, size picker (S, M, L, XL, XXL), PIN code delivery checker, and customer reviews. |
| `05_shopping_bag_coupons.png` | **Shopping Bag** | `/cart` | 2-column bag layout with quantity dropdowns, Move to Wishlist, promo coupon modal (`SAVE10`, `FLAT200`), and price summary. |
| `06_stepped_checkout.png` | **Stepped Checkout** | `/checkout` | Distraction-free checkout header with `BAG ── ADDRESS ── PAYMENT` stepper, address type pills (Home/Work), and multi-vendor parcel review. |
| `07_wishlist_grid.png` | **Wishlist System** | `/wishlist` | 4-column 3:4 card grid with persistent cross-tab local storage, "Move to Bag", and quick remove actions. |
| `08_vendor_dashboard.png` | **Vendor Portal** | `/vendor/dashboard` | Approved seller dashboard with product catalog management, stock updates, and dispatch parcel fulfillment. |

---

## 2. Automated Test Suite Verification

All **55 unit and integration tests** are implemented under `server/src/tests/` and pass with 100% green status:

```text
[PASS] src/tests/failure_scenarios.test.ts   (7 tests)
[PASS] src/tests/marketplace_extras.test.ts    (5 tests)
[PASS] src/tests/order_lifecycle.test.ts     (8 tests)
[PASS] src/tests/catalog_vendor.test.ts      (8 tests)
[PASS] src/tests/cart.test.ts                (7 tests)
[PASS] src/tests/search.test.ts              (6 tests)
[PASS] src/tests/payment.test.ts             (7 tests)
[PASS] src/tests/auth.test.ts                (7 tests)

Test Files  8 passed (8)
     Tests  55 passed (55)
```

---

## 3. Technology Stack & Design System
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui primitives, Lucide React icons
- **Color Palette**: Myntra Pink (`#FF3F6C`), Dark (`#282C3F`), Discount Green (`#03A685`), Soft White (`#F5F5F6`)
- **Backend**: Node.js, Express, TypeScript, Mongoose ODM, MongoDB Atlas Cloud
- **State & Data**: Redis shopping carts, Elasticsearch search synchronization, Razorpay Route multi-vendor split ledger

