import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config';
import { errorHandler } from './middleware';
import healthRouter from './routes/health.routes';
import authRouter from './routes/auth.routes';
import userRouter from './routes/user.routes';
import vendorRouter from './routes/vendor.routes';
import adminRouter from './routes/admin.routes';
import catalogRouter from './routes/catalog.routes';
import uploadRouter from './routes/upload.routes';
import cartRouter from './routes/cart.routes';
import checkoutRouter from './routes/checkout.routes';
import orderRouter from './routes/order.routes';
import paymentRouter from './routes/payment.routes';
import webhookRouter from './routes/webhook.routes';

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(cookieParser());

// Raw body for webhook signature verification
app.use('/api/v1/webhooks', express.raw({ type: 'application/json' }));

// JSON body for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/vendor', vendorRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1', catalogRouter); // covers /api/v1/products and /api/v1/categories
app.use('/api/v1/uploads', uploadRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/checkout', checkoutRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/payments', paymentRouter);
app.use('/api/v1/webhooks', webhookRouter);

// Error handler (must be last)
app.use(errorHandler);

export default app;
