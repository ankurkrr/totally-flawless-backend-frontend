const conn = require('../connection/database');
const cacheService = require('../utils/cacheService');
const { CACHE_KEYS } = cacheService;

module.exports.GetArtistDetails = async (req, res) => {
    // Get artistId from query params OR from JWT token (req.user.id)
    const artistId = req.query.artistId || (req.user && req.user.id);
    
    if (!artistId) {
        return res.status(400).json({ status: 'error', message: 'artistId is required. Provide it in query params or use authenticated request with valid JWT token.' });
    }

    try {
        // Try to get from cache first
        const cacheKey = `${CACHE_KEYS.ARTIST}${artistId}`;
        const cachedData = cacheService.get(cacheKey);
        
        if (cachedData !== null) {
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json({ status: 'success', data: cachedData });
        }

        // Use parameterized query to prevent SQL injection
        const rawQuery = `
            SELECT 
                a.*, 
                ad.id AS artistDataId, 
                ad.type, 
                ad.url 
            FROM 
                artists a
            LEFT JOIN 
                artistsdata ad 
            ON 
                a.id = ad.artistId
            WHERE 
                a.id = ?
        `;
        conn.query(rawQuery, [artistId], async (err, rows) => {
            if (err) {
                res.status(500).json({ error: err });
            }
            // Use parameterized queries
            const avgQuery = `SELECT AVG(rating) AS average_rating, SUM(gratuity) AS total_gratuity FROM booking_item WHERE artistId = ? GROUP BY artistId;`;
            const [result] = await conn.promise().query(avgQuery, [artistId]);

            const bookedDetails = `SELECT * FROM booking_item WHERE artistId = ? AND status = "completed";`;
            const [bookedResult] = await conn.promise().query(bookedDetails, [artistId]);
            var totalEarn = 0;
            bookedResult?.map((v, i) => {
                const total = (parseFloat(v?.quantity) * parseFloat(v?.price)) + (parseFloat(v?.longHairAmount) * parseFloat(v?.quantity)) + (parseFloat(v?.addOnAmount) * parseFloat(v?.quantity)) + parseFloat(v?.gratuity) + parseFloat(v?.travelFee);
                totalEarn = totalEarn + total;
            });

            if (rows.length > 0) {
                const artist = {
                    ...rows[0],
                    average_rating: result[0]?.average_rating || 0,
                    total_gratuity: result[0]?.total_gratuity || 0,
                    totalEarning: totalEarn,
                    artistData: rows
                        .filter(row => row.artistDataId)
                        .map(row => ({
                            id: row.artistDataId,
                            type: row.type,
                            url: row.url,
                        })),
                };
                
                // Cache the result for 30 minutes (1800 seconds) - artist details change more frequently than catalog
                cacheService.set(cacheKey, artist, 1800);
                res.setHeader('X-Cache', 'MISS');
                res.status(200).json({
                    status: 'success',
                    data: artist,
                });
            } else {
                const emptyData = [];
                cacheService.set(cacheKey, emptyData, 1800);
                res.setHeader('X-Cache', 'MISS');
                res.status(200).json({ status: 'success', data: [] });
            }
        });
    } catch (err) {
        res.status(500).json({ err });
    }
};

// module.exports.GetArtistBookings = async (req, res) => {
//     const { artistId, status, bookingType } = req.query;

//     try {
//         if (!artistId) {
//             return res.status(400).json({ error: "Artist ID is required." });
//         }

//         let bookings = [];

//         let bookingItemQuery = `
//             SELECT * FROM booking_item 
//             WHERE artistId = ?`;

//         const bookingItemParams = [artistId];

//         let [bookingItems] = await conn.promise().query(bookingItemQuery, bookingItemParams);

//         if (!bookingItems.length) {
//             return res.status(404).json({ error: "No bookings found for this artist." });
//         }

//         const bookingIds = [...new Set(bookingItems.map(item => item.booking_id))];

//         let bookingQuery = `
//             SELECT b.*, 
//                 u.firstName as user_firstName, u.lastName as user_lastName, 
//                 u.email as user_email, u.phone as user_phone, u.profileImage as user_profileImage, 
//                 u.address as user_address
//             FROM bookings b
//             JOIN users u ON u.id = b.userId
//             WHERE b.id IN (${bookingIds.map(() => '?').join(',')})`;

//         const [bookingsData] = await conn.promise().query(bookingQuery, bookingIds);

//         if (!bookingsData.length) {
//             return res.status(404).json({ error: "No bookings found." });
//         }

//         if (status) {
//             bookingsData = bookingsData.filter(booking => booking.status === status);
//         }

//         for (const booking of bookingsData) {
//             let cartData = {
//                 Id: '',
//                 userId: '',
//                 totalAmount: '',
//                 bookingFee: '',
//                 addressId: '',
//                 totalGratuity: '',
//                 later: [],
//                 now: [],
//                 bookingTime: '',
//                 address: {}
//             };

//             let cartId = booking.cartId;
//             const cartQuery = `SELECT * FROM usercart WHERE id = ?`;
//             let [cartRows] = await conn.promise().query(cartQuery, [cartId]);

//             if (cartRows.length) {
//                 let cart = cartRows[0];
//                 cartData = {
//                     Id: cart.id,
//                     userId: cart.userId,
//                     totalAmount: cart.totalAmount,
//                     bookingFee: cart.bookingFee,
//                     addressId: cart.addressId,
//                     totalGratuity: cart.totalGratuity,
//                     bookingTime: cart.bookingTime
//                 };

//                 // Fetch address details
//                 const addressQuery = `SELECT * FROM useraddresses WHERE id = ?`;
//                 let [addressRows] = await conn.promise().query(addressQuery, [cart.addressId]);

//                 if (addressRows.length) {
//                     cartData.address = addressRows[0];
//                 }

//                 // Fetch `later` and `now` booking items
//                 const itemsForBooking = bookingItems.filter(item => item.booking_id === booking.id);

//                 if (bookingType === 'later' || !bookingType) {
//                     cartData.later = itemsForBooking.filter(item => item.bookingType === 'later');
//                 }

//                 if (bookingType === 'now' || !bookingType) {
//                     cartData.now = itemsForBooking.filter(item => item.bookingType === 'now');
//                 }
//             }

//             // Fetch latest device details for this artist
//             const deviceQuery = `SELECT * FROM devices WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`;
//             const [deviceData] = await conn.promise().query(deviceQuery, [artistId]);

//             if ((bookingType === 'later' && cartData.later.length > 0) ||
//                 (bookingType === 'now' && cartData.now.length > 0) ||
//                 (!bookingType && (cartData.later.length > 0 || cartData.now.length > 0))) {
//                 bookings.push({
//                     ...booking,
//                     cartData,
//                     deviceData: deviceData.length ? deviceData[0] : null
//                 });
//             }
//         }

//         res.status(200).json({ status: 'success', data: bookings });
//     } catch (err) {
//         console.error('Error fetching artist bookings:', err);
//         res.status(500).json({ error: 'An error occurred while fetching artist bookings.' });
//     }
// };


module.exports.GetArtistBookings = async (req, res) => {
    const { artistId, status, bookingType, bookingitemstatus } = req.query;

    try {
        if (!artistId) {
            return res.status(400).json({ error: "Artist ID is required." });
        }

        let bookings = [];

        let bookingItemQuery = `
        SELECT bi.*, 
            s.name AS service_name, 
            s.categoryId AS category_id
        FROM booking_item bi
        LEFT JOIN services s ON bi.serviceId = s.id
        WHERE bi.artistId = ?`;

        const [bookingItems] = await conn.promise().query(bookingItemQuery, [artistId]);

        if (!bookingItems.length) {
            return res.status(404).json({ error: "No bookings found for this artist." });
        }

        const bookingIds = [...new Set(bookingItems.map(item => item.booking_id))];

        if (bookingIds.length === 0) {
            return res.status(404).json({ error: "No bookings found." });
        }

        let bookingQuery = `
            SELECT b.*, 
                u.firstName as user_firstName, u.lastName as user_lastName, 
                u.email as user_email, u.phone as user_phone, u.profileImage as user_profileImage, 
                u.address as user_address
            FROM bookings b
            JOIN users u ON u.id = b.userId
            WHERE b.id IN (${bookingIds.map(() => '?').join(',')})`;

        let [bookingsData] = await conn.promise().query(bookingQuery, bookingIds);

        if (!bookingsData.length) {
            return res.status(404).json({ error: "No bookings found." });
        }

        // Filter bookings by status if provided
        let filteredBookings = status ? bookingsData.filter(booking => booking.status === status) : bookingsData;

        for (const booking of filteredBookings) {
            let bookingitemData = {
                later: [],
                now: [],
                bookingTime: '',
                address: {}
            };

            let cartId = booking.cartId;
            if (cartId) {
                // Get cart details
                const cartQuery = `SELECT * FROM usercart WHERE id = ?`;
                let [cartRows] = await conn.promise().query(cartQuery, [cartId]);

                if (cartRows.length) {
                    let cart = cartRows[0];
                    bookingitemData.bookingTime = cart.bookingTime;

                    // Get address details from useraddresses table
                    const addressQuery = `SELECT * FROM useraddresses WHERE id = ?`;
                    let [addressRows] = await conn.promise().query(addressQuery, [cart.addressId]);

                    if (addressRows.length) {
                        bookingitemData.address = addressRows[0];
                    }
                }
            }

            const itemsForBooking = bookingItems.filter(item => item.booking_id === booking.id);
            const calculateTotalAmount = (item) => {
                return (
                    (parseFloat(item.price) * parseInt(item.quantity)) +
                    parseFloat(item.longHairAmount || 0) +
                    parseFloat(item.addOnAmount || 0) +
                    parseFloat(item.travelFee || 0)
                ).toFixed(2);
            };

            if (bookingType === 'later' || !bookingType) {
                bookingitemData.later = itemsForBooking
                    .filter(item => item.bookingType === 'later' && (!bookingitemstatus || item.status === bookingitemstatus))
                    .map(item => ({
                        ...item,
                        TotalAmount: calculateTotalAmount(item)
                    }));
            }

            if (bookingType === 'now' || !bookingType) {
                bookingitemData.now = itemsForBooking
                    .filter(item => item.bookingType === 'now' && (!bookingitemstatus || item.status === bookingitemstatus))
                    .map(item => ({
                        ...item,
                        TotalAmount: calculateTotalAmount(item)
                    }));
            }

            const deviceQuery = `SELECT * FROM devices WHERE userId = ? ORDER BY createdAt DESC LIMIT 1`;
            const [deviceData] = await conn.promise().query(deviceQuery, [artistId]);

            if (
                (bookingType === 'later' && bookingitemData.later.length > 0) ||
                (bookingType === 'now' && bookingitemData.now.length > 0) ||
                (!bookingType && (bookingitemData.later.length > 0 || bookingitemData.now.length > 0))
            ) {
                bookings.push({
                    ...booking,
                    bookingitemData,
                    deviceData: deviceData.length ? deviceData[0] : null
                });
            }
        }
        res.status(200).json({ status: 'success', data: bookings });
    } catch (err) {
        console.error('Error fetching artist bookings:', err);
        res.status(500).json({ error: 'An error occurred while fetching artist bookings.' });
    }
};


module.exports.artistChangeBookingStatus = async (req, res) => {
    const { artistId, bookingId, newStatus } = req.body;

    if (!artistId || !bookingId || !newStatus) {
        return res.status(400).json({ error: 'artistId, bookingId, and newStatus are required' });
    }

    try {
        const bookingQuery = `
            SELECT b.id, b.assignedTo, b.status 
            FROM bookings b 
            WHERE b.id = "${bookingId}"`;

        const [bookingData] = await conn.promise().query(bookingQuery);

        if (!bookingData || bookingData.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const booking = bookingData[0];

        // const validStatuses = ['pending', 'completed', 'cancelled', 'confirmed', 'accept'];
        // if (!validStatuses.includes(newStatus)) {
        //     return res.status(400).json({ error: 'Invalid status provided' });
        // }

        const updateQuery = `
            UPDATE bookings 
            SET status = "${newStatus}" 
            WHERE id = "${bookingId}"`;

        const [result] = await conn.promise().query(updateQuery);

        if (result.affectedRows === 0) {
            return res.status(500).json({ error: 'Failed to update booking status' });
        }

        res.status(200).json({
            status: 'success',
            message: `Booking status updated to '${newStatus}' successfully`
        });

    } catch (err) {
        console.error('Error updating booking status:', err);
        res.status(500).json({ error: 'An error occurred while updating the booking status' });
    }
};

module.exports.GetCurrentBookingsForArtist = async (req, res) => {
    const { artistId } = req.query;

    if (!artistId) {
        return res.status(400).json({ error: "Artist ID is required" });
    }

    try {
        let bookings = [];

        // Base query to fetch pending bookings assigned to the artist
        let bookingsQuery = `
            SELECT b.id, b.userId, b.createdAt, b.cartId, b.updatedAt, b.assignedTo, b.totalAmount, b.amountPaid, b.status, 
            a.mobile as 'artist_mobile', a.firstName as 'artist_firstName', a.lastName as 'artist_lastName', a.email as 'artist_email', 
            a.address as 'artist_address', a.geocode as 'artist_geocode', a.city as 'artist_city', a.state as 'artist_state', 
            a.businessType as 'artist_businessType', a.videoUrl as 'artist_videoUrl', a.createdDate as 'artist_createdDate', 
            a.countryCode as 'artist_countryCode',
            u.firstName as 'user_firstName', u.lastName as 'user_lastName', u.email as 'user_email', u.phone as 'user_phone',
            u.address as 'user_address'
            FROM bookings b 
            LEFT JOIN artists a ON a.id = b.assignedTo
            LEFT JOIN users u ON u.id = b.userId
            WHERE b.assignedTo = "${artistId}" AND b.status = "pending"`;

        let bookingsData = await conn.promise().query(bookingsQuery);

        if (!bookingsData || !bookingsData.length || !bookingsData[0].length) {
            return res.status(404).json({ error: "No pending bookings found for the specified artist" });
        }

        for (const booking of bookingsData[0]) {
            let cartData = {
                Id: '',
                userId: '',
                totalAmount: '',
                bookingFee: '',
                addressId: '',
                totalGratuity: '',
                later: [],
                now: [],
                bookingTime: '',
            };

            let cartId = booking.cartId;
            const cartQuery = `SELECT * FROM usercart WHERE id = "${cartId}"`;
            let cartsData = await conn.promise().query(cartQuery);

            if (cartsData && cartsData.length && cartsData[0].length) {
                cartData = {
                    ...cartData,
                    Id: cartsData[0][0].id,
                    userId: cartsData[0][0].userId,
                    totalAmount: cartsData[0][0].totalAmount,
                    bookingFee: cartsData[0][0].bookingFee,
                    addressId: cartsData[0][0].addressId,
                    totalGratuity: cartsData[0][0].totalGratuity,
                    bookingTime: cartsData[0][0]?.bookingTime || null,
                };

                let laterData = [];
                const laterQuery = `
                    SELECT a.Id, a.cartId, a.serviceId, a.quantity, a.price, a.bookingType, a.gratuity, a.rating, a.bookingTime,
                    a.imageUrl, a.artist, b.name 
                    FROM cartitems a 
                    INNER JOIN subcategories b ON a.serviceId = b.serviceId 
                    WHERE a.cartId = '${cartId}' AND a.bookingType = 'later'
                    GROUP BY a.Id, a.cartId, a.serviceId, a.quantity, a.price, a.bookingType, a.gratuity, a.rating, a.bookingTime, 
                    a.imageUrl, a.artist, b.name;`;

                laterData = await conn.promise().query(laterQuery);

                let nowData = [];
                const nowQuery = `
                    SELECT a.Id, a.cartId, a.serviceId, a.quantity, a.price, a.bookingType, a.gratuity, a.rating, a.bookingTime,
                    a.imageUrl, a.artist, b.name 
                    FROM cartitems a 
                    INNER JOIN subcategories b ON a.serviceId = b.serviceId 
                    WHERE a.cartId = '${cartId}' AND a.bookingType = 'now'
                    GROUP BY a.Id, a.cartId, a.serviceId, a.quantity, a.price, a.bookingType, a.gratuity, a.rating, a.bookingTime, 
                    a.imageUrl, a.artist, b.name;`;

                nowData = await conn.promise().query(nowQuery);

                if (laterData && laterData.length && laterData[0].length) {
                    cartData.later = laterData[0];
                }
                if (nowData && nowData.length && nowData[0].length) {
                    cartData.now = nowData[0];
                }
            }

            bookings.push({
                ...booking,
                cartData,
            });
        }

        res.status(200).json({ status: 'success', data: bookings });
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ error: 'An error occurred while fetching bookings' });
    }
};

module.exports.ArtistApprove = async (req, res) => {
    const { artistId } = req.body;

    if (!artistId) {
        return res.status(400).json({ error: "Artist ID is required." });
    }

    try {
        const query = `
            UPDATE artists 
            SET isApproved = 1 
            WHERE id = ?
        `;
        const [result] = await conn.promise().query(query, [artistId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No artist found with the provided ID." });
        }
        res.status(200).json({ status: "success", message: "Artist approved successfully." });
    } catch (err) {
        console.error("Error approving artist:", err);
        res.status(500).json({ error: "An error occurred while approving the artist." });
    }
};

module.exports.ArtistAvailable = async (req, res) => {
    const { artistId, isAvailable } = req.body;

    if (!artistId || isAvailable == null) {
        return res.status(400).json({ error: "Artist ID and availability status are required." });
    }

    try {
        const query = `
            UPDATE artists 
            SET isAvailable = ? 
            WHERE id = ?
        `;
        const [result] = await conn.promise().query(query, [isAvailable, artistId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "No artist found with the provided ID." });
        }

        res.status(200).json({ status: "success", message: "Artist availability updated successfully." });
    } catch (err) {
        console.error("Error updating artist availability:", err);
        res.status(500).json({ error: "An error occurred while updating artist availability." });
    }
};

