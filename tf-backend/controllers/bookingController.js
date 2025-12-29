const bookingService = require('../services/bookingService');

class BookingController {

    /**
     * Create a new booking.
     */
    async createBooking(req, res) {
        try {
            const userId = req.user.id || req.user.userId;
            const { cartId } = req.body;

            if (!cartId) {
                return res.status(400).json({ error: 'cartId is required' });
            }

            const result = await bookingService.createBooking(userId, cartId);

            return res.status(200).json({
                status: 'success',
                message: 'Booking created successfully.',
                data: result
            });

        } catch (error) {
            console.error('BookingController.createBooking Error:', error);

            if (error.message.includes('not found') || error.message.includes('denied')) {
                return res.status(404).json({ error: error.message });
            }

            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Get a specific booking by ID (via query param as per legacy, or reused for params).
     */
    async getBooking(req, res) {
        try {
            const userId = req.user.id || req.user.userId;
            const bookingId = req.query.bookingId || req.params.bookingId;

            if (!bookingId) {
                return res.status(400).json({ status: 'error', message: 'Booking ID is required' });
            }

            const result = await bookingService.getBookingById(bookingId, userId);

            if (!result) {
                return res.status(404).json({ status: 'error', message: 'Booking not found' });
            }

            return res.status(200).json({ status: 'success', data: result });

        } catch (error) {
            console.error('BookingController.getBooking Error:', error);
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }

    /**
     * Get all bookings for the authenticated user (with filters).
     */
    async getUserBookings(req, res) {
        try {
            const userId = req.user.id || req.user.userId;
            const filters = {
                status: req.query.status,
                bookingType: req.query.bookingType,
                businessType: req.query.businessType,
                bookingItemStatus: req.query.bookingitemstatus
            };

            const data = await bookingService.getBookingsByUser(userId, filters);

            if (!data || data.length === 0) {
                return res.status(404).json({ error: "No bookings found for this user." });
            }

            return res.status(200).json({ status: 'success', data });

        } catch (error) {
            console.error('BookingController.getUserBookings Error:', error);
            return res.status(500).json({ error: 'An error occurred while fetching bookings' });
        }
    }

    /**
     * Add gratuity to a booking item.
     */
    async addGratuity(req, res) {
        try {
            const userId = req.user.id || req.user.userId;
            const { cartId, bookingitemId, gratuity } = req.body;

            if (!cartId || !bookingitemId || gratuity == null) {
                return res.status(400).json({ error: 'cartId, bookingitemId, and gratuity are required' });
            }

            const result = await bookingService.addGratuity(userId, cartId, bookingitemId, gratuity);

            return res.status(200).json({ status: 'success', ...result });

        } catch (error) {
            console.error('BookingController.addGratuity Error:', error);
            if (error.message.includes('not found') || error.message.includes('denied')) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Add rating to a booking item.
     */
    async addRating(req, res) {
        try {
            const userId = req.user.id || req.user.userId;
            const { cartId, bookingitemId, rating, how_service, how_artist } = req.body;

            if (!cartId || !bookingitemId || rating == null) {
                return res.status(400).json({ error: 'cartId, bookingitemId, and rating are required' });
            }

            const ratingData = {
                cartId,
                bookingItemId: bookingitemId,
                rating,
                howService: how_service,
                howArtist: how_artist
            };

            const result = await bookingService.addRating(userId, ratingData);

            return res.status(200).json({ status: 'success', ...result });

        } catch (error) {
            console.error('BookingController.addRating Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }
}

const bookingController = new BookingController();
module.exports = {
    createBooking: bookingController.createBooking.bind(bookingController),
    getBooking: bookingController.getBooking.bind(bookingController),
    getUserBookings: bookingController.getUserBookings.bind(bookingController),
    addGratuity: bookingController.addGratuity.bind(bookingController),
    addRating: bookingController.addRating.bind(bookingController)
};
