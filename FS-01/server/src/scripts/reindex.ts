import mongoose from 'mongoose';
import connectDB from '../config/db';
import { getESClient } from '../config/elasticsearch';
import Product from '../models/Product';
import { PRODUCTS_INDEX, initProductIndex, indexProduct } from '../services/search.service';
import { ProductStatus } from '../types';

const runReindex = async () => {
  console.log('--- [Elasticsearch Reindex Job Started] ---');

  try {

    await connectDB();

    const es = getESClient();
    try {
      const ping = await es.ping();
      console.log('[Elasticsearch] Ping response:', ping);
    } catch (err: any) {
      console.error('[Elasticsearch] Could not ping Elasticsearch cluster. Is it running? Error:', err.message);
      process.exit(1);
    }

    const exists = await es.indices.exists({ index: PRODUCTS_INDEX });
    if (exists) {
      console.log(`[Elasticsearch] Deleting existing index "${PRODUCTS_INDEX}"...`);
      await es.indices.delete({ index: PRODUCTS_INDEX });
    }

    console.log(`[Elasticsearch] Creating fresh index "${PRODUCTS_INDEX}"...`);
    await initProductIndex();

    const activeProducts = await Product.find({ status: ProductStatus.ACTIVE });
    console.log(`[MongoDB] Found ${activeProducts.length} ACTIVE products to index.`);

    let indexedCount = 0;
    for (const prod of activeProducts) {
      await indexProduct(prod);
      indexedCount++;
      if (indexedCount % 50 === 0) {
        console.log(`[Elasticsearch] Indexed ${indexedCount}/${activeProducts.length} items...`);
      }
    }

    console.log(`--- [Reindex Complete: ${indexedCount} products indexed into "${PRODUCTS_INDEX}"] ---`);
  } catch (error: any) {
    console.error('[Reindex] Fatal error during reindexing:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runReindex();
