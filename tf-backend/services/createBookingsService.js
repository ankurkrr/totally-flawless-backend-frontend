const pool = require('../connection/database');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const axios = require('axios');
const stripe = require('./stripe');

//     const { userId, cartId, totalAmount, payableAmount } = req.body;
//     const uniqueID = uuidv4();
//     const uniqueTransactionID = uuidv4();
//     const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');

//     try {
//         const rawQuery = `SELECT * FROM users WHERE id = "${userId}"`;
//         conn.query(rawQuery, async (err, rows) => {
//             if (err) {
//                 res.status(500).json({ error: err });
//             }
//             if (rows.length > 0) {
//                 var userData = JSON.parse(JSON.stringify(rows))[0];
//                 const bookingQuery = `INSERT INTO bookings
//                               (id, userId, createdAt, updatedAt, cartId, totalAmount, status)
//                               VALUES (
//                                 "${uniqueID}",
//                                 "${userId}",
//                                 "${dateTime}",
//                                 "${dateTime}",
//                                 "${cartId}",
//                                 "${totalAmount}",
//                                 "pending"
//                               )`;
//                 console.log('booking query>>> ', bookingQuery);
//                 conn.query(bookingQuery, async (err) => {
//                     if (err) {
//                         return res.status(500).json({ error: err });
//                     }
//                     let customer = {
//                         name: userData.firstName + ' ' + userData.lastName,
//                         email: userData.email,
//                         phone: userData.phone,
//                         metadata: { user: userId },
//                     };
//                     let customerData;
//                     if (userData.customerId) {
//                         customerData = await stripe.getCustomer(userData.customerId);
//                     } else {
//                         customerData = await stripe.createCustomer(customer);
//                         const userUpdateQuery = `UPDATE users
//                               SET customerId="${customerData.id}" where id="${userId}"`;
//                         console.log('userUpdateQuery query>>> ', userUpdateQuery);
//                         conn.query(userUpdateQuery);
//                     }
//                     let paymentIntent = await stripe.createpaymentIntent(payableAmount, customerData.id, {
//                         transactionId: uniqueTransactionID,
//                         bookingId: uniqueID,
//                     });
//                     const transactionQuery = `INSERT INTO transactions
//                               (id, userId, createdAt, status, bookingId, stripeId, payableAmount)
//                               VALUES (
//                                 "${uniqueTransactionID}",
//                                 "${userId}",
//                                 "${dateTime}",
//                                 "pending",
//                                 "${uniqueID}",
//                                 "${paymentIntent.id}",
//                                 ${payableAmount}
//                               )`;
//                     console.log('booking query>>> ', transactionQuery);
//                     conn.query(transactionQuery, async (err) => {
//                         if (err) {
//                             return res.status(500).json({ error: err });
//                         }
//                         return res.status(200).json({
//                             status: 'success',
//                             message: 'Booking created successfully.',
//                             data: {
//                                 transactionId: uniqueTransactionID,
//                                 bookingId: uniqueID,
//                                 paymentIntent: paymentIntent,
//                                 customer: customerData,
//                             },
//                         });
//                     });
//                 });
//             } else {
//                 return res.status(500).json({ error: 'User not found' });
//             }
//         });
//     } catch (err) {
//         console.log(err);
//         res.status(500).json({ error: err.toString() });
//     }
// };

module.exports.CreateBooking = async (req, res) => {
    const conn = await pool.promise().getConnection();

    const { cartId } = req.body;
    const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token, not request body
    
    if (!authenticatedUserId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    console.log("Received cartId:", cartId);

    if (!cartId) {
        return res.status(400).json({ error: 'cartId is missing from request body' });
    }

    const uniqueID = uuidv4();
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
        await conn.beginTransaction();

        // Verify cart belongs to authenticated user
        const cartQuery = `SELECT * FROM usercart WHERE id = ? AND userId = ? AND isActive = 1`;
        const [cartRows] = await conn.query(cartQuery, [cartId, authenticatedUserId]);
        
        if (cartRows.length === 0) {
            await conn.rollback();
            return res.status(403).json({ error: 'Cart not found or access denied' });
        }

        const userQuery = `SELECT * FROM users WHERE id = ?`;
        const [userRows] = await conn.query(userQuery, [authenticatedUserId]);

        if (userRows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const bookingReqQuery = `
            SELECT br.artistId, br.cartitemid, br.cartId, br.qty, br.travelFee, br.status,
                ci.serviceId, s.name AS serviceName, ci.bookingType, ci.bookingTime, ci.rating, ci.price, 
                ci.longHairAmount, ci.addOnAmount, ci.subCategoryId, ci.gratuity, ci.artist, ci.imageUrl
            FROM booking_req br
            LEFT JOIN cartitems ci ON br.cartitemid = ci.id
            LEFT JOIN services s ON ci.serviceId = s.id
            WHERE br.cartId = ? AND br.status = 'accepted'`;

        const [acceptedBookingReq] = await conn.query(bookingReqQuery, [cartId]);

        if (acceptedBookingReq.length === 0) {
            return res.status(404).json({ error: 'No accepted bookings found in the cart' });
        }

        let totalAmount = 0;
        // let artistTravelFeeAdded = new Set();
        // let artistQtyCount = {};

        for (const item of acceptedBookingReq) {
            const quantity = parseInt(item.qty, 10) || 1;

            // const artistCartKey = `${item.artistId}-${cartId}`;
            // artistQtyCount[artistCartKey] = (artistQtyCount[artistCartKey] || 0) + quantity;

            const itemTotal =
                (parseFloat(item.price) || 0) * quantity +
                (parseFloat(item.longHairAmount) || 0) * quantity +
                (parseFloat(item.addOnAmount) || 0) * quantity +
                (parseFloat(item.travelFee) || 0);
            // if (artistQtyCount[artistCartKey] > 4) {
            //     itemTotal += parseFloat(item.travelFee) || 0;
            // } else if (!artistTravelFeeAdded.has(artistCartKey)) {
            //     itemTotal += parseFloat(item.travelFee) || 0;
            //     artistTravelFeeAdded.add(artistCartKey);
            // }

            totalAmount += itemTotal;
        }

        console.log("Total Amount before booking creation:", totalAmount.toFixed(2));

        const bookingQuery = `
            INSERT INTO bookings
            (id, userId, createdAt, updatedAt, cartId, totalAmount, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        await conn.query(bookingQuery, [
            uniqueID,
            authenticatedUserId,
            dateTime,
            dateTime,
            cartId,
            totalAmount.toFixed(2),
            'payment_pending',
        ]);
        console.log("Booking created with cartId:", cartId);

        for (const item of acceptedBookingReq) {
            const quantity = parseInt(item.qty, 10) || 1;

            const bookingItemQuery = `
                INSERT INTO booking_item
                (id, booking_id, cartitemId, cartId, artistId, userId, serviceId, serviceName, quantity, price, bookingType, bookingTime,
                rating, longHairAmount, addOnAmount, subCategoryId, gratuity, artist, travelFee, imageUrl, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            await conn.query(bookingItemQuery, [
                uuidv4(),
                uniqueID,
                item.cartitemid,
                cartId,
                item.artistId,
                authenticatedUserId,
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


        // Commit transaction
        await conn.commit();

        res.status(200).json({
            status: 'success',
            message: 'Booking created successfully.',
            data: {
                bookingId: uniqueID,
                userId: userId,
                cartId: cartId,
                totalAmount: totalAmount.toFixed(2),
                status: 'pending',
            },
        });
    } catch (err) {
        console.error('Error creating booking:', err);
        await conn.rollback();
        res.status(500).json({ error: err.toString() });
    }
};

module.exports.ConfirmBookingHook = async (data) => {
    const conn = await pool.promise().getConnection();
    const { transactionId, bookingId } = data;
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    
    // Require Google Maps API key from environment variables - no fallback for security
    if (!process.env.GOOGLE_MAPS_API_KEY) {
        console.error('ERROR: GOOGLE_MAPS_API_KEY is not set in environment variables');
        return false;
    }
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    try {
        const getTransactionQuery = `SELECT id, userId, createdAt, status, bookingId, stripeId, payableAmount from transactions WHERE id = "${transactionId}"`;
        let transactionData = await conn.query(getTransactionQuery);
        if (!transactionData || transactionData.length) {
            console.error(`TRANSACTION_NOT_FOUND`);
            return false;
        }
        let stripeId = transactionData[0].stripeId;
        let payableAmount = transactionData[0].payableAmount;
        let userId = transactionData[0].userId;
        const paymentIntent = await stripe.getPaymentIntent(stripeId);

        if (paymentIntent.status != 'succeeded') {
            console.log('PAYMENT_NOT_FOUND');
            return false;
        }
        if (paymentIntent.amount_received < payableAmount * 100) {
            console.error(`INVALID_PAID_AMOUNT`);
            return false;
        }

        if (paymentIntent.currency != 'usd' && paymentIntent.currency != 'USD') {
            console.error(`INVALID_PAID_AMOUNT`);
            return false;
        }

        const getBookingQuery = `SELECT id, totalAmount, amountPaid, status from bookings WHERE id = "${bookingId}"`;
        let data = await conn.query(getBookingQuery);
        if (!data || data.length) {
            console.error(`BOOKING_NOT_FOUND`);
            return false;
        }

        const updateTransactionQuery = `UPDATE transactions SET updatedAt="${dateTime}", status="paid" where id="${transactionId}"`;
        await conn.query(updateTransactionQuery);

        const bookingQuery = `UPDATE bookings SET updatedAt="${dateTime}", amountPaid=${payableAmount}, status="paid" where id="${bookingId}"`;
        await conn.query(bookingQuery);

        const userQuery = `SELECT state, geocode FROM useraddresses WHERE userid = "${userId}"`;
        conn.query(userQuery, async (err, userRows) => {
            if (err) {
                console.error(err);
                return false;
            }
            if (userRows.length === 0) {
                console.error('User does not exist.');
                return false;
            }

            const userState = userRows[0].state;
            const userGeocode = userRows[0].geocode;
            console.log('userState>>>', userState);
            console.log('userGeocode>>>', userGeocode);

            const artistQuery = `SELECT id, geocode FROM artists WHERE state = "${userState}"`;
            conn.query(artistQuery, async (err, artistRows) => {
                if (err) {
                    console.error(err);
                    return false;
                }
                if (artistRows.length === 0) {
                    console.error('No artists found in the same state.');
                    return false;
                }

                let tempList = [];

                // Check if the artist is already assigned
                for (let artist of artistRows) {
                    const checkArtistQuery = `SELECT id FROM bookings WHERE assignedTo = "${artist.id}" LIMIT 1`;
                    console.log('Checking artist', checkArtistQuery);

                    const assignedArtist = await new Promise((resolve, reject) => {
                        conn.query(checkArtistQuery, (err, bookingRows) => {
                            if (err) {
                                reject(err);
                            }
                            resolve(bookingRows.length > 0);
                        });
                    });

                    if (!assignedArtist) {
                        console.log(`Artist with id: ${artist.id} is not assigned. Now calculate distance.`);
                        const artistGeocode = artist.geocode;
                        console.log('Artist Geocode>>>', artistGeocode);
                        try {
                            // Google Distance Matrix API
                            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userGeocode}&destinations=${artistGeocode}&key=${apiKey}`;
                            const response = await axios.get(url);

                            if (response.data.rows[0].elements[0].status === 'OK' && response.data.rows[0].elements[0].distance) {
                                const distance = response.data.rows[0].elements[0].distance.value;
                                tempList.push({ id: artist.id, distance: distance });
                                console.log('tempList>>> ', tempList);
                            } else {
                                console.log(`No valid distance data returned for artist ${artist.id}. Response: `, response.data);
                            }
                        } catch (error) {
                            console.log(`Failed to calculate distance for artist ${artist.id}:`, error.message);
                        }
                    }
                }

                if (tempList.length === 0) {
                    console.error('No unassigned artists available for booking in the same state.');
                    return false;
                }

                // Sort by distance
                tempList.sort((a, b) => a.distance - b.distance);
                console.log('sorted tempList: ', tempList);

                // closest artist's Id
                const closestArtistId = tempList[0].id;
                console.log('Closest Artist Id>>>', closestArtistId);

                const bookingQuery = `UPDATE bookings
                              SET updatedAt="${dateTime}", assignedTo="${closestArtistId}", status="confirmed" where id="${bookingId}"`;
                console.log('booking query>>> ', bookingQuery);
                conn.query(bookingQuery, (err) => {
                    if (err) {
                        console.error(err);
                        return false;
                    }
                    console.log('Booking confirmed successfully.');
                    return true;
                });
            });
        });
    } catch (err) {
        console.error(err);
        return false;
    }
};

module.exports.ConfirmBooking = async (req, res) => {
    const conn = await pool.promise().getConnection();
    const { transactionId, bookingId } = req.body;
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    
    // Require Google Maps API key from environment variables - no fallback for security
    if (!process.env.GOOGLE_MAPS_API_KEY) {
        console.error('ERROR: GOOGLE_MAPS_API_KEY is not set in environment variables');
        return res.status(500).json({ error: 'Google Maps API key not configured' });
    }
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    try {
        const getTransactionQuery = `SELECT id, userId, createdAt, status, bookingId, stripeId, payableAmount from transactions WHERE id = "${transactionId}"`;
        let transactionData = await conn.query(getTransactionQuery);
        if (!transactionData || !transactionData.length || !transactionData[0].length) {
            console.error(`TRANSACTION_NOT_FOUND`);
            return res.status(500).json({ error: `TRANSACTION_NOT_FOUND` });
        }
        let stripeId = transactionData[0][0].stripeId;
        let payableAmount = transactionData[0][0].payableAmount;
        let userId = transactionData[0][0].userId;
        const paymentIntent = await stripe.getPaymentIntent(stripeId);

        if (paymentIntent.status != 'succeeded') {
            console.log('PAYMENT_NOT_FOUND');
            return res.status(500).json({ error: 'PAYMENT_NOT_FOUND' });
        }
        if (paymentIntent.amount_received < payableAmount * 100) {
            console.error(`INVALID_PAID_AMOUNT`);
            return res.status(500).json({ error: `INVALID_PAID_AMOUNT` });
        }

        if (paymentIntent.currency != 'usd' && paymentIntent.currency != 'USD') {
            console.error(`INVALID_PAID_AMOUNT`);
            return res.status(500).json({ error: `INVALID_PAID_AMOUNT` });
        }

        const getBookingQuery = `SELECT id, cartId, totalAmount, amountPaid, status from bookings WHERE id = "${bookingId}"`;
        let data = await conn.query(getBookingQuery);
        if (!data || !data.length || !data[0].length) {
            console.error(`BOOKING_NOT_FOUND`);
            return res.status(500).json({ error: `BOOKING_NOT_FOUND` });
        }
        let cartId = data[0][0].cartId;

        const updateTransactionQuery = `UPDATE transactions SET updatedAt="${dateTime}", status="paid" where id="${transactionId}"`;
        await conn.query(updateTransactionQuery);

        const updateBookingItemsQuery = `UPDATE booking_item SET status = 'confirmed' WHERE booking_id = ?`;
        await conn.query(updateBookingItemsQuery, [bookingId]);
        const bookingQuery = `UPDATE bookings SET updatedAt="${dateTime}", amountPaid=${payableAmount}, status="paid" where id="${bookingId}"`;
        await conn.query(bookingQuery);

        const userQuery = `SELECT state, geocode FROM useraddresses WHERE userid = "${userId}"`;
        const [userRows] = await conn.query(userQuery);
        if (userRows.length === 0) {
            console.error('User does not exist.');
            return res.status(500).json({ error: 'User does not exist.' });
        }
        const userState = userRows[0].state;
        const userGeocode = userRows[0].geocode;
        const bookingQueryData = `UPDATE bookings SET updatedAt="${dateTime}", status="confirmed" where id="${bookingId}"`;
        const [bookingData] = await conn.query(bookingQueryData);

        const cartUpdateQuery = `UPDATE usercart SET isActive=0 WHERE id='${cartId}';`;
        console.log('cartUpdateQuery>>> ', cartUpdateQuery);
        const [cartUpdateQueryResult] = await conn.query(cartUpdateQuery);
        console.log("cart update>>>>", cartUpdateQueryResult);
        console.log('Booking confirmed successfully.');
        return res.status(200).json({
            status: 'success',
            message: 'Booking confirmed successfully.',
            data: {
                transactionId: transactionId,
                bookingId: bookingId,
            },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: err });
    }
};

module.exports.CancelAndCompleteBooking = async (req, res) => {
    const conn = await pool.promise().getConnection();
    const { artistId, bookingItemId, status } = req.body;
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    try {
        if (!artistId || !bookingItemId || !status) {
            return res.status(400).json({ error: "Artist ID, Booking Item ID, and Status are required." });
        }

        // Step 1: Check if the booking item exists for the given artistId and bookingItemId
        let bookingItemQuery = `SELECT * FROM booking_item WHERE artistId = ? AND id = ?`;
        const [bookingItems] = await conn.query(bookingItemQuery, [artistId, bookingItemId]);

        if (bookingItems.length === 0) {
            return res.status(404).json({ error: "Booking item not found." });
        }

        // Step 2: Update the booking item status
        let updateBookingItemQuery = `UPDATE booking_item SET status = ? WHERE id = ?`;
        await conn.query(updateBookingItemQuery, [status, bookingItemId]);

        // Step 3: Check if all booking items for the same booking_id have the same status
        const bookingId = bookingItems[0].booking_id;

        let bookingItemsForBookingQuery = `SELECT * FROM booking_item WHERE booking_id = ?`;
        const [itemsForBooking] = await conn.query(bookingItemsForBookingQuery, [bookingId]);

        let allStatusSame = itemsForBooking.every(item => item.status === status);

        // Step 4: If all booking items have the same status, update the bookings table status
        if (allStatusSame) {
            let updateBookingStatusQuery = `UPDATE bookings SET status = ?, updatedAt = ? WHERE id = ?`;
            await conn.query(updateBookingStatusQuery, [status, dateTime, bookingId]);
        }

        res.status(200).json({ status: 'success', message: `Booking item and booking status updated to ${status}` });
    } catch (err) {
        console.error('Error updating booking status:', err);
        res.status(500).json({ error: 'An error occurred while updating booking status.' });
    }
};

