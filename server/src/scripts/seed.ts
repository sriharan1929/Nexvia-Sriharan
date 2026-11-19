import mongoose from 'mongoose';
import { connectDB } from '../config';
import User from '../models/User';
import VendorProfile from '../models/VendorProfile';
import Category from '../models/Category';
import Product from '../models/Product';
import Coupon from '../models/Coupon';
import { hashPassword } from '../services/auth.service';
import { indexProduct } from '../services/search.service';
import { UserRole, ApprovalStatus, ProductStatus } from '../types';

async function seedDatabase() {
  console.log('[START] Starting BadaVyapar marketplace seed process...');
  await connectDB();

  // 1. Clear existing sample collections
  console.log('[CLEAN] Purging existing sample data...');
  await Promise.all([
    User.deleteMany({}),
    VendorProfile.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
  ]);

  // 2. Create Users
  console.log('[USERS] Seeding core platform users...');
  const commonPasswordHash = await hashPassword('BadaVyapar@123');

  const adminUser = await User.create({
    name: 'Marketplace Administrator',
    email: 'admin@badavyapar.com',
    passwordHash: commonPasswordHash,
    roles: [UserRole.ADMIN, UserRole.CUSTOMER],
    accountStatus: 'ACTIVE',
  });

  const vendorUser1 = await User.create({
    name: 'Rajesh Sharma',
    email: 'seller.tech@badavyapar.com',
    passwordHash: commonPasswordHash,
    roles: [UserRole.VENDOR, UserRole.CUSTOMER],
    accountStatus: 'ACTIVE',
  });

  const vendorUser2 = await User.create({
    name: 'Ananya Iyer',
    email: 'seller.craft@badavyapar.com',
    passwordHash: commonPasswordHash,
    roles: [UserRole.VENDOR, UserRole.CUSTOMER],
    accountStatus: 'ACTIVE',
  });

  const vendorUserPending = await User.create({
    name: 'Vikram Malhotra',
    email: 'seller.urban@badavyapar.com',
    passwordHash: commonPasswordHash,
    roles: [UserRole.VENDOR, UserRole.CUSTOMER],
    accountStatus: 'ACTIVE',
  });

  const customerUser = await User.create({
    name: 'Priya Verma',
    email: 'customer@badavyapar.com',
    passwordHash: commonPasswordHash,
    roles: [UserRole.CUSTOMER],
    accountStatus: 'ACTIVE',
  });

  // 3. Create Vendor Profiles
  console.log('[VENDORS] Seeding vendor store profiles...');
  const vendorProfile1 = await VendorProfile.create({
    userId: vendorUser1._id,
    storeName: 'TechNexus Electronics',
    slug: 'technexus-electronics',
    description: 'Premier seller of certified electronics, mechanical keyboards, and computer peripherals.',
    contactEmail: 'contact@technexus.in',
    contactPhone: '+919876543210',
    approvalStatus: ApprovalStatus.APPROVED,
    paymentProviderAccountId: 'acc_route_technexus_9988',
    razorpayLinkedAccountId: 'acc_route_technexus_9988',
  });

  const vendorProfile2 = await VendorProfile.create({
    userId: vendorUser2._id,
    storeName: 'Vedic Craft Handlooms',
    slug: 'vedic-craft-handlooms',
    description: 'Authentic Indian handlooms, Kashmiri shawls, and pure organic home textiles directly from master artisans.',
    contactEmail: 'namaste@vediccraft.in',
    contactPhone: '+919876543211',
    approvalStatus: ApprovalStatus.APPROVED,
    paymentProviderAccountId: 'acc_route_vediccraft_7766',
    razorpayLinkedAccountId: 'acc_route_vediccraft_7766',
  });

  await VendorProfile.create({
    userId: vendorUserPending._id,
    storeName: 'Urban Vogue Studio',
    slug: 'urban-vogue-studio',
    description: 'Contemporary streetwear and casual essentials waiting for marketplace team approval.',
    contactEmail: 'hi@urbanvogue.in',
    contactPhone: '+919876543212',
    approvalStatus: ApprovalStatus.PENDING,
  });

  // 4. Create Categories
  console.log('[CATEGORIES] Seeding catalog categories...');
  const catElectronics = await Category.create({
    name: 'Electronics & Peripherals',
    slug: 'electronics',
    isActive: true,
  });

  const catHandlooms = await Category.create({
    name: 'Handlooms & Shawls',
    slug: 'handlooms',
    isActive: true,
  });

  const catHome = await Category.create({
    name: 'Home & Living',
    slug: 'home-living',
    isActive: true,
  });

  // 5. Create Authoritative Products
  console.log('[PRODUCTS] Seeding marketplace products...');
  const v1Id = vendorProfile1._id;
  const v2Id = vendorProfile2._id;
  const cElecId = catElectronics._id;
  const cHandId = catHandlooms._id;
  const cHomeId = catHome._id;

  const productsData = [
    {
      vendorId: v1Id as any,
      categoryId: cElecId as any,
      title: 'TechNexus RGB Mechanical Gaming Keyboard (Hot-swappable)',
      slug: 'technexus-rgb-mechanical-gaming-keyboard',
      description: 'Tenkeyless mechanical keyboard with pre-lubed red linear switches, double-shot PBT keycaps, per-key RGB backlighting, and braided USB-C detachable cable. Designed for high-speed typing and responsive esports gaming.',
      pricePaise: 249900, // ₹2,499.00
      compareAtPricePaise: 399900,
      stock: 35,
      status: ProductStatus.ACTIVE,
      images: [
        {
          key: 'prod_keyboard_1',
          url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
          order: 0,
        },
      ],
      tags: ['keyboard', 'mechanical', 'gaming', 'rgb', 'electronics'],
    },
    {
      vendorId: v1Id as any,
      categoryId: cElecId as any,
      title: 'Precision-X Ultralight Wireless Gaming Mouse (26K DPI)',
      slug: 'precision-x-ultralight-wireless-gaming-mouse',
      description: 'Weighing only 58 grams, Precision-X delivers sub-1ms wireless latency, PixArt 3395 optical sensor, PTFE glide feet, and 80-hour battery life with fast Type-C recharging.',
      pricePaise: 129900, // ₹1,299.00
      compareAtPricePaise: 199900,
      stock: 50,
      status: ProductStatus.ACTIVE,
      images: [
        {
          key: 'prod_mouse_1',
          url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
          order: 0,
        },
      ],
      tags: ['mouse', 'wireless', 'gaming', 'peripherals'],
    },
    {
      vendorId: v1Id as any,
      categoryId: cElecId as any,
      title: 'ProConnect 7-in-1 Aluminium USB-C Multiport Hub',
      slug: 'proconnect-7-in-1-aluminium-usbc-multiport-hub',
      description: 'Dual 4K@60Hz HDMI, 100W Power Delivery pass-through charging, Gigabit Ethernet, SD/TF card reader, and USB 3.2 10Gbps ports encased in heat-dissipating aerospace-grade aluminium.',
      pricePaise: 319900, // ₹3,199.00
      compareAtPricePaise: 449900,
      stock: 20,
      status: ProductStatus.ACTIVE,
      images: [
        {
          key: 'prod_hub_1',
          url: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=800&auto=format&fit=crop&q=80',
          order: 0,
        },
      ],
      tags: ['hub', 'usbc', 'dock', 'accessories'],
    },
    {
      vendorId: v2Id as any,
      categoryId: cHandId as any,
      title: 'Authentic Handwoven Kashmiri Pashmina Shawl (Ivory & Gold)',
      slug: 'authentic-handwoven-kashmiri-pashmina-shawl',
      description: 'Crafted from the finest Changthangi mountain goat fleece in Srinagar, Jammu & Kashmir. Hand-spun on traditional charkhas with delicate Sozni needlework border embroidery.',
      pricePaise: 450000, // ₹4,500.00
      compareAtPricePaise: 650000,
      stock: 12,
      status: ProductStatus.ACTIVE,
      images: [
        {
          key: 'prod_shawl_1',
          url: 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=800&auto=format&fit=crop&q=80',
          order: 0,
        },
      ],
      tags: ['pashmina', 'shawl', 'handloom', 'kashmiri', 'fashion'],
    },
    {
      vendorId: v2Id as any,
      categoryId: cHomeId as any,
      title: 'Jaipur Heritage Block-Printed Cotton King Bedspread (With 2 Pillows)',
      slug: 'jaipur-heritage-block-printed-cotton-bedspread',
      description: '100% long-staple cotton bedsheet hand-printed using traditional wooden blocks and natural vegetable dyes by Sanganeri artisans. Includes two coordinating envelope pillowcases.',
      pricePaise: 185000, // ₹1,850.00
      compareAtPricePaise: 279900,
      stock: 25,
      status: ProductStatus.ACTIVE,
      images: [
        {
          key: 'prod_bedspread_1',
          url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
          order: 0,
        },
      ],
      tags: ['bedspread', 'cotton', 'jaipur', 'home', 'living'],
    },
    {
      vendorId: v2Id as any,
      categoryId: cHomeId as any,
      title: 'Artisan Terracotta Ceramic Glazed Dinner Set (6 Piece Handcrafted)',
      slug: 'artisan-terracotta-ceramic-glazed-dinner-set',
      description: 'Microwave and dishwasher-safe stoneware dinner set handcrafted by pottery masters in Khurja. Matte earthy finish with food-safe lead-free glaze.',
      pricePaise: 220000, // ₹2,200.00
      compareAtPricePaise: 320000,
      stock: 18,
      status: ProductStatus.ACTIVE,
      images: [
        {
          key: 'prod_dinner_1',
          url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&auto=format&fit=crop&q=80',
          order: 0,
        },
      ],
      tags: ['ceramic', 'dinnerware', 'terracotta', 'kitchen', 'home'],
    },
  ];

  const createdProducts = await Product.insertMany(productsData);

  // Sync to Elasticsearch if available
  console.log('[SEARCH] Syncing products to search index...');
  for (const prod of createdProducts) {
    try {
      await indexProduct(prod);
    } catch {
      // Elasticsearch gracefully ignored during local seed if offline
    }
  }

  // 6. Create Promotional Coupons
  console.log('[COUPONS] Seeding promotional coupons...');
  const thirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await Coupon.insertMany([
    {
      code: 'SAVE10',
      type: 'PERCENTAGE',
      percentage: 10,
      maxDiscountPaise: 50000, // ₹500 max
      minOrderPaise: 100000, // Min ₹1,000
      usageLimit: 1000,
      usedCount: 0,
      validFrom: new Date(),
      validUntil: thirtyDays,
      isActive: true,
    },
    {
      code: 'FLAT200',
      type: 'FIXED',
      valuePaise: 20000, // ₹200 off
      minOrderPaise: 150000, // Min ₹1,500
      usageLimit: 500,
      usedCount: 0,
      validFrom: new Date(),
      validUntil: thirtyDays,
      isActive: true,
    },
    {
      code: 'WELCOME50',
      type: 'FIXED',
      valuePaise: 5000, // ₹50 off
      minOrderPaise: 50000, // Min ₹500
      usageLimit: 5000,
      usedCount: 0,
      validFrom: new Date(),
      validUntil: thirtyDays,
      isActive: true,
    },
  ]);

  console.log('\n======================================================');
  console.log('[SUCCESS] BadaVyapar Marketplace Seed Complete!');
  console.log('======================================================');
  console.log('Demo Credentials (All accounts use password: BadaVyapar@123):');
  console.log('  [ADMIN]    admin@badavyapar.com');
  console.log('  [VENDOR 1] seller.tech@badavyapar.com (TechNexus Electronics)');
  console.log('  [VENDOR 2] seller.craft@badavyapar.com (Vedic Craft Handlooms)');
  console.log('  [PENDING]  seller.urban@badavyapar.com (Urban Vogue Studio)');
  console.log('  [CUSTOMER] customer@badavyapar.com (Priya Verma)');
  console.log('------------------------------------------------------');
  console.log('Coupons: SAVE10 (10% off), FLAT200 (₹200 off), WELCOME50 (₹50 off)');
  console.log('======================================================\n');

  await mongoose.disconnect();
}

seedDatabase().catch((err) => {
  console.error('[ERROR] Seeding failed:', err);
  process.exit(1);
});
