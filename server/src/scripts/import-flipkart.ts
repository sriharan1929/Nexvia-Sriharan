/**
 * import-flipkart.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Imports Flipkart product CSV data into the BadaVyapar MongoDB database.
 *
 * USAGE:
 *   npx ts-node-dev src/scripts/import-flipkart.ts --file ./data/flipkart_com-ecommerce_sample.csv
 *
 * FLAGS:
 *   --file   <path>   Path to the Flipkart CSV file  (required)
 *   --limit  <n>      Max products to import         (default: 500)
 *   --clear           Wipe existing products first   (optional)
 *   --dry-run         Parse & preview without saving (optional)
 *
 * KAGGLE DATASET:
 *   https://www.kaggle.com/datasets/PromptCloudHQ/flipkart-products
 *   File: flipkart_com-ecommerce_sample.csv
 *
 * COLUMN MAP (Flipkart CSV → BadaVyapar schema):
 *   product_name       → title
 *   description        → description
 *   retail_price       → compareAtPricePaise  (MRP)
 *   discounted_price   → pricePaise           (selling price)
 *   product_category_tree → category mapping
 *   image              → images[0].url
 *   product_rating     → ratingSummary.average
 *   overall_rating     → ratingSummary.average (fallback)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import mongoose from 'mongoose';
import slugify from 'slugify';
import { connectDB } from '../config';
import Product from '../models/Product';
import Category from '../models/Category';
import VendorProfile from '../models/VendorProfile';
import { ProductStatus, ApprovalStatus } from '../types';

// ──────────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
};
const hasFlag = (flag: string) => args.includes(flag);

const CSV_FILE = getArg('--file');
const IMPORT_LIMIT = parseInt(getArg('--limit') || '500', 10);
const CLEAR_FIRST = hasFlag('--clear');
const DRY_RUN = hasFlag('--dry-run');

if (!CSV_FILE) {
  console.error('❌  --file argument is required.');
  console.error('    Example: npx ts-node-dev src/scripts/import-flipkart.ts --file ./data/flipkart_com-ecommerce_sample.csv');
  process.exit(1);
}

// ──────────────────────────────────────────────────────────────────────────────
// Category mapping: Flipkart category tree → BadaVyapar slug
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Flipkart uses a hierarchical category string like:
 *   "Clothing >> Women's Clothing >> Tops, Tees & Shirts"
 * We extract the first meaningful segment and map to our category slugs.
 */
const CATEGORY_MAP: Record<string, string> = {
  // Men
  "men's clothing":        'men-tshirts',
  "men's shirts":          'men-shirts',
  "men's t-shirts":        'men-tshirts',
  "men's jeans":           'men-jeans',
  "men's trousers":        'men-bottomwear',
  "men's footwear":        'men-footwear',
  "men's sports":          'men-sportswear',
  'men':                   'men-tshirts',

  // Women
  "women's clothing":      'women-dresses',
  "women's tops":          'women-tops',
  "women's dresses":       'women-dresses',
  "women's sarees":        'women-ethnic',
  "women's kurtis":        'women-ethnic',
  "women's footwear":      'women-footwear',
  "women's handbags":      'women-handbags',
  "women's accessories":   'women-accessories',
  'women':                 'women-dresses',

  // Kids
  "boys' clothing":        'kids-boys',
  "girls' clothing":       'kids-girls',
  "kids' footwear":        'kids-footwear',
  'kids':                  'kids-boys',

  // Electronics
  'mobiles':               'mobiles-accessories',
  'cameras':               'electronics',
  'computers':             'electronics',
  'electronics':           'electronics',
  'laptops':               'electronics',
  'tablets':               'electronics',

  // Home & Living
  'home décor':            'home-decor',
  'home & kitchen':        'home-kitchen',
  'furniture':             'home-decor',
  'bedding':               'home-kitchen',

  // Beauty
  'beauty':                'beauty-skincare',
  "women's beauty":        'beauty-skincare',
  'health & beauty':       'beauty-skincare',
  'fragrances':            'beauty-fragrances',

  // Sports
  'sports':                'sports-fitness',
  'fitness':               'sports-fitness',
  'outdoor':               'sports-fitness',

  // Books
  'books':                 'books-stationery',
  'stationery':            'books-stationery',

  // Default
  'default':               'men-tshirts',
};

/**
 * Returns our category slug from the Flipkart category_tree string.
 */
function mapCategory(categoryTree: string): string {
  if (!categoryTree) return CATEGORY_MAP['default'];
  const parts = categoryTree
    .replace(/[>>»]+/g, '|')
    .split('|')
    .map((s) => s.trim().toLowerCase().replace(/[^a-z0-9 ']/g, ''));

  for (const part of parts) {
    for (const [key, slug] of Object.entries(CATEGORY_MAP)) {
      if (part.includes(key)) return slug;
    }
  }
  return CATEGORY_MAP['default'];
}

// ──────────────────────────────────────────────────────────────────────────────
// Indian Fashion Brand Pool (injected when Flipkart brand is missing)
// ──────────────────────────────────────────────────────────────────────────────

const VENDOR_BRANDS = [
  'Roadster',
  'HRX by Hrithik Roshan',
  'H&M',
  'ONLY',
  'Puma',
  'Nike India',
  'Levi\'s',
  'Wrogn',
  'Mango',
  'Zara',
  'Forever 21',
  'Fabindia',
  'Biba',
  'W by Westside',
  'Aurelia',
  'Global Desi',
  'Sassafras',
  'Vero Moda',
  'AND',
  'Chemistry',
  'Libas',
  'Janasya',
  'Pistaa',
  'Clovia',
  'Zivame',
];

function pickBrand(title: string): string {
  // Try to extract brand from title (usually first 1–2 words)
  const firstWords = title.split(' ').slice(0, 2).join(' ');
  if (firstWords.length > 2 && !/^\d/.test(firstWords)) return firstWords;
  return VENDOR_BRANDS[Math.floor(Math.random() * VENDOR_BRANDS.length)];
}

// ──────────────────────────────────────────────────────────────────────────────
// Placeholder image fallback pools (by category)
// ──────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_IMAGES: Record<string, string[]> = {
  'men-tshirts': [
    'https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=400&h=533&fit=crop',
  ],
  'men-shirts': [
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1598032895397-b9472444bf93?w=400&h=533&fit=crop',
  ],
  'men-jeans': [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=400&h=533&fit=crop',
  ],
  'women-dresses': [
    'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=400&h=533&fit=crop',
  ],
  'women-tops': [
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=533&fit=crop',
  ],
  'women-ethnic': [
    'https://images.unsplash.com/photo-1610189020343-e3e67640e00e?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1571646034647-52e6ea84b28c?w=400&h=533&fit=crop',
  ],
  'beauty-skincare': [
    'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=533&fit=crop',
  ],
  'electronics': [
    'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400&h=533&fit=crop',
  ],
  'default': [
    'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1467043237213-65f2da53396f?w=400&h=533&fit=crop',
    'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=533&fit=crop',
  ],
};

function getPlaceholderImage(categorySlug: string, seed: number): string {
  const pool = PLACEHOLDER_IMAGES[categorySlug] || PLACEHOLDER_IMAGES['default'];
  return pool[seed % pool.length];
}

// ──────────────────────────────────────────────────────────────────────────────
// Price helpers
// ──────────────────────────────────────────────────────────────────────────────

function parsePrice(raw: string | undefined): number {
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[^0-9.]/g, '');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.round(val * 100); // → paise
}

function parseRating(raw: string | undefined): number {
  if (!raw || raw.toLowerCase() === 'no rating' || raw.trim() === '') return 0;
  const val = parseFloat(raw);
  return isNaN(val) ? 0 : Math.min(5, Math.max(0, val));
}

// ──────────────────────────────────────────────────────────────────────────────
// Row interface (Flipkart CSV columns)
// ──────────────────────────────────────────────────────────────────────────────

interface FlipkartRow {
  uniq_id?: string;
  product_name?: string;
  description?: string;
  brand?: string;
  retail_price?: string;
  discounted_price?: string;
  product_category_tree?: string;
  image?: string;
  product_rating?: string;
  overall_rating?: string;
  pid?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Ensure our BadaVyapar categories exist
// ──────────────────────────────────────────────────────────────────────────────

const ALL_CATEGORIES = [
  // Men
  { name: 'Men T-Shirts',          slug: 'men-tshirts',          parent: 'men' },
  { name: 'Men Shirts',            slug: 'men-shirts',           parent: 'men' },
  { name: 'Men Jeans',             slug: 'men-jeans',            parent: 'men' },
  { name: 'Men Bottomwear',        slug: 'men-bottomwear',       parent: 'men' },
  { name: 'Men Footwear',          slug: 'men-footwear',         parent: 'men' },
  { name: 'Men Sportswear',        slug: 'men-sportswear',       parent: 'men' },
  // Women
  { name: 'Women Dresses',         slug: 'women-dresses',        parent: 'women' },
  { name: 'Women Tops',            slug: 'women-tops',           parent: 'women' },
  { name: 'Women Ethnic Wear',     slug: 'women-ethnic',         parent: 'women' },
  { name: 'Women Footwear',        slug: 'women-footwear',       parent: 'women' },
  { name: 'Women Handbags',        slug: 'women-handbags',       parent: 'women' },
  { name: 'Women Accessories',     slug: 'women-accessories',    parent: 'women' },
  // Kids
  { name: "Kids Boys' Wear",       slug: 'kids-boys',            parent: 'kids' },
  { name: "Kids Girls' Wear",      slug: 'kids-girls',           parent: 'kids' },
  { name: "Kids Footwear",         slug: 'kids-footwear',        parent: 'kids' },
  // Electronics & Tech
  { name: 'Mobiles & Accessories', slug: 'mobiles-accessories',  parent: 'electronics-tech' },
  { name: 'Electronics',           slug: 'electronics',          parent: 'electronics-tech' },
  // Home & Living
  { name: 'Home Decor',            slug: 'home-decor',           parent: 'home-living' },
  { name: 'Home & Kitchen',        slug: 'home-kitchen',         parent: 'home-living' },
  // Beauty
  { name: 'Skincare',              slug: 'beauty-skincare',      parent: 'beauty' },
  { name: 'Fragrances',            slug: 'beauty-fragrances',    parent: 'beauty' },
  // Sports
  { name: 'Sports & Fitness',      slug: 'sports-fitness',       parent: 'sports' },
  // Books
  { name: 'Books & Stationery',    slug: 'books-stationery',     parent: 'books' },
];

const PARENT_CATEGORIES = [
  { name: 'Men',              slug: 'men' },
  { name: 'Women',            slug: 'women' },
  { name: 'Kids',             slug: 'kids' },
  { name: 'Electronics',      slug: 'electronics-tech' },
  { name: 'Home & Living',    slug: 'home-living' },
  { name: 'Beauty',           slug: 'beauty' },
  { name: 'Sports',           slug: 'sports' },
  { name: 'Books',            slug: 'books' },
];

async function ensureCategories(): Promise<Map<string, mongoose.Types.ObjectId>> {
  const categoryIdMap = new Map<string, mongoose.Types.ObjectId>();

  // Upsert parent categories
  for (const pc of PARENT_CATEGORIES) {
    const doc = await Category.findOneAndUpdate(
      { slug: pc.slug },
      { $setOnInsert: { name: pc.name, slug: pc.slug, isActive: true, parentId: null } },
      { upsert: true, new: true }
    );
    categoryIdMap.set(pc.slug, doc._id as mongoose.Types.ObjectId);
  }

  // Upsert child categories
  for (const c of ALL_CATEGORIES) {
    const parentId = categoryIdMap.get(c.parent) || null;
    const doc = await Category.findOneAndUpdate(
      { slug: c.slug },
      { $setOnInsert: { name: c.name, slug: c.slug, isActive: true, parentId } },
      { upsert: true, new: true }
    );
    categoryIdMap.set(c.slug, doc._id as mongoose.Types.ObjectId);
  }

  console.log(`📂  Ensured ${categoryIdMap.size} categories in DB.`);
  return categoryIdMap;
}

// ──────────────────────────────────────────────────────────────────────────────
// Ensure demo vendor accounts exist
// ──────────────────────────────────────────────────────────────────────────────

async function ensureVendors(): Promise<mongoose.Types.ObjectId[]> {
  const existing = await VendorProfile.find({
    approvalStatus: ApprovalStatus.APPROVED,
  })
    .select('_id')
    .lean();

  if (existing.length > 0) {
    console.log(`🏪  Found ${existing.length} approved vendors — assigning products to them.`);
    return existing.map((v) => v._id as mongoose.Types.ObjectId);
  }

  console.warn('⚠️   No approved vendors found in DB.');
  console.warn('    Run `npm run seed` first to create demo vendors, then re-run this script.');
  process.exit(1);
}

// ──────────────────────────────────────────────────────────────────────────────
// Main import
// ──────────────────────────────────────────────────────────────────────────────

async function importFlipkart(): Promise<void> {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   BadaVyapar — Flipkart Dataset Importer                    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`📄  Source file : ${CSV_FILE}`);
  console.log(`🔢  Import limit: ${IMPORT_LIMIT}`);
  console.log(`🗑️   Clear first : ${CLEAR_FIRST}`);
  console.log(`👁️   Dry run     : ${DRY_RUN}`);
  console.log('');

  // Resolve file path
  const csvPath = path.resolve(CSV_FILE!);
  if (!fs.existsSync(csvPath)) {
    console.error(`❌  File not found: ${csvPath}`);
    process.exit(1);
  }

  if (!DRY_RUN) {
    await connectDB();
  }

  // Optional: wipe products
  if (CLEAR_FIRST && !DRY_RUN) {
    await Product.deleteMany({});
    console.log('🧹  Cleared all existing products.');
  }

  // Ensure categories and vendors
  let categoryIdMap: Map<string, mongoose.Types.ObjectId> = new Map();
  let vendorIds: mongoose.Types.ObjectId[] = [];

  if (!DRY_RUN) {
    categoryIdMap = await ensureCategories();
    vendorIds = await ensureVendors();
  }

  // ── Parse CSV ──────────────────────────────────────────────────────────────
  console.log('⏳  Parsing CSV...');

  const records: FlipkartRow[] = await new Promise((resolve, reject) => {
    const rows: FlipkartRow[] = [];
    fs.createReadStream(csvPath)
      .pipe(
        parse({
          columns: true,         // first row is headers
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
          cast: false,
        })
      )
      .on('data', (row: FlipkartRow) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });

  console.log(`✅  Parsed ${records.length.toLocaleString()} rows from CSV.`);

  // ── Filter & map rows ──────────────────────────────────────────────────────
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  const slugsSeen = new Set<string>();

  const batch: Array<{
    vendorId: mongoose.Types.ObjectId;
    categoryId: mongoose.Types.ObjectId;
    title: string;
    slug: string;
    description: string;
    pricePaise: number;
    compareAtPricePaise?: number;
    stock: number;
    images: { key: string; url: string; order: number }[];
    status: ProductStatus;
    ratingSummary: { average: number; count: number };
    tags: string[];
  }> = [];

  for (const row of records) {
    if (imported >= IMPORT_LIMIT) break;

    const title = (row.product_name || '').trim();
    if (!title || title.length < 5) {
      skipped++;
      continue;
    }

    // Price
    const pricePaise = parsePrice(row.discounted_price);
    const mrpPaise = parsePrice(row.retail_price);
    if (pricePaise <= 0) {
      skipped++;
      continue;
    }

    // Build slug
    const baseSlug = slugify(title.slice(0, 80), { lower: true, strict: true });
    const uniqueSuffix = (Date.now() + imported).toString(36);
    const slug = `${baseSlug}-${uniqueSuffix}`;

    if (slugsSeen.has(slug)) {
      skipped++;
      continue;
    }
    slugsSeen.add(slug);

    // Category
    const catSlug = mapCategory(row.product_category_tree || '');
    const categoryId = categoryIdMap.get(catSlug) || categoryIdMap.get('men-tshirts')!;

    // Vendor (round-robin)
    const vendorId = vendorIds[imported % vendorIds.length];

    // Description — use Flipkart's or generate a sensible fallback
    const rawDesc = (row.description || '').replace(/\|/g, ' ').trim();
    const description =
      rawDesc.length > 20
        ? rawDesc.slice(0, 1000)
        : `${title} — quality product available on BadaVyapar Marketplace. Genuine product with manufacturer warranty.`;

    // Image
    let imageUrl = (row.image || '').trim();
    // Flipkart images are comma-separated sometimes
    if (imageUrl.includes(',')) imageUrl = imageUrl.split(',')[0].trim();
    // Strip surrounding brackets/quotes
    imageUrl = imageUrl.replace(/^["'\[]+|["'\]]+$/g, '').trim();
    // Fallback to Unsplash placeholder if URL looks invalid
    if (!imageUrl.startsWith('http')) {
      imageUrl = getPlaceholderImage(catSlug, imported);
    }

    // Rating
    const ratingRaw = row.product_rating || row.overall_rating || '';
    const ratingAvg = parseRating(ratingRaw);

    // Tags from brand + category
    const brand = (row.brand || pickBrand(title)).trim();
    const tags = [brand.toLowerCase(), catSlug.split('-')[0], catSlug.split('-')[1] || ''].filter(Boolean);

    // Stock — randomised realistic range
    const stock = 10 + Math.floor(Math.random() * 490); // 10–500

    const productDoc = {
      vendorId,
      categoryId,
      title,
      slug,
      description,
      pricePaise,
      compareAtPricePaise: mrpPaise > pricePaise ? mrpPaise : undefined,
      stock,
      images: [{ key: `import-${slug}`, url: imageUrl, order: 0 }],
      status: ProductStatus.ACTIVE,
      ratingSummary: {
        average: ratingAvg,
        count: ratingAvg > 0 ? 10 + Math.floor(Math.random() * 2000) : 0,
      },
      tags,
    };

    if (DRY_RUN) {
      if (imported < 5) {
        console.log(`  [Preview ${imported + 1}]`);
        console.log(`    Title  : ${productDoc.title}`);
        console.log(`    Price  : ₹${(productDoc.pricePaise / 100).toFixed(2)}`);
        console.log(`    MRP    : ₹${((productDoc.compareAtPricePaise || 0) / 100).toFixed(2)}`);
        console.log(`    Cat    : ${catSlug}`);
        console.log(`    Image  : ${imageUrl.slice(0, 60)}...`);
        console.log(`    Rating : ${productDoc.ratingSummary.average}`);
        console.log('');
      }
      imported++;
      continue;
    }

    batch.push(productDoc);
    imported++;

    // Insert in batches of 50
    if (batch.length >= 50) {
      try {
        await Product.insertMany(batch, { ordered: false });
        process.stdout.write(`\r  💾  Saved ${imported} / ${IMPORT_LIMIT} products...`);
      } catch (err: any) {
        // Some may fail on duplicate slugs — that's OK
        errors += err?.writeErrors?.length || 1;
      }
      batch.length = 0;
    }
  }

  // Insert remaining batch
  if (batch.length > 0 && !DRY_RUN) {
    try {
      await Product.insertMany(batch, { ordered: false });
    } catch (err: any) {
      errors += err?.writeErrors?.length || 1;
    }
  }

  console.log('');
  console.log('');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`  ✅  Import complete!`);
  console.log(`  📦  Products saved   : ${imported - errors}`);
  console.log(`  ⏭️   Skipped (invalid): ${skipped}`);
  console.log(`  ⚠️   Errors (dupes)  : ${errors}`);
  if (DRY_RUN) {
    console.log(`  👁️   DRY RUN — nothing was written to the database.`);
  }
  console.log('══════════════════════════════════════════════════════════════');
  console.log('');

  if (!DRY_RUN) {
    console.log('💡  Run `npm run reindex` to sync Elasticsearch search index.');
    console.log('');
    await mongoose.disconnect();
  }
}

importFlipkart().catch((err) => {
  console.error('❌  Import failed:', err.message);
  process.exit(1);
});

