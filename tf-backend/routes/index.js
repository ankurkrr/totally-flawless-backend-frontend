/**
 * @fileoverview Main API Router
 * @description Central router that mounts all feature-specific routes
 * @module routes/index
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();

// ============================================================================
// FEATURE ROUTE IMPORTS
// ============================================================================
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const artistRoutes = require('./artistRoutes');
const bookingRoutes = require('./bookingRoutes');
const cartRoutes = require('./cartRoutes');
const paymentRoutes = require('./paymentRoutes');
const chatRoutes = require('./chatRoutes');
const catalogRoutes = require('./catalogRoutes');
const wishlistRoutes = require('./wishlistRoutes');
const trainingRoutes = require('./trainingRoutes');
const deviceRoutes = require('./deviceRoutes');
const galleryRoutes = require('./galleryRoutes');
const uploadRoutes = require('./uploadRoutes');

// ============================================================================
// ROUTE MOUNTING
// ============================================================================
// All routes are prefixed with /api (defined in app.js)

router.use('/auth', authRoutes);           // Authentication endpoints
router.use('/users', userRoutes);         // User management endpoints
router.use('/artists', artistRoutes);      // Artist management endpoints
router.use('/bookings', bookingRoutes);    // Booking management endpoints
router.use('/cart', cartRoutes);           // Shopping cart endpoints
router.use('/payments', paymentRoutes);    // Payment processing endpoints
router.use('/chat', chatRoutes);           // Chat/messaging endpoints
router.use('/catalog', catalogRoutes);     // Catalog/public data endpoints
router.use('/wishlist', wishlistRoutes);   // Wishlist endpoints
router.use('/training', trainingRoutes);    // Training service endpoints
router.use('/devices', deviceRoutes);       // Device management endpoints
router.use('/gallery', galleryRoutes);     // Gallery/image endpoints
router.use('/uploads', uploadRoutes);      // Upload credential endpoints

// ============================================================================
// EXPORT
// ============================================================================
module.exports = router;
