const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { csrfMiddleware, setCsrfToken } = require('./middlewares/csrf');
const hpp = require('hpp');
const { sanitizeMiddleware } = require('./utils/sanitizer');
const { globalLimiter } = require('./middlewares/rateLimiter');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const correlationIdMiddleware = require('./middlewares/correlationId');

// Initialization for Sentry monitoring stub (Integration Phase)
if (process.env.SENTRY_DSN) {
    try {
        require('@sentry/node').init({ dsn: process.env.SENTRY_DSN, tracesSampleRate: 1.0 });
        console.log("🛠️  Sentry APM dynamically connected.");
    } catch(e) {
        console.warn("⚠️  Sentry DSN provided but package not installed locally: skipping tracing.");
    }
}

const app = express();

// Correlation ID for observability
app.use(correlationIdMiddleware);

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
        if (req.header('x-forwarded-proto') !== 'https') {
            res.redirect(`https://${req.header('host')}${req.url}`);
        } else {
            next();
        }
    });
}

// Telemetry bounds
const performanceLogger = require('./utils/performanceLogger');
app.use(performanceLogger);

// Global rate limiting
app.use('/api', globalLimiter);

// Security headers with HSTS
app.use(helmet({
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// CORS – allow Vite dev server and production origins
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against XSS (Deep Recursive)
app.use(sanitizeMiddleware);

// Prevent HTTP Parameter Pollution
app.use(hpp());

app.use(cookieParser(process.env.COOKIE_SECRET || 'fallback-secret'));

// HTTP request logger — BEFORE CSRF so all requests are logged regardless of CSRF outcome
morgan.token('correlationId', function (req) { return req.correlationId; });
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan(':method :url :status :res[content-length] - :response-time ms [CID: :correlationId]', {
        stream: { write: message => require('./utils/logger').info(message.trim()) }
    }));
}

// Custom CSRF Protection
app.use(setCsrfToken);
app.use(csrfMiddleware);

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check for load balancers
app.get('/health', async (req, res) => {
    const { pool } = require('./config/database');
    const redis = require('./config/redis');

    const health = {
        status: 'success',
        uptime: process.uptime(),
        timestamp: new Date(),
        checks: {
            database: 'unknown',
            redis: 'unknown'
        }
    };

    try {
        // DB Check
        await pool.query('SELECT 1');
        health.checks.database = 'connected';

        // Redis Check
        await redis.ping();
        health.checks.redis = 'connected';

        res.status(200).json(health);
    } catch (err) {
        health.status = 'error';
        health.message = err.message;
        if (health.checks.database === 'unknown') health.checks.database = 'failed';
        if (health.checks.redis === 'unknown') health.checks.redis = 'failed';
        
        res.status(503).json(health);
    }
});

app.get('/', (req, res) => {
    res.status(200).json({ status: 'success', message: 'SSDMS Backend API is running' });
});

// API Routes
const routes = require('./routes');
const queueManager = require('./routes/queueManager');

app.use('/api/v1/admin/queues', queueManager);
app.use('/api/v1', routes);

// 404 + Global error handler (must be last)
app.use(notFound);

// Sentry Error handling stub
if (process.env.SENTRY_DSN) {
    try {
        app.use(require('@sentry/node').Handlers.errorHandler());
    } catch(e) {
        // ignore sentry setup error if package not installed
    }
}

app.use(errorHandler);

module.exports = app;

