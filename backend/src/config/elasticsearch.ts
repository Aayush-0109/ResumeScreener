import { Client } from '@elastic/elasticsearch';
const ES_URL = process.env.ES_URL || 'http://localhost:9200';
export const es = new Client({ node: ES_URL });