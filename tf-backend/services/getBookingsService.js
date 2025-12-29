const conn = require('../connection/database');
const moment = require('moment');

module.exports.GetBookings = async (req, res) => {
    const { bookingId } = req.query;
    const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token, not query

    if (!authenticatedUserId) {
        return res.status(401).json({ status: 'error', message: 'User not authenticated' });
    }

    try {
        // Verify booking belongs to authenticated user
        const bookingQuery = `
            SELECT * FROM bookings 
            WHERE id = ? AND userId = ?`;
        const [bookingRows] = await conn.promise().query(bookingQuery, [bookingId, authenticatedUserId]);

        if (bookingRows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Booking not found' });
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
                itemId: item.id,
                cartItemId: item.cartitemId,
                cartId: item.cartId,
                serviceId: item.serviceId,
                serviceName: item.serviceName,
                quantity: quantity,
                price: parseFloat(item.price) || 0,
                gratuity: parseFloat(item.gratuity) || 0,
                travelFee: parseFloat(item.travelFee) || 0,
                addOnAmount: parseFloat(item.addOnAmount) || 0,
                longHairAmount: parseFloat(item.longHairAmount) || 0,
                bookingType: item.bookingType,
                bookingTime: item.bookingTime,
                rating: item.rating,
                subCategoryId: item.subCategoryId,
                imageUrl: item.imageUrl,
                artist: item.artist,
                assignedTo: item.assignedTo,
                status: item.status,
                totalAmount: totalAmount.toFixed(2)
            };
        });


        const responseData = {
            bookingId: bookingData.id,
            userId: bookingData.userId,
            cartId: bookingData.cartId,
            totalAmount: bookingData.totalAmount,
            status: bookingData.status,
            createdAt: bookingData.createdAt,
            updatedAt: bookingData.updatedAt,
            items
        };

        res.status(200).json({ status: 'success', data: responseData });

    } catch (err) {
        console.error('Error fetching booking:', err);
        res.status(500).json({ status: 'error', message: err.toString() });
    }
};

module.exports.GetBookingsData = async (req, res) => {
    const { status, bookingType, businessType, bookingitemstatus } = req.query;
    const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token, not query

    try {
        if (!authenticatedUserId) {
            return res.status(401).json({ error: "User not authenticated." });
        }

        let bookingsQuery = `
            SELECT b.*, 
                u.firstName AS user_firstName, u.lastName AS user_lastName, 
                u.email AS user_email, u.phone AS user_phone, u.address AS user_address
            FROM bookings b 
            JOIN users u ON u.id = b.userId
            WHERE b.userId = ?`;

        const queryParams = [authenticatedUserId];

        if (status) {
            bookingsQuery += ` AND b.status = ?`;
            queryParams.push(status);
        }

        const [bookingsData] = await conn.promise().query(bookingsQuery, queryParams);

        if (!bookingsData.length) {
            return res.status(404).json({ error: "No bookings found for this user." });
        }

        for (const booking of bookingsData) {
            let bookingItemQuery = `
                SELECT * FROM booking_item 
                WHERE booking_id = ?`;

            const bookingItemParams = [booking.id];

            if (businessType) {
                bookingItemQuery += ` AND businessType = ?`;
                bookingItemParams.push(businessType);
            }

            let [bookingItems] = await conn.promise().query(bookingItemQuery, bookingItemParams);

            // ✅ **Apply filters for `bookingType` and `bookingitemstatus`**
            bookingItems = bookingItems.filter(item =>
                (!bookingType || item.bookingType === bookingType) &&
                (!bookingitemstatus || item.status === bookingitemstatus)
            );

            for (let item of bookingItems) {
                if (item.artistId) {
                    let artistQuery = `SELECT * FROM artists WHERE id = ?`;
                    const [artistData] = await conn.promise().query(artistQuery, [item.artistId]);

                    item.artists = artistData.length ? artistData[0] : null;
                    let devicesQuery = `
                        SELECT * FROM devices 
                        WHERE userId = ? 
                        ORDER BY createdAt DESC`;

                    const [devicesData] = await conn.promise().query(devicesQuery, [item.artistId]);
                    item.devices = devicesData.length ? devicesData : [];
                } else {
                    item.artists = null;
                    item.devices = [];
                }

                const wishlistQuery = `SELECT COUNT(*) AS count FROM wishlist WHERE user_id = ? AND artist_id = ?`;
                const [wishlistData] = await conn.promise().query(wishlistQuery, [authenticatedUserId, item.artistId]);

                item.isWishlist = wishlistData[0].count > 0;
            }

            booking.bookingItems = bookingItems;
        }

        res.status(200).json({ status: 'success', data: bookingsData });
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ error: 'An error occurred while fetching bookings' });
    }
};

module.exports.AddGratuity = async (req, res) => {
    const { cartId, bookingitemId, gratuity } = req.body;
    const authenticatedUserId = req.user.id || req.user.userId;

    if (!authenticatedUserId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!cartId || !bookingitemId || gratuity == null) {
        return res.status(400).json({ error: 'cartId, bookingitemId, and gratuity are required' });
    }

    try {
        // Verify booking belongs to authenticated user
        const statusQuery = `
            SELECT b.status, b.userId FROM bookings b
            JOIN booking_item bi ON bi.booking_id = b.id
            WHERE b.cartId = ? AND bi.Id = ?`;

        const [statusResult] = await conn.promise().query(statusQuery, [cartId, bookingitemId]);

        if (!statusResult || statusResult.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (statusResult[0].userId !== authenticatedUserId) {
            return res.status(403).json({ error: 'Access denied: Booking does not belong to user' });
        }

        // if (!statusResult || statusResult.length === 0 || statusResult[0].status !== 'completed') {
        //     return res.status(400).json({ error: 'Gratuity can only be added to completed bookings' });
        // }

        //Update gratuity using parameterized query
        const updateQuery = `
            UPDATE booking_item
            SET gratuity = ? 
            WHERE cartId = ? AND Id = ?`;

        const [result] = await conn.promise().query(updateQuery, [gratuity, cartId, bookingitemId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No matching cart item found to update gratuity' });
        }

        // Recalculate the total gratuity
        const totalGratuityQuery = `
            SELECT SUM(gratuity) AS totalGratuity 
            FROM booking_item
            WHERE cartId = ?`;

        const [totalGratuityResult] = await conn.promise().query(totalGratuityQuery, [cartId]);

        if (!totalGratuityResult || totalGratuityResult.length === 0) {
            return res.status(404).json({ error: 'No cart items found to calculate total gratuity' });
        }

        const totalGratuity = totalGratuityResult[0].totalGratuity;

        //Update the totalGratuity in the usercart table
        const updateTotalGratuityQuery = `
            UPDATE usercart 
            SET totalGratuity = ? 
            WHERE id = ?`;

        await conn.promise().query(updateTotalGratuityQuery, [totalGratuity, cartId]);

        // res.status(200).json({ status: 'success', message: 'Gratuity add and total gratuity recalculated successfully' });
        res.status(200).json({ status: 'success', message: 'Gratuity add successfully' });
    } catch (err) {
        console.error('Error updating gratuity:', err);
        res.status(500).json({ error: 'An error occurred while updating gratuity' });
    }
};

module.exports.AddRating = async (req, res) => {
    const { cartId, bookingitemId, rating, how_service, how_artist } = req.body;
    const authenticatedUserId = req.user.id || req.user.userId;

    if (!authenticatedUserId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!cartId || !bookingitemId || rating == null) {
        return res.status(400).json({ error: 'cartId, bookingitemId, and rating are required' });
    }

    try {
        const bookingIdQuery = `
            SELECT bi.booking_id, b.userId FROM booking_item bi
            JOIN bookings b ON b.id = bi.booking_id
            WHERE bi.cartId = ? AND bi.Id = ? LIMIT 1`;
        const [bookingIdResult] = await conn.promise().query(bookingIdQuery, [cartId, bookingitemId]);

        if (!bookingIdResult.length) {
            return res.status(400).json({ error: 'Invalid cartId or bookingitemId' });
        }

        // Verify booking belongs to authenticated user
        if (bookingIdResult[0].userId !== authenticatedUserId) {
            return res.status(403).json({ error: 'Access denied: Booking does not belong to user' });
        }

        const bookingId = bookingIdResult[0].booking_id;

        const statusQuery = `
            SELECT status FROM bookings 
            WHERE cartId = ? AND id = ? LIMIT 1`;
        const [statusResult] = await conn.promise().query(statusQuery, [cartId, bookingId]);

        if (!statusResult.length || statusResult[0]?.status?.toLowerCase().trim() !== 'completed') {
            return res.status(400).json({ error: 'Rating can only be added to completed bookings' });
        }

        const updateQuery = `
            UPDATE booking_item
            SET rating = ?, how_service = ?, how_artist = ?
            WHERE cartId = ? AND Id = ?`;

        const [result] = await conn.promise().query(updateQuery, [
            rating,
            how_service ?? null,
            how_artist ?? null,
            cartId,
            bookingitemId,
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'No matching booking item found to update rating' });
        }

        res.status(200).json({ status: 'success', message: 'Rating updated successfully' });
    } catch (err) {
        console.error('Error updating rating:', err);
        res.status(500).json({ error: 'An error occurred while updating rating' });
    }
};

// module.exports.getTotalGratuityCategoryWise = async (req, res) => {
//     try {
//         const query = `
//             SELECT 
//                 sc.name AS category_name,
//                 SUM(ci.gratuity) AS total_gratuity
//             FROM 
//                 cartitems ci
//             INNER JOIN 
//                 services s ON ci.serviceId = s.id
//             INNER JOIN 
//                 servicecategories sc ON s.categoryid = sc.id
//             GROUP BY 
//                 sc.id
//         `;
//         const [result] = await conn.promise().query(query);

//         if (!result || result.length === 0) {
//             return res.status(404).json({ error: 'No data found for total gratuity category-wise' });
//         }

//         res.status(200).json({ status: 'success', data: result });
//     } catch (err) {
//         console.error('Error fetching total gratuity category-wise:', err);
//         res.status(500).json({ error: 'An error occurred while fetching total gratuity category-wise' });
//     }
// };

module.exports.getTotalGratuityCategoryWise = async (req, res) => {
    try {
        const query = `
            SELECT 
                sc.name AS category_name,
                u.id AS user_id,
                u.firstName AS user_first_name,
                u.lastName AS user_last_name,
                u.email AS user_email,
                u.gratuity AS user_gratuity,
                SUM(u.gratuity) OVER (PARTITION BY sc.name) AS total_gratuity_per_category
            FROM 
                bookings b
            INNER JOIN 
                cartitems ci ON ci.cartId = b.cartId
            INNER JOIN 
                services s ON ci.serviceId = s.id
            INNER JOIN 
                servicecategories sc ON s.categoryid = sc.id
            INNER JOIN 
                users u ON b.userId = u.id
            WHERE 
                u.gratuity IS NOT NULL AND u.gratuity > 0
            GROUP BY 
                sc.name, u.id
            ORDER BY 
                sc.name, u.firstName
        `;

        const [result] = await conn.promise().query(query);

        if (!result || result.length === 0) {
            return res.status(404).json({ error: 'No data found for users by category with valid gratuity' });
        }

        // Group users by category name and calculate total gratuity for each category
        const groupedData = result.reduce((acc, row) => {
            const { category_name, user_id, user_first_name, user_last_name, user_email, user_gratuity, total_gratuity_per_category } = row;

            if (!acc[category_name]) {
                acc[category_name] = {
                    // total_gratuity: total_gratuity_per_category,
                    users: []
                };
            }

            acc[category_name].users.push({
                user_id,
                user_first_name,
                user_last_name,
                user_email,
                user_gratuity,
            });

            return acc;
        }, {});

        res.status(200).json({ status: 'success', data: groupedData });
    } catch (err) {
        console.error('Error fetching users by category:', err);
        res.status(500).json({ error: 'An error occurred while fetching users by category' });
    }
};


module.exports.UserDeleteUpcomingBooking = async (req, res) => {
    const { bookingId } = req.params; // Get from route params
    const { cartItemId } = req.query; // Optional cartItemId from query
    const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token

    if (!authenticatedUserId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!bookingId) {
        return res.status(400).json({ error: 'bookingId is required' });
    }

    try {
        // Check if the booking exists and belongs to the authenticated user
        const bookingQuery = `
            SELECT b.id, b.cartId
            FROM bookings b
            WHERE b.id = ? AND b.userId = ?`;

        const [bookingResult] = await conn.promise().query(bookingQuery, [bookingId, authenticatedUserId]);
        if (!bookingResult || !bookingResult.length) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        const cartId = bookingResult[0].cartId;

        // Check and delete a specific cart item if cartItemId is provided
        if (cartItemId) {
            const specificCartItemQuery = `
                SELECT ci.id
                FROM cartitems ci
                WHERE ci.cartId = ? 
                AND ci.id = ?`;

            const [specificCartItemData] = await conn.promise().query(specificCartItemQuery, [cartId, cartItemId]);

            if (!specificCartItemData || !specificCartItemData.length) {
                return res.status(404).json({ error: 'No upcoming cart item found with the given cartItemId' });
            }

            const deleteCartItemQuery = `
                DELETE FROM cartitems 
                WHERE id = ? AND cartId = ?`;

            const [deleteResult] = await conn.promise().query(deleteCartItemQuery, [cartItemId, cartId]);

            // Check if the delete query affected any rows
            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ error: 'Failed to delete the cart item' });
            }

            return res.status(200).json({ status: 'success', message: 'Specific cart item deleted successfully' });
        }

        // If no specific cart item is specified, delete all upcoming cart items
        const deleteAllCartItemsQuery = `
            DELETE FROM cartitems 
            WHERE cartId = ?`;

        const [deleteAllResult] = await conn.promise().query(deleteAllCartItemsQuery, [cartId]);

        if (deleteAllResult.affectedRows === 0) {
            return res.status(404).json({ error: 'No cart items found to delete' });
        }

        return res.status(200).json({ status: 'success', message: 'All upcoming cart items deleted successfully' });
    } catch (err) {
        console.error('Error deleting cart items:', err);
        res.status(500).json({ error: 'An error occurred while deleting cart items' });
    }
};

module.exports.UserCancelBooking = async (req, res) => {
    const { bookingId, status, bookingItemId } = req.body;
    const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token, not request body
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');

    if (!authenticatedUserId) {
        return res.status(401).json({ error: "User not authenticated." });
    }

    try {
        if (!bookingId || !status || !bookingItemId) {
            return res.status(400).json({ error: "Booking ID, Booking Item ID and Status are required." });
        }

        // Verify booking belongs to authenticated user
        const [bookingData] = await conn.promise().query(`SELECT * FROM bookings WHERE id = ? AND userId = ?`, [bookingId, authenticatedUserId]);
        if (!bookingData.length) {
            return res.status(404).json({ error: "Booking not found or does not belong to the user." });
        }

        await conn.promise().query(`UPDATE booking_item SET status = ?, cancelbyclient = 1 WHERE id = ?`, [status, bookingItemId]);


        const [itemsForBooking] = await conn.promise().query(`SELECT * FROM booking_item WHERE booking_id = ?`, [bookingId]);
        let allStatusSame = itemsForBooking.every(item => item.status === status);
        if (allStatusSame) {
            await conn.promise().query(`UPDATE bookings SET status = ?, updatedAt = ? WHERE id = ?`, [status, dateTime, bookingId]);
        }

        res.status(200).json({ status: "success", message: "Booking and items updated successfully." });
    } catch (err) {
        console.error("Error cancelling booking:", err);
        res.status(500).json({ error: "An error occurred while cancelling the booking." });
    }
};


// module.exports.getBookingtypeCounts = async (req, res) => {
//     try {
//         const query = `
//             SELECT
//                 SUM(CASE WHEN a.bookingType = 'later' THEN 1 ELSE 0 END) AS later_count,
//                 SUM(CASE WHEN a.bookingType = 'now' THEN 1 ELSE 0 END) AS now_count
//             FROM
//                 cartitems a
//         `;

//         const [result] = await conn.promise().query(query);

//         if (!result || result.length === 0) {
//             return res.status(404).json({ error: 'No data found for cart items counts' });
//         }

//         res.status(200).json({ status: 'success', data: result[0] });
//     } catch (err) {
//         console.error('Error fetching cart item counts:', err);
//         res.status(500).json({ error: 'An error occurred while fetching cart item counts' });
//     }
// };

// module.exports.getBookingtypeCounts = async (req, res) => {
//     const { userId } = req.query;

//     if (!userId) {
//         return res.status(400).json({ error: 'User ID is required' });
//     }

//     try {
//         const laterQuery = `
//             SELECT
//                 SUM(b.totalAmount) AS total_totalAmount,
//                 COUNT(b.id) AS total_booking_count,
//                 (SELECT a.bookingTime
//                  FROM cartitems a
//                  JOIN bookings b ON a.cartId = b.cartId
//                  WHERE b.userId = ? AND a.bookingType = 'later'
//                  ORDER BY a.bookingTime DESC
//                  LIMIT 1) AS latest_booking_time
//             FROM
//                 bookings b
//             JOIN
//                 cartitems a ON a.cartId = b.cartId
//             WHERE
//                 b.userId = ? AND a.bookingType = 'later'
//         `;

//         const nowQuery = `
//             SELECT
//                 SUM(b.totalAmount) AS total_totalAmount,
//                 COUNT(b.id) AS total_booking_count,
//                 (SELECT a.bookingTime
//                  FROM cartitems a
//                  JOIN bookings b ON a.cartId = b.cartId
//                  WHERE b.userId = ? AND a.bookingType = 'now'
//                  ORDER BY a.bookingTime DESC
//                  LIMIT 1) AS latest_booking_time
//             FROM
//                 bookings b
//             JOIN
//                 cartitems a ON a.cartId = b.cartId
//             WHERE
//                 b.userId = ? AND a.bookingType = 'now'
//         `;

//         const [laterResult] = await conn.promise().query(laterQuery, [userId, userId]);
//         const [nowResult] = await conn.promise().query(nowQuery, [userId, userId]);

//         if (!laterResult || !nowResult) {
//             return res.status(404).json({ error: `No data found for user with ID: ${userId}` });
//         }

//         const laterData = laterResult[0];
//         const nowData = nowResult[0];

//         const cartItemsQuery = `
//             SELECT a.serviceId
//             FROM cartitems a
//             JOIN bookings b ON a.cartId = b.cartId
//             WHERE b.userId = ?
//         `;
//         const [cartItems] = await conn.promise().query(cartItemsQuery, [userId]);

//         const serviceIds = cartItems.map(item => item.serviceId);

//         const subcategoriesQuery = `
//             SELECT DISTINCT name
//             FROM subcategories
//             WHERE serviceId IN (?) -- Filter by the serviceIds from the cart items
//         `;
//         const [subcategories] = await conn.promise().query(subcategoriesQuery, [serviceIds]);

//         const subcategoryNames = subcategories.map(subcategory => subcategory.name);

//         res.status(200).json({
//             status: 'success',
//             data: [
//                 {
//                     later_count: laterData.total_booking_count,
//                     total_totalAmount: laterData.total_totalAmount,
//                     total_booking_count: laterData.total_booking_count,
//                     user_id: userId,
//                     latest_booking_time: laterData.latest_booking_time,
//                     subcategory_names: subcategoryNames
//                 },
//                 {
//                     now_count: nowData.total_booking_count,
//                     total_totalAmount: nowData.total_totalAmount,
//                     total_booking_count: nowData.total_booking_count,
//                     user_id: userId,
//                     latest_booking_time: nowData.latest_booking_time,
//                     subcategory_names: subcategoryNames
//                 }
//             ]
//         });

//     } catch (err) {
//         console.error('Error fetching booking data for user:', err);
//         res.status(500).json({ error: 'An error occurred while fetching the requested data' });
//     }
// };


// module.exports.UserDeleteUpcomingBooking = async (req, res) => {
//     const { userId, bookingId } = req.query;

//     if (!userId || !bookingId) {
//         return res.status(400).json({ error: 'userId and bookingId are required' });
//     }

//     try {
//         // Step 1: Check if the booking exists and if it is an upcoming booking
//         const bookingQuery = `
//             SELECT b.id, b.cartId, b.createdAt
//             FROM bookings b
//             WHERE b.id = ? AND b.userId = ?`;

//         const [bookingResult] = await conn.promise().query(bookingQuery, [bookingId, userId]);

//         if (bookingResult.length === 0) {
//             return res.status(404).json({ error: 'Booking not found' });
//         }

//         const booking = bookingResult[0];
//         const createdAt = new Date(booking.createdAt);
//         const now = new Date();

//         // Check if the booking is upcoming (created in the past)
//         if (createdAt > now) {
//             return res.status(400).json({ error: 'Booking is already in the past, cannot delete upcoming booking' });
//         }

//         // Step 2: Get the cart items associated with the booking and check for upcoming items
//         const cartItemsQuery = `
//             SELECT ci.id, ci.bookingTime
//             FROM cartitems ci
//             WHERE ci.cartId = ? AND STR_TO_DATE(ci.bookingTime, '%Y-%m-%d, %h:%i %p') > NOW()`;

//         const [cartItemsData] = await conn.promise().query(cartItemsQuery, [booking.cartId]);

//         // If there are no upcoming cart items, proceed to delete the booking
//         if (cartItemsData.length === 0) {
//             // Step 3: Delete related transactions first
//             const deleteTransactionsQuery = `
//                 DELETE FROM transactions
//                 WHERE bookingId = ?`;

//             await conn.promise().query(deleteTransactionsQuery, [bookingId]);

//             // Step 4: Delete the booking record
//             const deleteBookingQuery = `
//                 DELETE FROM bookings
//                 WHERE id = ? AND userId = ?`;

//             await conn.promise().query(deleteBookingQuery, [bookingId, userId]);

//             return res.status(200).json({ status: 'success', message: 'Booking deleted successfully, no upcoming cart items found' });
//         }

//         // Step 4: If there are upcoming cart items, delete them
//         const deleteCartItemsQuery = `
//             DELETE FROM cartitems 
//             WHERE cartId = ? AND STR_TO_DATE(bookingTime, '%Y-%m-%d, %h:%i %p') > NOW()`;

//         await conn.promise().query(deleteCartItemsQuery, [booking.cartId]);


//         // Step 6: Delete the booking record after cart items and transactions deletion
//         const deleteBookingQuery = `
//             DELETE FROM bookings
//             WHERE id = ? AND userId = ?`;

//         await conn.promise().query(deleteBookingQuery, [bookingId, userId]);

//         return res.status(200).json({ status: 'success', message: 'Booking and associated upcoming cart items deleted successfully' });

//     } catch (err) {
//         console.error('Error deleting upcoming booking:', err);
//         res.status(500).json({ error: 'An error occurred while deleting the booking or cart items' });
//     }
// };


module.exports.getBookingtypeCounts = async (req, res) => {
    const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token, not query

    if (!authenticatedUserId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        const laterQuery = `
            SELECT
                SUM(b.totalAmount) AS total_totalAmount,
                SUM(b.amountPaid) AS total_amountPaid,
                COUNT(b.id) AS total_booking_count,
                (SELECT a.bookingTime
                FROM booking_item a
                JOIN bookings b ON a.cartId = b.cartId
                WHERE b.userId = ? AND a.bookingType = 'later'
                ORDER BY a.bookingTime DESC
                LIMIT 1) AS latest_booking_time
            FROM
                bookings b
            JOIN
                booking_item a ON a.cartId = b.cartId
            WHERE
                b.userId = ? AND a.bookingType = 'later'
        `;

        const nowQuery = `
            SELECT
                SUM(b.totalAmount) AS total_totalAmount,
                SUM(b.amountPaid) AS total_amountPaid,
                COUNT(b.id) AS total_booking_count,
                (SELECT a.bookingTime
                FROM booking_item a
                JOIN bookings b ON a.cartId = b.cartId
                WHERE b.userId = ? AND a.bookingType = 'now'
                ORDER BY a.bookingTime DESC
                LIMIT 1) AS latest_booking_time
            FROM
                bookings b
            JOIN
                booking_item a ON a.cartId = b.cartId
            WHERE
                b.userId = ? AND a.bookingType = 'now'
        `;

        const totalBookingQuery = `
            SELECT COUNT(*) AS total_booking_count
            FROM bookings
            WHERE userId = ?
        `;

        const laterBookingQuery = `
            SELECT DISTINCT b.id, b.totalAmount, b.amountPaid, b.createdAt
            FROM bookings b
            JOIN booking_item a ON a.cartId = b.cartId
            WHERE b.userId = ? AND a.bookingType = 'later' AND b.status = 'confirmed'
        `;

        const nowBookingQuery = `
            SELECT DISTINCT b.id, b.totalAmount, b.amountPaid, b.createdAt
            FROM bookings b
            JOIN booking_item a ON a.cartId = b.cartId
            WHERE b.userId = ? AND a.bookingType = 'now' AND b.status = 'confirmed'
        `;

        const laterCartItemsQuery = `
            SELECT a.serviceId
            FROM booking_item a
            JOIN bookings b ON a.cartId = b.cartId
            WHERE b.userId = ? AND a.bookingType = 'later'
        `;

        const nowCartItemsQuery = `
            SELECT a.serviceId
            FROM booking_item a
            JOIN bookings b ON a.cartId = b.cartId
            WHERE b.userId = ? AND a.bookingType = 'now'
        `;

        // Execute queries with authenticated user ID
        const [laterResult] = await conn.promise().query(laterQuery, [authenticatedUserId, authenticatedUserId]);
        const [nowResult] = await conn.promise().query(nowQuery, [authenticatedUserId, authenticatedUserId]);
        const [totalBookingResult] = await conn.promise().query(totalBookingQuery, [authenticatedUserId]);
        const [laterCartItems] = await conn.promise().query(laterCartItemsQuery, [authenticatedUserId]);
        const [nowCartItems] = await conn.promise().query(nowCartItemsQuery, [authenticatedUserId]);
        const [laterBookingResult] = await conn.promise().query(laterBookingQuery, [authenticatedUserId]);
        const [nowBookingResult] = await conn.promise().query(nowBookingQuery, [authenticatedUserId]);

        if (!laterResult || !nowResult) {
            return res.status(404).json({ error: `No data found for user` });
        }

        const laterData = laterResult[0];
        const nowData = nowResult[0];
        const totalBookingCount = totalBookingResult[0]?.total_booking_count || 0;

        const laterServiceIds = laterCartItems.map(item => item.serviceId);
        const nowServiceIds = nowCartItems.map(item => item.serviceId);

        let laterTotalAmount = 0;
        let laterTotalPaidAmount = 0;
        let unpaidBookings = [];
        laterBookingResult.forEach((record) => {
            console.log(`Later Booking ID: ${record.id}, Total Amount: ${record.totalAmount}, Amount Paid: ${record.amountPaid}`);
            laterTotalAmount += record.totalAmount;
            laterTotalPaidAmount += record.amountPaid;
            if (record.totalAmount > record.amountPaid) {
                unpaidBookings.push({
                    bookingId: record.id,
                    unpaidAmount: record.totalAmount - record.amountPaid
                });
            }
        });

        const laterBookingCount = laterBookingResult.length;

        let nowTotalAmount = 0;
        let nowTotalPaidAmount = 0;
        nowBookingResult.forEach((record) => {
            console.log(`Now Booking ID: ${record.id}, Total Amount: ${record.totalAmount}, Amount Paid: ${record.amountPaid}`);
            nowTotalAmount += record.totalAmount;
            nowTotalPaidAmount += record.amountPaid;
        });

        const nowBookingCount = nowBookingResult.length;

        console.log(`Total Later Booking Amount: ${laterTotalAmount}`);
        console.log(`Total Later Paid Amount: ${laterTotalPaidAmount}`);
        console.log(`Total Now Booking Amount: ${nowTotalAmount}`);
        console.log(`Total Now Paid Amount: ${nowTotalPaidAmount}`);

        let laterSubcategoryNames = [];
        let nowSubcategoryNames = [];
        let latestLaterBookingTime = null;
        let latestNowBookingTime = null;
        if (laterBookingResult.length > 0) {
            const latestLaterBookingQuery = `
            SELECT a.bookingTime
            FROM booking_item a
            JOIN bookings b ON a.cartId = b.cartId
            WHERE b.userId = ? AND a.bookingType = 'later'
            ORDER BY a.bookingTime DESC
            LIMIT 1
        `;

            const [latestLaterBookingResult] = await conn.promise().query(latestLaterBookingQuery, [authenticatedUserId]);
            latestLaterBookingTime = latestLaterBookingResult[0]?.bookingTime || null;
        }

        if (nowBookingResult.length > 0) {
            const latestNowBookingQuery = `
            SELECT a.bookingTime
            FROM booking_item a
            JOIN bookings b ON a.cartId = b.cartId
            WHERE b.userId = ? AND a.bookingType = 'now'
            ORDER BY a.bookingTime DESC
            LIMIT 1
        `;

            const [latestNowBookingResult] = await conn.promise().query(latestNowBookingQuery, [authenticatedUserId]);
            latestNowBookingTime = latestNowBookingResult[0]?.bookingTime || null;
        }
        if (laterServiceIds.length > 0) {
            const subcategoriesQuery = `
            SELECT DISTINCT s.name
            FROM subcategories s
            JOIN booking_item bi ON s.serviceId = bi.serviceId
            JOIN bookings b ON bi.cartId = b.cartId
            WHERE b.userId = ? 
            AND bi.bookingType = 'later'
            AND bi.status IN ('pending', 'payment_pending','confirmed')
        `;
            const [laterSubcategories] = await conn.promise().query(subcategoriesQuery, [authenticatedUserId]);
            laterSubcategoryNames = laterSubcategories.map(subcategory => subcategory.name);
        }

        if (nowServiceIds.length > 0) {
            const subcategoriesQuery = `
            SELECT DISTINCT s.name
            FROM subcategories s
            JOIN booking_item bi ON s.serviceId = bi.serviceId
            JOIN bookings b ON bi.cartId = b.cartId
            WHERE b.userId = ? 
            AND bi.bookingType = 'now'
            AND bi.status IN ('pending', 'payment_pending','confirmed')
        `;
            const [nowSubcategories] = await conn.promise().query(subcategoriesQuery, [authenticatedUserId]);
            nowSubcategoryNames = nowSubcategories.map(subcategory => subcategory.name);
        }


        // Response
        res.status(200).json({
            status: 'success',
            total_booking_count: totalBookingCount,
            data: [
                {
                    later_cart_count: laterData.total_booking_count,
                    user_id: authenticatedUserId,
                    total_later_booking_count: laterBookingCount,
                    latest_later_booking_time: latestLaterBookingTime,
                    later_total_amount: laterTotalAmount,
                    later_total_paid_amount: laterTotalPaidAmount,
                    later_total_unpaid_amount: laterTotalAmount - laterTotalPaidAmount,
                    unpaid_booking_ids: unpaidBookings,
                    subcategory_names: laterSubcategoryNames
                },
                {
                    now_cart_count: nowData.total_booking_count,
                    user_id: authenticatedUserId,
                    total_now_booking_count: nowBookingCount,
                    now_total_amount: nowTotalAmount,
                    now_total_paid_amount: nowTotalPaidAmount,
                    latest_now_booking_time: latestNowBookingTime,
                    subcategory_names: nowSubcategoryNames
                }
            ]
        });

    } catch (err) {
        console.error('Error fetching booking data for user:', err);
        res.status(500).json({ error: 'An error occurred while fetching the requested data' });
    }
};


module.exports.bookingdetails = async (req, res) => {
    const { bookingId } = req.params; // Get from route params
    const authenticatedUserId = req.user.id || req.user.userId;

    if (!authenticatedUserId) {
        return res.status(401).json({ message: "User not authenticated." });
    }

    if (!bookingId) {
        return res.status(400).json({ message: "Booking ID is required." });
    }

    try {
        // Verify booking belongs to authenticated user
        const bookingQuery = `
            SELECT *
            FROM bookings
            WHERE id = ? AND userId = ?`;
        const [bookingDetails] = await conn.promise().query(bookingQuery, [bookingId, authenticatedUserId]);

        if (bookingDetails.length === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        const booking = bookingDetails[0];

        const userQuery = `
            SELECT *
            FROM users
            WHERE id = ?`;
        const [userDetails] = await conn.promise().query(userQuery, [booking.userId]);

        // if (userDetails.length === 0) {
        //     return res.status(404).json({ message: "User not found for the given booking." });
        // }

        const user = userDetails[0];

        const useraddressQuery = `
            SELECT *
            FROM useraddresses
            WHERE userid = ?`;
        const [useraddressDetails] = await conn.promise().query(useraddressQuery, [user.id]);

        // if (useraddressDetails.length === 0) {
        //     return res.status(404).json({ message: "User address not found for the given booking." });
        // }

        const useraddress = useraddressDetails[0];

        const cartItemsQuery = `
            SELECT *
            FROM cartitems ci
            LEFT JOIN services s ON ci.serviceId = s.id
            WHERE cartid = ?`;
        const [cartItems] = await conn.promise().query(cartItemsQuery, [booking.cartId]);

        // const cartItemsList = cartItems.length > 0 ? cartItems : [];
        const cartItemsList = cartItems.map(item => ({
            ...item,
            ServiceName: item.name || "Service name not available",
            id: undefined,
            name: undefined,
            categoryId: undefined,
            imgUrl: undefined,
            document_id: undefined,
            created_at: undefined,
            updated_at: undefined,
            published_at: undefined,
            created_by_id: undefined,
            updated_by_id: undefined,
            locale: undefined,
        }));

        const artistIds = booking.assignedTo ? booking.assignedTo.split(",") : [];
        let artists = [];

        if (artistIds.length > 0) {
            const artistQuery = `
                SELECT *
                FROM artists
                WHERE id IN (?)`;
            const [artistDetails] = await conn.promise().query(artistQuery, [artistIds]);

            const artistAddressesQuery = `
                SELECT *
                FROM useraddresses
                WHERE userid IN (?)`;
            const [artistAddresses] = await conn.promise().query(artistAddressesQuery, [artistIds]);

            artists = artistDetails.map(artist => {
                const address = artistAddresses.find(addr => addr.userid === artist.id);
                return {
                    ...artist,
                    address: address || null,
                };
            });
        }

        res.status(200).json({
            status: "success",
            bookingDetails: booking,
            userDetails: user,
            useraddressDetails: useraddress,
            cartItems: cartItemsList,
            assignedArtists: artists,
        });
    } catch (error) {
        console.error("Error fetching booking and related details:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

