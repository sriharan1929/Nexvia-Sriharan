# server/data/

Place your downloaded Kaggle CSV datasets in this folder before running the import script.

## Expected files

| File | Dataset | Kaggle URL |
|---|---|---|
| `flipkart_com-ecommerce_sample.csv` | Flipkart Products (~20k) | https://www.kaggle.com/datasets/PromptCloudHQ/flipkart-products |
| `myntra_products.csv` | Myntra Fashion (~3k) | https://www.kaggle.com/datasets/djagatiya/myntra-fashion-product-dataset |

## How to download from Kaggle

### Option A — Browser download (easiest)
1. Go to the Kaggle URL above
2. Click **Download** (requires free Kaggle account)
3. Unzip and place the CSV here: `server/data/flipkart_com-ecommerce_sample.csv`

### Option B — Kaggle CLI
```bash
pip install kaggle
# Put your kaggle.json API token in ~/.kaggle/kaggle.json
kaggle datasets download -d PromptCloudHQ/flipkart-products -p server/data --unzip
```

## Running the import

```bash
# 1. Make sure you have seeded the base data first (creates vendors)
npm run seed

# 2. Preview 5 rows without writing to DB
npx ts-node-dev src/scripts/import-flipkart.ts --file ./data/flipkart_com-ecommerce_sample.csv --dry-run

# 3. Import 500 products
npx ts-node-dev src/scripts/import-flipkart.ts --file ./data/flipkart_com-ecommerce_sample.csv --limit 500

# 4. Import ALL products (20,000+) — takes ~2 minutes
npx ts-node-dev src/scripts/import-flipkart.ts --file ./data/flipkart_com-ecommerce_sample.csv --limit 99999

# 5. Wipe existing products and reimport cleanly
npx ts-node-dev src/scripts/import-flipkart.ts --file ./data/flipkart_com-ecommerce_sample.csv --clear --limit 500

# 6. Sync Elasticsearch search index after import
npm run reindex
```

## Notes
- This folder is git-ignored — CSV files are not committed.
- Products are assigned round-robin to your approved vendors.
- Images fall back to Unsplash placeholders if Flipkart CDN URLs are unreachable.
