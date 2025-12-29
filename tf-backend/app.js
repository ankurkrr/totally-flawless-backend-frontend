/**
 * @fileoverview Main Express Application Entry Point
 * @description Configures Express app, middleware, routes, and error handling
 * @author Backend Team
 * @version 1.0.0
 */

// Load environment variables FIRST, before any other imports
const path = require('path');
const dotenv = require('dotenv');

// Try multiple .env file locations
const envPath = path.resolve(__dirname, '.env');
const envLocalPath = path.resolve(__dirname, '.env.local');

// Load .env.local first (if exists), then .env
const envResult = dotenv.config({ path: envLocalPath });
if (envResult.error) {
    // If .env.local doesn't exist, try .env
    const envResult2 = dotenv.config({ path: envPath });
    if (envResult2.error) {
        console.warn('⚠️  Warning: .env file not found. Using system environment variables.');
    } else {
        console.log('✅ Loaded .env file from:', envPath);
    }
} else {
    console.log('✅ Loaded .env.local file from:', envLocalPath);
}

// Initialize logger FIRST (before other imports that might use it)
const logger = require('./utils/logger');

// Validate environment variables on startup
const { validateEnv } = require('./utils/envValidator');
try {
    // In production, strict validation. In development, warn only.
    const isProduction = process.env.NODE_ENV === 'production';
    validateEnv(isProduction);
} catch (error) {
    logger.error('Environment validation failed:', error.message);
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
}

const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const cors = require('cors');
const compression = require('compression');
const bodyParser = require('body-parser');
const createError = require('http-errors');

// Initialize cron jobs
require('./cron/cron');

// ============================================================================
// MIDDLEWARE IMPORTS
// ============================================================================
const activityLogger = require('./services/admin/activityLogger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter, uploadLimiter, paymentLimiter } = require('./middleware/rateLimiter');

// ============================================================================
// SERVICE IMPORTS
// ============================================================================
const stripe = require('./services/stripe');
const { ConfirmBooking } = require('./services/createBookingsService');

// ============================================================================
// ROUTE IMPORTS
// ============================================================================
const apiRouter = require('./routes/index');
const adminRouter = require('./routes/admin/index');
const legacyRouter = require('./routes/legacyRoutes');

// ============================================================================
// EXPRESS APP INITIALIZATION
// ============================================================================
const app = express();

// ============================================================================
// CONFIGURATION
// ============================================================================
// Webhook secret will be loaded dynamically from KeyProvider
// Fallback to env var for backward compatibility during migration
const KeyProvider = require('./utils/keyProvider');

// View engine setup (legacy - for error pages)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// ============================================================================
// GLOBAL MIDDLEWARE
// ============================================================================

// Request logging (morgan for HTTP requests)
app.use(morgan('combined', {
    stream: {
        write: (message) => logger.http(message.trim())
    }
}));

// CORS configuration
app.use(cors());

// Compression middleware (gzip responses)
app.use(compression());

// Request size limits (protect against large payload attacks)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Stripe webhook requires raw body for signature verification
// MUST be after compression but before other body parsing
app.use('/webhook', express.raw({ type: 'application/json', limit: '10mb' }));

// Cookie parser
app.use(cookieParser());

// Static file serving
app.use(express.static(path.join(__dirname, 'public')));

// Activity logger (logs all requests for audit trail)
app.use(activityLogger);

// ============================================================================
// ROUTE MOUNTING
// ============================================================================

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Main API routes (v1)
app.use('/api', apiRouter);

// Admin API routes (with rate limiting)
app.use('/admin', apiLimiter, adminRouter);

// Legacy routes (backward compatibility)
app.use('/', legacyRouter);

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================
/**
 * @route   GET /
 * @desc    Health check endpoint
 * @access  Public
 * @returns {Object} API status
 */
app.get('/', (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'Backend API is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: require('./package.json').version
    });
});

/**
 * @route   GET /health
 * @desc    Detailed health check endpoint
 * @access  Public
 * @returns {Object} Detailed API health status
 */
app.get('/health', async (req, res) => {
    const healthCheck = {
        status: 'success',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: require('./package.json').version,
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB',
        },
    };

    // Check database connection
    try {
        const conn = require('./connection/database');
        await conn.promise().query('SELECT 1');
        healthCheck.database = { status: 'connected' };
    } catch (error) {
        healthCheck.database = { status: 'disconnected', error: error.message };
        healthCheck.status = 'degraded';
    }

    const statusCode = healthCheck.status === 'success' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
});

// ============================================================================
// STRIPE WEBHOOK HANDLER
// ============================================================================
/**
 * @route   POST /webhook
 * @desc    Stripe webhook endpoint for payment events
 * @access  Public (verified via Stripe signature)
 * @param   {Object} request.body - Raw webhook event data
 * @param   {string} request.headers['stripe-signature'] - Stripe signature
 * @returns {Object} Webhook acknowledgment
 */
app.post('/webhook', async (request, response) => {
    try {
        const sig = request.headers['stripe-signature'];

        if (!sig) {
            logger.warn('Stripe webhook: Missing signature header');
            return response.status(400).send('Missing stripe-signature header');
        }

        // Get all active webhook secrets (Stripe supports multiple)
        let webhookSecrets;
        try {
            webhookSecrets = await KeyProvider.getAllStripeWebhookSecrets();
        } catch (error) {
            // Fallback to environment variable during migration
            const fallbackSecret = process.env.STRIPE_WEBHOOK_SECRET;
            if (!fallbackSecret) {
                logger.error('STRIPE_WEBHOOK_SECRET is not configured');
                return response.status(500).send('Webhook secret not configured');
            }
            webhookSecrets = [fallbackSecret];
        }

        if (!webhookSecrets || webhookSecrets.length === 0) {
            logger.error('No Stripe webhook secrets found');
            return response.status(500).send('Webhook secret not configured');
        }

        let event;
        let verificationError = null;

        // Try to verify webhook signature with each active secret
        // Stripe allows multiple webhook secrets to be active simultaneously
        for (const endpointSecret of webhookSecrets) {
            try {
                // request.body is the raw body buffer when using express.raw()
                event = await stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
                verificationError = null;
                break; // Successfully verified
            } catch (err) {
                verificationError = err;
                continue; // Try next secret
            }
        }

        if (verificationError || !event) {
            logger.error('Webhook signature verification failed with all secrets:', verificationError?.message);
            return response.status(400).send(`Webhook Error: ${verificationError?.message || 'Signature verification failed'}`);
        }

        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntentSucceeded = event.data.object;
                logger.info('Payment succeeded:', { paymentIntentId: paymentIntentSucceeded.id });

                // Check if metadata exists and has transaction info
                if (paymentIntentSucceeded.metadata && paymentIntentSucceeded.metadata.transaction) {
                    try {
                        await ConfirmBooking(paymentIntentSucceeded.metadata);
                        logger.info('Booking confirmed via webhook');
                    } catch (bookingError) {
                        logger.error('Error confirming booking from webhook:', bookingError);
                        // Don't return error to Stripe - we'll retry manually if needed
                    }
                }
                break;

            case 'payment_intent.payment_failed':
                const paymentIntentFail = event.data.object;
                logger.warn('Payment failed:', {
                    paymentIntentId: paymentIntentFail.id,
                    error: paymentIntentFail.last_payment_error?.message
                });

                // TODO: Implement failed payment handling
                // if (paymentIntentFail.metadata && paymentIntentFail.metadata.transaction) {
                //   await transactionsService.markFailed(
                //     paymentIntentFail.metadata.transaction,
                //     paymentIntentFail.last_payment_error?.message
                //   );
                // }
                break;

            default:
                logger.debug(`Unhandled webhook event type: ${event.type}`);
                break;
        }

        // Always return 200 to acknowledge receipt
        response.json({ received: true });
    } catch (err) {
        logger.error('Webhook error:', err);
        response.status(500).json({ error: 'Webhook processing failed' });
    }
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================

// 404 Not Found Handler (must be before error handler)
app.use(notFoundHandler);

// Global Error Handler (must be last)
app.use(errorHandler);

// ============================================================================
// EXPORT
// ============================================================================
module.exports = app;
