import { Client } from '@elastic/elasticsearch';
import env from './env';

let esClient: Client | null = null;

const connectElasticsearch = (): Client => {
  if (esClient) return esClient;

  esClient = new Client({
    node: env.ELASTICSEARCH_URL,
    maxRetries: 1,
    requestTimeout: 2000, // Fast 2s timeout for graceful fallback
  });

  return esClient;
};

export const getESClient = (): Client => {
  if (!esClient) return connectElasticsearch();
  return esClient;
};

export default connectElasticsearch;
