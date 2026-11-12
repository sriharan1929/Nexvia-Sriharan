import { Client } from '@elastic/elasticsearch';
import env from './env';

let esClient: Client | null = null;

const connectElasticsearch = (): Client => {
  if (esClient) return esClient;

  esClient = new Client({
    node: env.ELASTICSEARCH_URL,
  });

  console.log('[Elasticsearch] Client initialized');
  return esClient;
};

export const getESClient = (): Client => {
  if (!esClient) return connectElasticsearch();
  return esClient;
};

export default connectElasticsearch;
