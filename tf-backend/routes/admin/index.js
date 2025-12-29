const express = require('express');
const router = express.Router();

// Import admin routes
const authRoutes = require('./authRoutes');
const artistRoutes = require('./artistRoutes');
const userRoutes = require('./userRoutes');
const bookingRoutes = require('./bookingRoutes');
const serviceRoutes = require('./serviceRoutes');
const notificationRoutes = require('./notificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const chatRoutes = require('./chatRoutes');
const pageRoutes = require('./pageRoutes');
const reportRoutes = require('./reportRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/artists', artistRoutes);
router.use('/users', userRoutes);
router.use('/bookings', bookingRoutes);
router.use('/services', serviceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/chat', chatRoutes);
router.use('/pages', pageRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
