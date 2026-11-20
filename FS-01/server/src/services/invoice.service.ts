import PDFDocument from 'pdfkit';
import { Response } from 'express';
import Order from '../models/Order';
import SellerOrder from '../models/SellerOrder';
import { AppError } from '../middleware/errorHandler';

/**
 * Streams an authentic, beautifully-formatted multi-vendor PDF invoice.
 */
export const generateInvoicePDF = async (orderId: string, res: Response) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  const sellerOrders = await SellerOrder.find({ orderId: order._id })
    .populate('vendorId', 'storeName slug contactEmail')
    .lean();

  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Stream directly to HTTP response
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="Invoice-${order.orderNumber}.pdf"`
  );

  doc.pipe(res);

  // 1. Header
  doc
    .fillColor('#d97706') // Amber primary
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('Market Zone', 40, 40)
    .fillColor('#6b7280')
    .fontSize(10)
    .font('Helvetica')
    .text('Multi-Vendor E-Commerce Platform · marketzone.com', 40, 68);

  doc
    .fillColor('#111827')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('TAX INVOICE', 400, 40, { align: 'right' })
    .fillColor('#4b5563')
    .fontSize(9)
    .font('Helvetica')
    .text(`Invoice Ref: INV-${order.orderNumber}`, 400, 60, { align: 'right' })
    .text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, 400, 72, {
      align: 'right',
    })
    .text(`Payment: ${order.paymentStatus}`, 400, 84, { align: 'right' });

  // Divider
  doc.moveTo(40, 105).lineTo(555, 105).strokeColor('#e5e7eb').lineWidth(1).stroke();

  // 2. Customer & Shipping Info
  let y = 120;
  doc
    .fillColor('#9ca3af')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('BILLED & DELIVERED TO:', 40, y);

  doc
    .fillColor('#111827')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text(order.addressSnapshot.name, 40, y + 14)
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#4b5563')
    .text(order.addressSnapshot.line1, 40, y + 28)
    .text(
      `${order.addressSnapshot.city}, ${order.addressSnapshot.state} - ${order.addressSnapshot.pincode}`,
      40,
      y + 40
    )
    .text(`Contact: ${order.addressSnapshot.phone}`, 40, y + 52);

  y += 75;

  // 3. Multi-Vendor Items Sections
  doc
    .fillColor('#111827')
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('ORDER ITEMS & VENDOR SHIPMENTS', 40, y);

  y += 20;

  for (const sOrder of sellerOrders) {
    const vendorName = (sOrder.vendorId as any)?.storeName || 'Verified Merchant';

    // Seller Box Header
    doc
      .rect(40, y, 515, 20)
      .fill('#f3f4f6')
      .stroke();

    doc
      .fillColor('#92400e') // Amber-800
      .fontSize(9)
      .font('Helvetica-Bold')
      .text(`SELLER: ${vendorName.toUpperCase()}`, 46, y + 5)
      .fillColor('#6b7280')
      .font('Helvetica')
      .fontSize(8)
      .text(`Status: ${sOrder.fulfillmentStatus}`, 450, y + 6, { align: 'right' });

    y += 26;

    // Table Header
    doc
      .fillColor('#6b7280')
      .fontSize(8)
      .font('Helvetica-Bold')
      .text('ITEM DESCRIPTION', 46, y)
      .text('QTY', 360, y, { align: 'center', width: 40 })
      .text('UNIT PRICE', 410, y, { align: 'right', width: 60 })
      .text('AMOUNT', 480, y, { align: 'right', width: 70 });

    y += 12;

    // Items
    for (const item of sOrder.items) {
      const unitRupees = (item.productSnapshot.pricePaise / 100).toFixed(2);
      const totalRupees = (item.lineTotalPaise / 100).toFixed(2);

      doc
        .fillColor('#1f2937')
        .fontSize(9)
        .font('Helvetica')
        .text(item.productSnapshot.title, 46, y, { width: 300 })
        .text(item.quantity.toString(), 360, y, { align: 'center', width: 40 })
        .text(`₹${unitRupees}`, 410, y, { align: 'right', width: 60 })
        .text(`₹${totalRupees}`, 480, y, { align: 'right', width: 70 });

      y += 18;
    }

    // Seller Subtotal line
    const sellerSubtotalRupees = (sOrder.vendorSubtotalPaise / 100).toFixed(2);
    doc
      .moveTo(350, y)
      .lineTo(555, y)
      .strokeColor('#e5e7eb')
      .stroke();

    y += 4;
    doc
      .fillColor('#4b5563')
      .fontSize(8)
      .font('Helvetica')
      .text('Seller Subtotal:', 380, y, { align: 'right', width: 90 })
      .font('Helvetica-Bold')
      .text(`₹${sellerSubtotalRupees}`, 480, y, { align: 'right', width: 70 });

    y += 24;
  }

  // 4. Grand Totals Summary
  y = Math.max(y, 580);
  doc.moveTo(40, y).lineTo(555, y).strokeColor('#d1d5db').lineWidth(1.5).stroke();
  y += 12;

  const subtotalRupees = (order.itemSubtotalPaise / 100).toFixed(2);
  const discountRupees = (order.discountPaise / 100).toFixed(2);
  const totalRupees = (order.totalPaise / 100).toFixed(2);

  doc
    .fillColor('#4b5563')
    .fontSize(9)
    .font('Helvetica')
    .text('Gross Items Subtotal:', 350, y, { align: 'right', width: 120 })
    .fillColor('#111827')
    .font('Helvetica-Bold')
    .text(`₹${subtotalRupees}`, 480, y, { align: 'right', width: 70 });

  if (order.discountPaise > 0) {
    y += 15;
    doc
      .fillColor('#16a34a')
      .fontSize(9)
      .font('Helvetica')
      .text('Coupon Discount:', 350, y, { align: 'right', width: 120 })
      .font('Helvetica-Bold')
      .text(`- ₹${discountRupees}`, 480, y, { align: 'right', width: 70 });
  }

  y += 15;
  doc
    .fillColor('#4b5563')
    .fontSize(9)
    .font('Helvetica')
    .text('Delivery & Shipping:', 350, y, { align: 'right', width: 120 })
    .fillColor('#16a34a')
    .font('Helvetica-Bold')
    .text('FREE', 480, y, { align: 'right', width: 70 });

  y += 18;
  doc
    .rect(340, y - 4, 215, 26)
    .fill('#fef3c7') // Amber-100
    .stroke();

  doc
    .fillColor('#92400e')
    .fontSize(11)
    .font('Helvetica-Bold')
    .text('TOTAL AMOUNT PAID:', 350, y + 4, { align: 'left', width: 120 })
    .text(`₹${totalRupees}`, 470, y + 4, { align: 'right', width: 80 });

  // 5. Footer Notes
  doc
    .fillColor('#9ca3af')
    .fontSize(8)
    .font('Helvetica')
    .text(
      'This document is a computer-generated tax invoice issued by Market Zone on behalf of participating sellers. No physical signature is required.',
      40,
      760,
      { align: 'center', width: 515 }
    );

  doc.end();
};

