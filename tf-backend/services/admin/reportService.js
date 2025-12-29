const db = require('../../connection/knexdatabase');

module.exports.getAllBookingItem = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        const paymentStatus = req.query.paymentStatus ? parseInt(req.query.paymentStatus) : null;

        const applyDateFilter = (query) => {
            if (startDate && endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);

                query.whereBetween('booking_item.bookingTime', [startDate, adjustedEndDate]);
            } else if (startDate) {
                const nextDay = new Date(startDate);
                nextDay.setDate(startDate.getDate() + 1);

                query.whereBetween('booking_item.bookingTime', [startDate, nextDay]);
            } else if (endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                query.where('booking_item.bookingTime', '<=', adjustedEndDate);
            }
            return query;
        };


        let bookingItemsQuery = db('booking_item')
            .leftJoin('artists', 'booking_item.artistId', 'artists.id')
            .leftJoin('artists_payment', 'booking_item.id', 'artists_payment.bookingItemId')
            .select(
                'booking_item.*',
                'artists.firstName as artistFirstName',
                'artists.lastName as artistLastName',
                db.raw('COALESCE(artists_payment.status, 0) as paymentStatus')
            )
            .where('booking_item.status', '!=', 'cancelled')
            .orderBy('booking_item.created_at', 'desc')
            .limit(limit)
            .offset(offset);

        if (paymentStatus !== null) {
            bookingItemsQuery.where(db.raw('COALESCE(artists_payment.status, 0)'), '=', paymentStatus);
        }

        applyDateFilter(bookingItemsQuery);

        const bookingItems = await bookingItemsQuery;

        let countQuery = db('booking_item')
            .leftJoin('artists_payment', 'booking_item.id', 'artists_payment.bookingItemId');
        applyDateFilter(countQuery);

        if (paymentStatus !== null) {
            countQuery.where(db.raw('COALESCE(artists_payment.status, 0)'), '=', paymentStatus);
        }

        const totalCountResult = await countQuery.count('* as total').first();
        const total = totalCountResult.total;

        res.status(200).json({
            message: "Booking items fetched successfully.",
            data: bookingItems,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                limit: limit
            }
        });
    } catch (err) {
        console.error("Error fetching booking items:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};


module.exports.updateArtistPaymentStatus = async (req, res) => {
    try {
        const { artistId, bookingItemId, bookingId, status } = req.body;

        if (!artistId || !bookingItemId || !bookingId || !status) {
            return res.status(400).json({
                message: 'artistId, bookingItemId, bookingId, and status are required.'
            });
        }

        console.log('Received Payload:', { artistId, bookingItemId, bookingId, status });

        const existing = await db('artists_payment')
            .where({
                artistId,
                bookingItemId,
                bookingId
            })
            .first();

        if (existing) {
            await db('artists_payment')
                .where({
                    artistId,
                    bookingItemId,
                    bookingId
                })
                .update({
                    status,
                    updated_at: new Date()
                });

            return res.status(200).json({
                message: 'Artist payment status updated successfully.'
            });
        } else {
            const insertData = {
                artistId,
                bookingItemId,
                bookingId,
                status,
                created_at: new Date()
            };

            console.log('Inserting new record:', insertData);

            await db('artists_payment').insert(insertData);

            return res.status(201).json({
                message: 'Artist payment record created successfully.'
            });
        }
    } catch (err) {
        console.error('Error in updating artist payment status:', err);
        return res.status(500).json({
            message: 'Internal server error.'
        });
    }
};


module.exports.getTotalBookingFee = async (req, res) => {
    try {
        const data = await db('bookings')
            .leftJoin('usercart', 'usercart.id', '=', 'bookings.cartId')
            .where('bookings.status', '!=', 'cancelled')
            .sum('usercart.bookingFee as totalBookingFee')
            .sum('bookings.totalAmount as totalBookingAmount');

        return res.status(200).json({
            message: 'successfully get the data.',
            data: data
        });
    } catch (err) {
        console.error('Error in updating artist payment status:', err);
        return res.status(500).json({
            message: 'Internal server error.'
        });
    }
};