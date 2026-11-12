# BadaVyapar — Commission & Settlement Policy

> **Policy Version**: 1.0.0  
> **Currency Unit**: Integer Paise (`1 INR = 100 paise`)  

---

## 1. Core Principles

1. **Transparent & Deterministic Calculations**: All mathematical operations occur in integer paise using deterministic integer rounding (`Math.round`).
2. **Pre-Deduction Settlement**: The marketplace calculates platform commissions at checkout and transfers net proceeds (`vendorNetPaise`) to approved vendor linked accounts via Razorpay Route.
3. **Historical Snapshots**: The active commission percentage is immutably snapshotted onto each `SellerOrder` at checkout time. Future platform commission updates never alter historical orders.
4. **Isolated Basis**: Platform commission applies strictly to eligible product subtotals (after coupon allocations). Delivery fees, GST/taxes, and payment gateway processing fees are excluded from the commission calculation base.

---

## 2. Commission Formula

For a given vendor $i$ participating in an order:

$$\text{vendorSubtotalPaise}_i = \sum (\text{itemPricePaise} \times \text{quantity}) - \text{allocatedDiscountPaise}_i$$

$$\text{commissionPaise}_i = \text{round}(\text{vendorSubtotalPaise}_i \times \text{commissionRate}_i)$$

$$\text{vendorNetPaise}_i = \text{vendorSubtotalPaise}_i - \text{commissionPaise}_i$$

Where:
- $\text{commissionRate}_i$: Configurable platform rate (default: $0.10$ or $10\%$).
- $\text{round}(x)$: Integer round to nearest whole paise (`Math.round(x)`).

---

## 3. Multi-Vendor Coupon Discount Allocation

When a platform-wide coupon is applied, the total discount is apportioned proportionally across participating sellers based on their raw product subtotal share:

$$\text{vendorShareRatio}_i = \frac{\text{rawSubtotal}_i}{\sum \text{rawSubtotal}}$$

$$\text{allocatedDiscountPaise}_i = \text{round}(\text{totalDiscountPaise} \times \text{vendorShareRatio}_i)$$

*Note: Any single-paise rounding discrepancy across the sum of vendor discounts is allocated to the highest-subtotal vendor.*

---

## 4. Gateway Fees & Taxes

- **Payment Gateway Fees**: Gateway convenience and interchange fees charged by Razorpay are absorbed directly by BadaVyapar platform operations and are **not** passed through as arbitrary deductions on vendor payouts.
- **Taxes (GST)**: Applicable GST invoices for the platform commission service fee will be issued separately to vendors at month-end.

---

## 5. Concrete End-to-End Example

### Scenario
A customer purchases items from two separate vendors in a single checkout session:
- **Vendor A**: Keyboard (1 unit @ ₹1,000 = `100000` paise)
- **Vendor B**: Mouse (1 unit @ ₹500 = `50000` paise)
- **Coupon**: `SAVE10` gives 10% off the order subtotal (₹150 = `15000` paise discount).
- **Platform Commission Rate**: 10% (`0.10`).

### Step-by-Step Settlement

1. **Subtotal Breakdown**:
   - Total Raw Subtotal: ₹1,500 (`150000` paise)
   - Vendor A Share: $\frac{1000}{1500} = 66.67\%$
   - Vendor B Share: $\frac{500}{1500} = 33.33\%$

2. **Discount Allocation**:
   - Vendor A Discount: $\text{round}(15000 \times \frac{2}{3}) = 10000$ paise (₹100)
   - Vendor B Discount: $\text{round}(15000 \times \frac{1}{3}) = 5000$ paise (₹50)

3. **Net Subtotal per SellerOrder**:
   - Vendor A Subtotal: $100000 - 10000 = 90000$ paise (₹900)
   - Vendor B Subtotal: $50000 - 5000 = 45000$ paise (₹450)

4. **Platform Commission Deduction**:
   - Vendor A Commission: $\text{round}(90000 \times 0.10) = 9000$ paise (₹90)
   - Vendor B Commission: $\text{round}(45000 \times 0.10) = 4500$ paise (₹45)
   - **Total Platform Commission**: $9000 + 4500 = 13500$ paise (₹135)

5. **Vendor Proceeds Transferred via Route**:
   - Vendor A Net Transfer: $90000 - 9000 = 81000$ paise (₹810)
   - Vendor B Net Transfer: $45000 - 4500 = 40500$ paise (₹405)
   - Customer Paid: ₹1,350 ($810 + 405 + 135$)

