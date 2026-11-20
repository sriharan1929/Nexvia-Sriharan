import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),

  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/marketzone',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',

  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',

  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || 'marketzone-uploads',

  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_marketzone',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'dev-razorpay-key-secret-12345',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'dev-razorpay-webhook-secret-12345',

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',

  DEFAULT_COMMISSION_RATE: parseFloat(process.env.DEFAULT_COMMISSION_RATE || '0.10'),
};

export default env;
