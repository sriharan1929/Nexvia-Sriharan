import { describe, it, expect } from 'vitest';
import { buildElasticQuery } from '../services/search.service';
import { ProductStatus } from '../types';

describe('Elasticsearch Query DSL Builder', () => {
  it('should build multi_match query with boosting on title and tags', () => {
    const query = buildElasticQuery({
      q: 'wireless gaming mouse',
    });

    expect(query.query.bool.must).toHaveLength(1);
    const multiMatch = query.query.bool.must[0].multi_match;
    expect(multiMatch).toBeDefined();
    expect(multiMatch.query).toBe('wireless gaming mouse');
    expect(multiMatch.fields).toContain('title^3');
    expect(multiMatch.fields).toContain('tags^2');
    expect(multiMatch.fields).toContain('description');
    expect(multiMatch.fuzziness).toBe('AUTO');

    const statusFilter = query.query.bool.filter.find(
      (f: any) => f.term && f.term.status === ProductStatus.ACTIVE
    );
    expect(statusFilter).toBeDefined();
  });

  it('should match_all when no text query is provided', () => {
    const query = buildElasticQuery({});
    expect(query.query.bool.must[0]).toEqual({ match_all: {} });
  });

  it('should add category term filters to boolean filter clause', () => {
    const query = buildElasticQuery({
      category: 'electronics',
    });

    const categoryFilter = query.query.bool.filter.find((f: any) => f.bool?.should);
    expect(categoryFilter).toBeDefined();
    expect(categoryFilter.bool.should).toEqual([
      { term: { categoryId: 'electronics' } },
      { term: { categoryName: 'electronics' } },
    ]);
  });

  it('should add integer paise price range filters', () => {
    const query = buildElasticQuery({
      minPrice: 50000,
      maxPrice: 300000,
    });

    const priceFilter = query.query.bool.filter.find((f: any) => f.range?.pricePaise);
    expect(priceFilter).toBeDefined();
    expect(priceFilter.range.pricePaise.gte).toBe(50000);
    expect(priceFilter.range.pricePaise.lte).toBe(300000);
  });

  it('should configure correct sort criteria', () => {
    const ascQuery = buildElasticQuery({ sort: 'price_asc' });
    expect(ascQuery.sort[0]).toEqual({ pricePaise: { order: 'asc' } });

    const descQuery = buildElasticQuery({ sort: 'price_desc' });
    expect(descQuery.sort[0]).toEqual({ pricePaise: { order: 'desc' } });

    const ratingQuery = buildElasticQuery({ sort: 'rating' });
    expect(ratingQuery.sort[0]).toEqual({ ratingAvg: { order: 'desc' } });
  });

  it('should compute exact pagination offsets for from and size', () => {
    const page3Query = buildElasticQuery({
      page: 3,
      limit: 15,
    });

    expect(page3Query.from).toBe(30);
    expect(page3Query.size).toBe(15);
  });
});
