import app from './app';
import { env, connectDB } from './config';

const start = async (): Promise<void> => {
  // Connect to MongoDB
  await connectDB();

  // Start server
  app.listen(env.PORT, () => {
    console.log(`[Server] Running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    console.log(`[Server] Health: http://localhost:${env.PORT}/api/v1/health`);
  });
};

start().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
