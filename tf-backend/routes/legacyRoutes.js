const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

// Legacy route compatibility (for backward compatibility)
// These routes redirect internal request handling to new API structure

// Public routes (no authentication required)
router.post('/create-user', (req, res, next) => {
    req.url = '/api/auth/create-user';
    req.app._router.handle(req, res, next);
});

router.get('/get-otp', (req, res, next) => {
    req.url = '/api/auth/get-otp';
    req.app._router.handle(req, res, next);
});

router.post('/token', (req, res, next) => {
    req.url = '/api/auth/token';
    req.app._router.handle(req, res, next);
});

router.get('/get-categories-with-services', (req, res, next) => {
    req.url = '/api/catalog/categories';
    req.app._router.handle(req, res, next);
});

router.get('/get-levels-with-prices', (req, res, next) => {
    req.url = '/api/catalog/prices';
    req.app._router.handle(req, res, next);
});

router.get('/get-subcategories-by-serviceid', (req, res, next) => {
    req.url = '/api/catalog/subcategories';
    req.app._router.handle(req, res, next);
});

// Legacy protected routes (REQUIRE AUTHENTICATION)
router.post('/update-user', authenticate, (req, res, next) => {
    req.url = '/api/users/update';
    req.app._router.handle(req, res, next);
});

router.get('/get-userdetails', authenticate, (req, res, next) => {
    req.url = '/api/users/profile';
    req.app._router.handle(req, res, next);
});

router.get('/get-bookings', authenticate, (req, res, next) => {
    req.url = '/api/bookings';
    req.app._router.handle(req, res, next);
});

router.post('/add-address', authenticate, (req, res, next) => {
    req.url = '/api/users/addresses';
    req.app._router.handle(req, res, next);
});

router.get('/get-address', authenticate, (req, res, next) => {
    req.url = '/api/users/addresses';
    req.app._router.handle(req, res, next);
});

router.post('/update-address', authenticate, (req, res, next) => {
    req.url = '/api/users/addresses/update';
    req.app._router.handle(req, res, next);
});

router.delete('/delete-address', authenticate, (req, res, next) => {
    // Note: This requires addressId in query params, not URL params
    const addressId = req.query.addressId;
    if (addressId) {
        req.url = `/api/users/addresses/${addressId}`;
    } else {
        return res.status(400).json({ status: 'error', message: 'addressId is required' });
    }
    req.app._router.handle(req, res, next);
});

module.exports = router;
