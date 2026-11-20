import { getESClient } from '../config/elasticsearch';
import Product, { IProduct } from '../models/Product';
import VendorProfile from '../models/VendorProfile';
import Category from '../models/Category';
import { ProductStatus } from '../types';

export const PRODUCTS_INDEX = 'products';

export interface SearchOptions {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface SearchResultItem {
  _id: string;
  title: string;
  slug: string;
  description: string;
  pricePaise: number;
  compareAtPricePaise?: number;
  stock: number;
  images: { key: string; url: string; order: number }[];
  status: string;
  ratingSummary: { average: number; count: number };
  tags: string[];
  vendor?: { _id: string; storeName: string; slug: string; logo?: string };
  category?: { _id: string; name: string; slug: string };
  createdAt: string | Date;
}

export interface SearchResponse {
  data: SearchResultItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  source: 'elasticsearch' | 'mongodb_fallback';
}

export const initProductIndex = async (): Promise<boolean> => {
  try {
    const es = getESClient();
    const indexExists = await es.indices.exists({ index: PRODUCTS_INDEX });

    if (!indexExists) {
      await es.indices.create({
        index: PRODUCTS_INDEX,
        settings: {
          analysis: {
            analyzer: {
              product_analyzer: {
                type: 'standard',
                stopwords: '_english_',
              },
            },
          },
        },
        mappings: {
          properties: {
            title: {
              type: 'text',
              analyzer: 'product_analyzer',
              fields: {
                keyword: { type: 'keyword' },
              },
            },
            description: { type: 'text', analyzer: 'product_analyzer' },
            categoryId: { type: 'keyword' },
            categoryName: { type: 'keyword' },
            vendorId: { type: 'keyword' },
            vendorName: { type: 'keyword' },
            pricePaise: { type: 'integer' },
            stock: { type: 'integer' },
            status: { type: 'keyword' },
            ratingAvg: { type: 'float' },
            ratingCount: { type: 'integer' },
            tags: { type: 'keyword' },
            images: { type: 'object', enabled: false },
            slug: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      });
      console.log(`[Elasticsearch] Index "${PRODUCTS_INDEX}" created with mappings.`);
    }
    return true;
  } catch (error: any) {
    console.warn('[Elasticsearch] Could not initialize index (ES likely offline):', error.message);
    return false;
  }
};

export const buildElasticQuery = (options: SearchOptions) => {
  const { q, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = options;
  const from = (page - 1) * limit;

  const must: any[] = [];
  const filter: any[] = [{ term: { status: ProductStatus.ACTIVE } }];

  if (q && q.trim()) {
    must.push({
      multi_match: {
        query: q.trim(),
        fields: ['title^3', 'tags^2', 'description'],
        fuzziness: 'AUTO',
        operator: 'or',
      },
    });
  } else {
    must.push({ match_all: {} });
  }

  if (category) {
    filter.push({
      bool: {
        should: [
          { term: { categoryId: category } },
          { term: { categoryName: category } },
        ],
      },
    });
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    const priceRange: Record<string, any> = {};
    if (minPrice !== undefined) priceRange.gte = minPrice;
    if (maxPrice !== undefined) priceRange.lte = maxPrice;
    filter.push({ range: { pricePaise: priceRange } });
  }

  const sortArray: any[] = [];
  if (sort === 'price_asc') {
    sortArray.push({ pricePaise: { order: 'asc' } });
  } else if (sort === 'price_desc') {
    sortArray.push({ pricePaise: { order: 'desc' } });
  } else if (sort === 'rating') {
    sortArray.push({ ratingAvg: { order: 'desc' } });
    sortArray.push({ createdAt: { order: 'desc' } });
  } else if (sort === 'newest') {
    sortArray.push({ createdAt: { order: 'desc' } });
  } else {

    if (q && q.trim()) {
      sortArray.push({ _score: { order: 'desc' } });
    }
    sortArray.push({ createdAt: { order: 'desc' } });
  }

  return {
    from,
    size: limit,
    query: {
      bool: {
        must,
        filter,
      },
    },
    sort: sortArray,
  };
};

export const indexProduct = async (product: IProduct): Promise<void> => {
  try {
    const es = getESClient();

    let vendorName = '';
    let categoryName = '';

    if (product.vendorId) {
      const vendor = await VendorProfile.findById(product.vendorId).select('storeName');
      if (vendor) vendorName = vendor.storeName;
    }

    if (product.categoryId) {
      const cat = await Category.findById(product.categoryId).select('name');
      if (cat) categoryName = cat.name;
    }

    const doc = {
      title: product.title,
      description: product.description,
      categoryId: product.categoryId?.toString(),
      categoryName,
      vendorId: product.vendorId?.toString(),
      vendorName,
      pricePaise: product.pricePaise,
      compareAtPricePaise: product.compareAtPricePaise,
      stock: product.stock,
      status: product.status,
      ratingAvg: product.ratingSummary?.average || 0,
      ratingCount: product.ratingSummary?.count || 0,
      tags: product.tags || [],
      images: product.images || [],
      slug: product.slug,
      createdAt: product.createdAt,
    };

    await es.index({
      index: PRODUCTS_INDEX,
      id: product._id.toString(),
      document: doc,
      refresh: 'wait_for',
    });
  } catch (error: any) {
    console.warn(`[Elasticsearch] Indexing failed for product ${product._id}:`, error.message);
  }
};

/**
 * Removes a product from Elasticsearch.
 */
export const deleteProductFromIndex = async (productId: string): Promise<void> => {
  try {
    const es = getESClient();
    await es.delete({
      index: PRODUCTS_INDEX,
      id: productId,
      refresh: 'wait_for',
    });
  } catch (error: any) {
    if (error.statusCode !== 404) {
      console.warn(`[Elasticsearch] Deletion failed for product ${productId}:`, error.message);
    }
  }
};

/**
 * Executes full-text search with automatic MongoDB fallback.
 */
export const searchProducts = async (options: SearchOptions): Promise<SearchResponse> => {
  const page = options.page || 1;
  const limit = options.limit || 12;

  try {
    const es = getESClient();
    const esQuery = buildElasticQuery(options);

    const result = await es.search({
      index: PRODUCTS_INDEX,
      ...esQuery,
    });

    const hits = result.hits.hits || [];
    const totalHits =
      typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total?.value || 0;

    const data: SearchResultItem[] = hits.map((hit: any) => {
      const source = hit._source;
      return {
        _id: hit._id,
        title: source.title,
        slug: source.slug,
        description: source.description,
        pricePaise: source.pricePaise,
        compareAtPricePaise: source.compareAtPricePaise,
        stock: source.stock,
        images: source.images || [],
        status: source.status,
        ratingSummary: {
          average: source.ratingAvg || 0,
          count: source.ratingCount || 0,
        },
        tags: source.tags || [],
        vendor: source.vendorId
          ? {
              _id: source.vendorId,
              storeName: source.vendorName || 'Verified Merchant',
              slug: source.vendorName ? source.vendorName.toLowerCase().replace(/\s+/g, '-') : '',
            }
          : undefined,
        category: source.categoryId
          ? {
              _id: source.categoryId,
              name: source.categoryName || '',
              slug: source.categoryName ? source.categoryName.toLowerCase().replace(/\s+/g, '-') : '',
            }
          : undefined,
        createdAt: source.createdAt,
      };
    });

    return {
      data,
      pagination: {
        page,
        limit,
        total: totalHits,
        pages: Math.ceil(totalHits / limit) || 1,
      },
      source: 'elasticsearch',
    };
  } catch (error: any) {
    console.warn('[Elasticsearch] Search query failed, falling back to MongoDB:', error.message);
    return fallbackMongoSearch(options);
  }
};

/**
 * Resilient fallback: Queries MongoDB authoritative database directly when Elasticsearch is offline.
 */
export const fallbackMongoSearch = async (options: SearchOptions): Promise<SearchResponse> => {
  const { q, category, minPrice, maxPrice, sort, page = 1, limit = 12 } = options;
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {
    status: ProductStatus.ACTIVE,
  };

  if (category) {
    const cat = await Category.findOne({
      $or: [
        { _id: category.match(/^[0-9a-fA-F]{24}$/) ? category : null },
        { slug: category },
        { name: category },
      ],
    });
    if (cat) filter.categoryId = cat._id;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.pricePaise = {};
    if (minPrice !== undefined) filter.pricePaise.$gte = minPrice;
    if (maxPrice !== undefined) filter.pricePaise.$lte = maxPrice;
  }

  if (q && q.trim()) {
    const term = q.trim();
    filter.$or = [
      { title: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
      { tags: { $in: [new RegExp(term, 'i')] } },
    ];
  }

  let sortOptions: Record<string, any> = { createdAt: -1 };
  if (sort === 'price_asc') sortOptions = { pricePaise: 1 };
  else if (sort === 'price_desc') sortOptions = { pricePaise: -1 };
  else if (sort === 'rating') sortOptions = { 'ratingSummary.average': -1, createdAt: -1 };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('vendorId', 'storeName slug logo')
      .populate('categoryId', 'name slug')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const data: SearchResultItem[] = products.map((p: any) => ({
    _id: p._id.toString(),
    title: p.title,
    slug: p.slug,
    description: p.description,
    pricePaise: p.pricePaise,
    compareAtPricePaise: p.compareAtPricePaise,
    stock: p.stock,
    images: p.images || [],
    status: p.status,
    ratingSummary: p.ratingSummary || { average: 0, count: 0 },
    tags: p.tags || [],
    vendor: p.vendorId
      ? {
          _id: p.vendorId._id?.toString() || p.vendorId.toString(),
          storeName: p.vendorId.storeName || 'Verified Merchant',
          slug: p.vendorId.slug || '',
          logo: p.vendorId.logo,
        }
      : undefined,
    category: p.categoryId
      ? {
          _id: p.categoryId._id?.toString() || p.categoryId.toString(),
          name: p.categoryId.name || '',
          slug: p.categoryId.slug || '',
        }
      : undefined,
    createdAt: p.createdAt,
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
    source: 'mongodb_fallback',
  };
};
