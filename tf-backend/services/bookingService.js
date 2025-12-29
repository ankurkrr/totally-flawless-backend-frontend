const conn = require('../connection/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const axios = require('axios');
const stripe = require('./stripe'); // Assuming this exists and works

class BookingService {

    /**
     * Create a new booking from a cart.
     * @param {string} userId - The authenticated user ID.
     * @param {string} cartId - The cart ID to convert to a booking.
     * @returns {Object} Created booking details.
     */
    async createBooking(userId, cartId) {
        const connection = await conn.promise().getConnection();
        const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const uniqueID = uuidv4();

        try {
            await connection.beginTransaction();

            // 1. Verify cart belongs to user
            const cartQuery = `SELECT * FROM usercart WHERE id = ? AND userId = ? AND isActive = 1`;
            const [cartRows] = await connection.query(cartQuery, [cartId, userId]);

            if (cartRows.length === 0) {
                throw new Error('Cart not found or access denied (or already inactive).');
            }

            // 2. Fetch accepted booking requests
            const bookingReqQuery = `
                SELECT br.artistId, br.cartitemid, br.cartId, br.qty, br.travelFee, br.status,
                    ci.serviceId, s.name AS serviceName, ci.bookingType, ci.bookingTime, ci.rating, ci.price, 
                    ci.longHairAmount, ci.addOnAmount, ci.subCategoryId, ci.gratuity, ci.artist, ci.imageUrl
                FROM booking_req br
                LEFT JOIN cartitems ci ON br.cartitemid = ci.id
                LEFT JOIN services s ON ci.serviceId = s.id
                WHERE br.cartId = ? AND br.status = 'accepted'`;

            const [acceptedBookingReq] = await connection.query(bookingReqQuery, [cartId]);

            if (acceptedBookingReq.length === 0) {
                throw new Error('No accepted bookings found in the cart.');
            }

            // 3. Calculate Totals
            let totalAmount = 0;
            for (const item of acceptedBookingReq) {
                const quantity = parseInt(item.qty, 10) || 1;
                const itemTotal =
                    (parseFloat(item.price) || 0) * quantity +
                    (parseFloat(item.longHairAmount) || 0) * quantity +
                    (parseFloat(item.addOnAmount) || 0) * quantity +
                    (parseFloat(item.travelFee) || 0);

                totalAmount += itemTotal;
            }

            // 4. Create Booking Record
            const bookingQuery = `
                INSERT INTO bookings
                (id, userId, createdAt, updatedAt, cartId, totalAmount, status)
                VALUES (?, ?, ?, ?, ?, ?, ?)`;

            await connection.query(bookingQuery, [
                uniqueID,
                userId,
                dateTime,
                dateTime,
                cartId,
                totalAmount.toFixed(2),
                'payment_pending',
            ]);

            // 5. Create Booking Items
            for (const item of acceptedBookingReq) {
                const quantity = parseInt(item.qty, 10) || 1;

                const bookingItemQuery = `
                    INSERT INTO booking_item
                    (id, booking_id, cartitemId, cartId, artistId, userId, serviceId, serviceName, quantity, price, bookingType, bookingTime,
                    rating, longHairAmount, addOnAmount, subCategoryId, gratuity, artist, travelFee, imageUrl, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                await connection.query(bookingItemQuery, [
                    uuidv4(),
                    uniqueID,
                    item.cartitemid,
                    cartId,
                    item.artistId,
                    userId,
                    item.serviceId,
                    item.serviceName,
                    quantity,
                    item.price,
                    item.bookingType,
                    item.bookingTime,
                    item.rating !== null ? item.rating : null,
                    item.longHairAmount,
                    item.addOnAmount,
                    item.subCategoryId,
                    item.gratuity,
                    item.artist,
                    parseFloat(item.travelFee) || 0,
                    item.imageUrl,
                    'pending'
                ]);
            }

            await connection.commit();

            return {
                bookingId: uniqueID,
                userId: userId,
                cartId: cartId,
                totalAmount: totalAmount.toFixed(2),
                status: 'pending',
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get a specific booking by ID.
     * @param {string} bookingId 
     * @param {string} userId 
     */
    async getBookingById(bookingId, userId) {
        // Verify booking belongs to authenticated user
        const bookingQuery = `
            SELECT * FROM bookings 
            WHERE id = ? AND userId = ?`;
        const [bookingRows] = await conn.promise().query(bookingQuery, [bookingId, userId]);

        if (bookingRows.length === 0) {
            return null;
        }

        const bookingData = bookingRows[0];

        const bookingItemsQuery = `
            SELECT bi.*, s.name AS serviceName
            FROM booking_item bi
            LEFT JOIN services s ON bi.serviceId = s.id
            WHERE bi.booking_id = ?`;
        const [bookingItems] = await conn.promise().query(bookingItemsQuery, [bookingId]);

        const items = bookingItems.map(item => {
            const quantity = parseInt(item.quantity || 1);
            const totalAmount =
                (parseFloat(item.price || 0) * quantity) +
                parseFloat(item.gratuity || 0) +
                parseFloat(item.travelFee || 0) +
                parseFloat(item.addOnAmount || 0) +
                parseFloat(item.longHairAmount || 0);

            return {
                ...item, // Spread original item properties
                totalAmount: totalAmount.toFixed(2)
            };
        });

        return {
            ...bookingData,
            items
        };
    }

    /**
     * Get all bookings for a user with optional filters.
     * @param {string} userId 
     * @param {Object} filters 
     */
    async getBookingsByUser(userId, filters = {}) {
        const { status, bookingType, businessType, bookingItemStatus } = filters;

        let bookingsQuery = `
            SELECT b.*, 
                u.firstName AS user_firstName, u.lastName AS user_lastName, 
                u.email AS user_email, u.phone AS user_phone, u.address AS user_address
            FROM bookings b 
            JOIN users u ON u.id = b.userId
            WHERE b.userId = ?`;

        const queryParams = [userId];

        if (status) {
            bookingsQuery += ` AND b.status = ?`;
            queryParams.push(status);
        }

        const [bookingsData] = await conn.promise().query(bookingsQuery, queryParams);

        if (!bookingsData.length) {
            return [];
        }

        for (const booking of bookingsData) {
            let bookingItemQuery = `SELECT * FROM booking_item WHERE booking_id = ?`;
            const bookingItemParams = [booking.id];

            if (businessType) {
                bookingItemQuery += ` AND businessType = ?`;
                bookingItemParams.push(businessType);
            }

            let [bookingItems] = await conn.promise().query(bookingItemQuery, bookingItemParams);

            // Apply JS filters for specific item properties
            bookingItems = bookingItems.filter(item =>
                (!bookingType || item.bookingType === bookingType) &&
                (!bookingItemStatus || item.status === bookingItemStatus)
            );

            // Enrich items with Artist details (Optimization: Could be a JOIN)
            for (let item of bookingItems) {
                item.artists = null;
                item.devices = [];
                item.isWishlist = false;

                if (item.artistId) {
                    const artistQuery = `SELECT * FROM artists WHERE id = ?`;
                    const [artistData] = await conn.promise().query(artistQuery, [item.artistId]);
                    item.artists = artistData.length ? artistData[0] : null;

                    const devicesQuery = `SELECT * FROM devices WHERE userId = ? ORDER BY createdAt DESC`;
                    const [devicesData] = await conn.promise().query(devicesQuery, [item.artistId]);
                    item.devices = devicesData;

                    const wishlistQuery = `SELECT COUNT(*) AS count FROM wishlist WHERE user_id = ? AND artist_id = ?`;
                    const [wishlistData] = await conn.promise().query(wishlistQuery, [userId, item.artistId]);
                    item.isWishlist = wishlistData[0].count > 0;
                }
            }

            booking.bookingItems = bookingItems;
        }

        return bookingsData;
    }

    /**
     * Add gratuity to a booking item.
     * @param {string} userId 
     * @param {string} cartId 
     * @param {string} bookingItemId 
     * @param {number} gratuity 
     */
    async addGratuity(userId, cartId, bookingItemId, gratuity) {
        // Verify booking belongs to authenticated user
        const statusQuery = `
            SELECT b.status, b.userId FROM bookings b
            JOIN booking_item bi ON bi.booking_id = b.id
            WHERE b.cartId = ? AND bi.Id = ?`;

        const [statusResult] = await conn.promise().query(statusQuery, [cartId, bookingItemId]);

        if (!statusResult || statusResult.length === 0) {
            throw new Error('Booking not found');
        }

        if (statusResult[0].userId !== userId) {
            throw new Error('Access denied: Booking does not belong to user');
        }

        // Update gratuity
        const updateQuery = `
            UPDATE booking_item
            SET gratuity = ? 
            WHERE cartId = ? AND Id = ?`;

        const [result] = await conn.promise().query(updateQuery, [gratuity, cartId, bookingItemId]);

        if (result.affectedRows === 0) {
            throw new Error('No matching cart item found to update gratuity');
        }

        // Recalculate total gratuity for the cart
        const totalGratuityQuery = `
            SELECT SUM(gratuity) AS totalGratuity 
            FROM booking_item
            WHERE cartId = ?`;

        const [totalGratuityResult] = await conn.promise().query(totalGratuityQuery, [cartId]);
        const totalGratuity = totalGratuityResult[0]?.totalGratuity || 0;

        // Update total gratuity in usercart
        const updateTotalGratuityQuery = `
            UPDATE usercart 
            SET totalGratuity = ? 
            WHERE id = ?`;

        await conn.promise().query(updateTotalGratuityQuery, [totalGratuity, cartId]);

        return { message: 'Gratuity added successfully', totalGratuity };
    }

    /**
     * Add rating to a booking item.
     * @param {string} userId 
     * @param {Object} ratingData 
     */
    async addRating(userId, ratingData) {
        const { cartId, bookingItemId, rating, howService, howArtist } = ratingData;

        const bookingIdQuery = `
            SELECT bi.booking_id, b.userId FROM booking_item bi
            JOIN bookings b ON b.id = bi.booking_id
            WHERE bi.cartId = ? AND bi.Id = ? LIMIT 1`;
        const [bookingIdResult] = await conn.promise().query(bookingIdQuery, [cartId, bookingItemId]);

        if (!bookingIdResult.length) {
            throw new Error('Invalid cartId or bookingItemId');
        }

        if (bookingIdResult[0].userId !== userId) {
            throw new Error('Access denied: Booking does not belong to user');
        }

        const bookingId = bookingIdResult[0].booking_id;

        const statusQuery = `
            SELECT status FROM bookings 
            WHERE cartId = ? AND id = ? LIMIT 1`;
        const [statusResult] = await conn.promise().query(statusQuery, [cartId, bookingId]);

        if (!statusResult.length || statusResult[0]?.status?.toLowerCase().trim() !== 'completed') {
            throw new Error('Rating can only be added to completed bookings');
        }

        const updateQuery = `
            UPDATE booking_item
            SET rating = ?, how_service = ?, how_artist = ?
            WHERE cartId = ? AND Id = ?`;

        await conn.promise().query(updateQuery, [
            rating,
            howService ?? null,
            howArtist ?? null,
            cartId,
            bookingItemId,
        ]);

        return { message: 'Rating updated successfully' };
    }
}

module.exports = new BookingService();
