const conn = require("../connection/database");
const axios = require('axios');
const cacheService = require("../utils/cacheService");
const { CACHE_KEYS } = cacheService;

// Require Google Maps API key from environment variables - no fallback for security
if (!process.env.GOOGLE_MAPS_API_KEY) {
    console.error('WARNING: GOOGLE_MAPS_API_KEY is not set in environment variables');
}

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

module.exports.GetAddress = async (req, res) => {
    const authenticatedUserId = req.user.id || req.user.userId; // Get from authenticated token
    
    if (!authenticatedUserId) {
        return res.status(401).json({ status: "error", message: "User not authenticated" });
    }

    try {
        // Try to get from cache first
        const cacheKey = `${CACHE_KEYS.USER_ADDRESSES}${authenticatedUserId}`;
        const cachedData = cacheService.get(cacheKey);
        
        if (cachedData !== null) {
            res.setHeader('X-Cache', 'HIT');
            return res.status(200).json({ status: "success", data: cachedData });
        }

        // Use parameterized query to prevent SQL injection
        const rawQuery = `SELECT * FROM useraddresses WHERE userid = ?`;
        conn.query(rawQuery, [authenticatedUserId], (err, rows) => {
            if (err) {
                console.error('Error fetching addresses:', err);
                return res.status(500).json({ 
                    status: 'error', 
                    message: process.env.NODE_ENV === 'development' ? err.message : 'Failed to fetch addresses' 
                });
            }
            if (rows.length > 0) {
                var data = JSON.parse(JSON.stringify(rows));
                console.log(data);
                
                // Cache the result for 15 minutes (900 seconds)
                cacheService.set(cacheKey, data, 900);
                res.setHeader('X-Cache', 'MISS');
                res.status(200).json({ status: "success", data });
            }
            else {
                const emptyData = [];
                cacheService.set(cacheKey, emptyData, 900);
                res.setHeader('X-Cache', 'MISS');
                res.status(200).json({ status: "success", data: [] });
            }
        });
    } catch (err) {
        console.error('Error in GetAddress:', err);
        res.status(500).json({ 
            status: 'error', 
            message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' 
        });
    }
};

// const calculateDistance = (lat1, lon1, lat2, lon2) => {
//     const R = 6371; // Radius of the Earth in km
//     const toRad = (val) => (val * Math.PI) / 180;
//     const dLat = toRad(lat2 - lat1);
//     const dLon = toRad(lon2 - lon1);
//     const a =
//         Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//         Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
//         Math.sin(dLon / 2) * Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c * 0.621371; // Convert km to miles
// };
// const calculateDistanceWithGoogle = async (userAddress, artistAddress) => {
//     const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(userAddress)}&key=${GOOGLE_API_KEY}`;

//     try {
//         // Get latitude and longitude for the user address
//         const userGeoResponse = await axios.get(geocodeUrl);
//         if (!userGeoResponse.data.results.length) {
//             throw new Error('User address not found.');
//         }
//         const userLat = userGeoResponse.data.results[0].geometry.location.lat;
//         const userLng = userGeoResponse.data.results[0].geometry.location.lng;

//         // Get latitude and longitude for the artist address
//         const artistGeoResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(artistAddress)}&key=${GOOGLE_API_KEY}`);
//         if (!artistGeoResponse.data.results.length) {
//             throw new Error(`Artist address not found for address: ${artistAddress}`);
//         }
//         const artistLat = artistGeoResponse.data.results[0].geometry.location.lat;
//         const artistLng = artistGeoResponse.data.results[0].geometry.location.lng;

//         // Distance Matrix API to calculate distance
//         const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLat},${userLng}&destinations=${artistLat},${artistLng}&key=${GOOGLE_API_KEY}`;
//         const distanceResponse = await axios.get(distanceMatrixUrl);

//         if (distanceResponse.data.status === 'OK') {
//             const distanceInMeters = distanceResponse.data.rows[0].elements[0].distance.value; // In meters
//             const distanceInMiles = distanceInMeters * 0.000621371; // Convert meters to miles
//             return distanceInMiles;
//         } else {
//             throw new Error('Error calculating distance using Google API.');
//         }
//     } catch (error) {
//         console.error(error);
//         throw new Error('Error with Google API or artist address issue.');
//     }
// };

// module.exports.getUserToArtistLocation = async (req, res) => {
//     const { userId } = req.query; // Only userId as input
//     try {
//         // Fetch cartId for the given userId
//         const cartQuery = `
//             SELECT ci.cartId, ci.serviceId 
//             FROM cartitems ci 
//             JOIN usercart uc ON ci.cartId = uc.id
//             WHERE uc.userId = ?`;
//         const [cartItems] = await conn.promise().query(cartQuery, [userId]);

//         if (cartItems.length === 0) {
//             return res.status(404).json({ message: "No cart items found for the user." });
//         }

//         // Fetch user address
//         const userQuery = `SELECT address FROM users WHERE id = ?`;
//         const [userRows] = await conn.promise().query(userQuery, [userId]);
//         if (userRows.length === 0) {
//             return res.status(404).json({ message: "User address not found." });
//         }
//         const userAddress = userRows[0].address;

//         // Fetch all artists' addresses
//         const artistQuery = `SELECT id, address FROM artists`;
//         const [artistRows] = await conn.promise().query(artistQuery);

//         if (artistRows.length === 0) {
//             return res.status(404).json({ message: "No artists found." });
//         }

//         // Find the nearest artist by calculating distances
//         let nearestArtistId = null;
//         let nearestArtistDistance = Infinity;
//         for (let artist of artistRows) {
//             if (!artist.address) {
//                 console.error(`Missing address for artist with ID: ${artist.id}`);
//                 continue; // Skip artists without addresses
//             }

//             try {
//                 const artistDistance = await calculateDistanceWithGoogle(userAddress, artist.address);
//                 if (artistDistance < nearestArtistDistance) {
//                     nearestArtistDistance = artistDistance;
//                     nearestArtistId = artist.id;
//                 }
//             } catch (error) {
//                 console.error(`Error calculating distance for artist ${artist.id}: ${error.message}`);
//             }
//         }

//         if (!nearestArtistId) {
//             return res.status(404).json({ message: "No artist with a valid address found." });
//         }

//         // One cart item distance (assuming distance for one cart item is the same)
//         const oneCarItemTotalDistance = nearestArtistDistance;

//         // Total distance for all cart items
//         const totalDistance = oneCarItemTotalDistance * cartItems.length;

//         // Return the total distance and one cart item's distance along with the nearest artist id
//         res.status(200).json({
//             status: "success",
//             near_artist_id: nearestArtistId,
//             totalDistance: totalDistance.toFixed(2) + " miles",
//             cartItems: cartItems.length,
//             oneCarItemTotalDistance: oneCarItemTotalDistance.toFixed(2) + " miles"
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };

const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 0.621371; // Convert km to miles
    return distance;
};


// const calculateTravelFee = (distance) => {
//     console.log(`Calculating fee for distance: ${distance} miles`);

//     // Using specific ranges for different distance thresholds
//     if (distance > 50) {
//         return 100; // Fee for distances above 50 miles
//     } else if (distance > 40) {
//         return 80;  // Fee for distances above 40 miles but less than or equal to 50 miles
//     } else if (distance > 30) {
//         return 75;  // Fee for distances above 30 miles but less than or equal to 40 miles
//     } else if (distance > 20) {
//         return 75;  // Fee for distances above 20 miles but less than or equal to 30 miles
//     } else if (distance > 10) {
//         return 50;  // Fee for distances above 10 miles but less than or equal to 20 miles
//     } else {
//         return 0;  // Fee for distances less than or equal to 10 miles
//     }
// };

const calculateTravelFee = (distance) => {
    console.log(`Calculating fee for distance: ${distance} miles`);

    if (distance <= 10) {
        return 0;
    } else if (distance <= 25) {
        return 30;
    } else if (distance <= 50) {
        return 30 + (distance - 25);
    } else {
        return 55 + (distance - 50);
    }
};

module.exports.getUserToArtistLocation = async (req, res) => {
    const { userId, userCartId, businessType } = req.query;
    if (!userId || !userCartId || !businessType) {
        return res.status(400).json({ message: "userId, userCartId, and businessType are required." });
    }

    try {
        const cartQuery = `
            SELECT id AS cartId, userId, totalAmount, bookingFee, addressId, totalGratuity
            FROM usercart WHERE id = ? AND userId = ?`;
        const [cartRows] = await conn.promise().query(cartQuery, [userCartId, userId]);

        if (cartRows.length === 0) {
            return res.status(404).json({ message: "No cart found for the provided cartId and userId." });
        }

        const cartDetails = cartRows[0];

        const laterQuery = `
            SELECT ci.id, ci.cartId, ci.price, ci.bookingType, ci.gratuity, ci.rating, ci.bookingTime, 
                   ci.imageUrl, ci.artist, ci.assignedTo, ci.serviceId, s.name AS serviceName, s.categoryId AS categoryId
            FROM cartitems ci
            JOIN services s ON ci.serviceId = s.id
            WHERE ci.cartId = ? AND ci.bookingType = 'later'`;
        const [laterItemsRows] = await conn.promise().query(laterQuery, [cartDetails.cartId]);

        const nowQuery = `
            SELECT ci.id, ci.cartId, ci.price, ci.bookingType, ci.gratuity, ci.rating, ci.bookingTime, 
                   ci.imageUrl, ci.artist, ci.assignedTo, ci.serviceId, s.name AS serviceName, s.categoryId AS categoryId
            FROM cartitems ci
            JOIN services s ON ci.serviceId = s.id
            WHERE ci.cartId = ? AND ci.bookingType = 'now'`;
        const [nowItemsRows] = await conn.promise().query(nowQuery, [cartDetails.cartId]);

        cartDetails.now = nowItemsRows;
        cartDetails.later = laterItemsRows;

        const userAddressQuery = `SELECT geocode FROM useraddresses WHERE id = ?`;
        const [userAddressRows] = await conn.promise().query(userAddressQuery, [cartDetails.addressId]);

        if (!userAddressRows || userAddressRows.length === 0) {
            return res.status(404).json({ message: "No address found for the provided addressId." });
        }

        const userGeocode = userAddressRows[0].geocode;
        const [userLat, userLng] = userGeocode.split(',').map(Number);

        const artistQuery = `
            SELECT a.id AS artistId, a.firstName AS artistName, a.email AS artistEmail, 
                aa.geocode, aa.state, aa.city, aa.street, a.businessType
            FROM artists a
            JOIN useraddresses aa ON a.id = aa.userid AND aa.isDefault = 1
            WHERE a.isApproved = 1 AND a.isAvailable = 1 AND a.businessType = ?
            HAVING (
                6371 * 0.621371 * ACOS(
                    COS(RADIANS(?)) * COS(RADIANS(SUBSTRING_INDEX(aa.geocode, ',', 1))) *
                    COS(RADIANS(SUBSTRING_INDEX(aa.geocode, ',', -1)) - RADIANS(?)) +
                    SIN(RADIANS(?)) * SIN(RADIANS(SUBSTRING_INDEX(aa.geocode, ',', 1)))
                )
            ) <= 50`;
        const [artistRows] = await conn.promise().query(artistQuery, [businessType, userLat, userLng, userLat]);

        if (artistRows.length === 0) {
            return res.status(404).json({ message: "No artists found within 50 miles." });
        }

        const acceptedArtists = [];
        const declinedArtists = [];
        const availableArtists = [];

        for (let artist of artistRows) {
            const deviceQuery = `SELECT * FROM devices WHERE userId = ?`;
            const [deviceRows] = await conn.promise().query(deviceQuery, [artist.artistId]);

            if (deviceRows.length === 0) {
                continue;
            }

            const bookingReqQuery = `SELECT cartId, cartitemid, qty, travelFee, status 
                                    FROM booking_req 
                                    WHERE cartId = ? AND artistId = ?`;
            const [bookingReqRows] = await conn.promise().query(bookingReqQuery, [userCartId, artist.artistId]);

            const bookingDetails = [];
            let isDeclined = false;

            for (const bookingReq of bookingReqRows) {
                if (bookingReq.status === "declined") {
                    isDeclined = true;
                    break;
                }

                const bookingItemQuery = `
                    SELECT id AS bookingitemid 
                    FROM booking_item 
                    WHERE cartId = ? AND cartitemid = ? AND artistId = ? AND quantity = ?`;
                const [bookingItemRows] = await conn.promise().query(
                    bookingItemQuery,
                    [bookingReq.cartId, bookingReq.cartitemid, artist.artistId, bookingReq.qty]
                );

                bookingDetails.push({
                    cartId: bookingReq.cartId,
                    cartitemId: bookingReq.cartitemid,
                    qty: bookingReq.qty,
                    travelFee: bookingReq.travelFee,
                    bookingitemid: bookingItemRows.length > 0 ? bookingItemRows[0].bookingitemid : null,
                });
            }

            if (isDeclined) {
                declinedArtists.push({ ...artist, devices: deviceRows, status: "declined" });
            } else if (bookingDetails.length > 0) {
                acceptedArtists.push({
                    ...artist,
                    devices: deviceRows,
                    status: "accepted",
                    bookingDetails,
                });
            } else {
                availableArtists.push({ ...artist, devices: deviceRows, status: "available" });
            }
        }

        const calculateTravelFeeForArtists = (artists) => {
            return artists.map(artist => {
                const [artistLat, artistLng] = artist.geocode.split(',').map(Number);
                const distance = calculateDistance(userLat, userLng, artistLat, artistLng);
                const travelFee = calculateTravelFee(distance);
                return { ...artist, distance, travelFee };
            });
        };

        const acceptedArtistsWithTravelFee = calculateTravelFeeForArtists(acceptedArtists);
        const availableArtistsWithTravelFee = calculateTravelFeeForArtists(availableArtists);

        acceptedArtistsWithTravelFee.sort((a, b) => a.distance - b.distance);
        availableArtistsWithTravelFee.sort((a, b) => a.distance - b.distance);

        res.status(200).json({
            status: "success",
            acceptedArtists: acceptedArtistsWithTravelFee.map(({ artistId, artistName, artistEmail, distance, travelFee, devices, bookingDetails }) => ({
                artistId,
                artistName,
                artistEmail,
                distance: distance.toFixed(2) + " miles",
                travelFee,
                devices,
                status: "accepted",
                bookingDetails,
            })),
            availableArtists: availableArtistsWithTravelFee.map(({ artistId, artistName, artistEmail, distance, travelFee, devices }) => ({
                artistId,
                artistName,
                artistEmail,
                distance: distance.toFixed(2) + " miles",
                travelFee,
                devices,
                status: "available",
            })),
            // declinedArtists: declinedArtists.map(({ artistId, artistName, artistEmail, devices }) => ({
            //     artistId,
            //     artistName,
            //     artistEmail,
            //     devices,
            //     status: "declined",
            // })),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports.artistBookingStatus = async (req, res) => {
    const { artistId, cartitemid } = req.body;

    if (!artistId || !cartitemid || !Array.isArray(cartitemid)) {
        return res.status(400).json({ message: "artistId and cartitemid (as array) are required." });
    }

    try {
        for (const item of cartitemid) {
            const { id: cartItemId, qty, travelFee, status } = item;

            if (!cartItemId || !qty || !travelFee || !status) {
                return res.status(400).json({ message: "Each cartitem must include id, qty, travelFee, and status." });
            }

            const cartQuery = `
                SELECT cartId
                FROM cartitems
                WHERE id = ?`;
            const [cartRows] = await conn.promise().query(cartQuery, [cartItemId]);

            if (cartRows.length === 0) {
                return res.status(404).json({ message: `Cart item with id ${cartItemId} not found.` });
            }

            const cartId = cartRows[0].cartId;

            const checkQuery = `
                SELECT id
                FROM booking_req 
                WHERE artistId = ? AND cartitemid = ?`;
            const [existingRecord] = await conn.promise().query(checkQuery, [artistId, cartItemId]);


            const insertQuery = `
                    INSERT INTO booking_req (cartId, artistId, cartitemid, qty, travelFee, status) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
            await conn.promise().query(insertQuery, [cartId, artistId, cartItemId, qty, travelFee, status]);

        }

        return res.status(200).json({ message: "Booking request status updated successfully." });
    } catch (err) {
        console.error("Error updating booking request status:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports.deleteBookingRequest = async (req, res) => {
    const { cartId, artistId } = req.body;

    if (!cartId || !artistId) {
        return res.status(400).json({ message: "cartId and artistId are required." });
    }

    try {
        // Check if the record exists
        const checkQuery = `SELECT id FROM booking_req WHERE cartId = ? AND artistId = ?`;
        const [existingRecords] = await conn.promise().query(checkQuery, [cartId, artistId]);

        if (existingRecords.length === 0) {
            return res.status(404).json({ message: "No booking request found with the provided cartId and artistId." });
        }

        // Delete the record
        const deleteQuery = `DELETE FROM booking_req WHERE cartId = ? AND artistId = ?`;
        await conn.promise().query(deleteQuery, [cartId, artistId]);

        return res.status(200).json({ message: "Booking request deleted successfully." });
    } catch (err) {
        console.error("Error deleting booking request:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


module.exports.assignBookingToArtist = async (req, res) => {
    const { bookingId, cartitem } = req.body;

    if (!bookingId) {
        return res.status(400).json({ message: "Booking ID and Status are required." });
    }

    try {
        const bookingQuery = `SELECT * FROM bookings WHERE id = ?`;
        const [bookingRows] = await conn.promise().query(bookingQuery, [bookingId]);

        if (bookingRows.length === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        if (cartitem && Array.isArray(cartitem) && cartitem.length > 0) {
            for (const item of cartitem) {
                const { id: cartItemId, assignedTo, travelFee, status } = item;

                const updateBookingItemQuery = `
                    UPDATE booking_item 
                    SET assignedTo = ?, status = ?, travelFee = ?
                    WHERE booking_id = ? AND cartitemId = ?`;
                await conn.promise().query(updateBookingItemQuery, [assignedTo, status, travelFee, bookingId, cartItemId]);
            }
        }

        res.status(200).json({
            status: "success",
            message: "Booking assignment updated in booking_item table.",
        });
    } catch (err) {
        console.error("Error updating booking_item table:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
};


// module.exports.assignCartItemToArtist = async (req, res) => {
//     const { userId, cartItemId } = req.body; // CartItemId and UserId passed in request body

//     if (!userId || !cartItemId) {
//         return res.status(400).json({ message: "User ID and Cart Item ID are required." });
//     }

//     try {
//         // Step 1: Fetch user address (for geocode)
//         const userQuery = `
//             SELECT ua.geocode, ua.state, ua.city, ua.street
//             FROM useraddresses ua
//             WHERE ua.userid = ?`;
//         const [userRows] = await conn.promise().query(userQuery, [userId]);

//         if (userRows.length === 0) {
//             return res.status(404).json({ message: "User address not found." });
//         }
//         const userAddress = userRows[0];
//         if (!userAddress.geocode) {
//             return res.status(400).json({ message: "User geocode not found. Cannot calculate distance." });
//         }
//         const [userLat, userLng] = userAddress.geocode.split(',');

//         // Step 2: Fetch artist addresses (for geocode and state)
//         const artistQuery = `
//             SELECT a.id AS artistId, aa.geocode, aa.state
//             FROM artists a
//             JOIN useraddresses aa ON a.id = aa.userid
//         `;
//         const [artistRows] = await conn.promise().query(artistQuery);

//         if (artistRows.length === 0) {
//             return res.status(404).json({ message: "No artists found." });
//         }

//         // Step 3: Find nearest artist
//         let nearestArtistId = null;
//         let nearestArtistDistance = Infinity;

//         for (let artist of artistRows) {
//             if (artist.geocode) {
//                 const [artistLat, artistLng] = artist.geocode.split(',');
//                 try {
//                     const distance = await calculateDistanceWithGoogle(userLat, userLng, artistLat, artistLng);
//                     if (distance < nearestArtistDistance) {
//                         nearestArtistDistance = distance;
//                         nearestArtistId = artist.artistId;
//                     }
//                 } catch (error) {
//                     console.error(`Error calculating distance for artist ${artist.artistId}: ${error.message}`);
//                 }
//             } else if (artist.state === userAddress.state) {
//                 console.log(`Artist ${artist.artistId} is in the same state (${artist.state}) as the user.`);
//             }
//         }

//         if (!nearestArtistId) {
//             return res.status(404).json({ message: "No valid artist addresses found for distance calculation." });
//         }

//         // Step 4: Fetch the specific cart item to assign
//         const cartItemQuery = `
//             SELECT * FROM usercart WHERE id = ? AND userId = ? AND isActive = 1
//         `;
//         const [cartItems] = await conn.promise().query(cartItemQuery, [cartItemId, userId]);

//         if (cartItems.length === 0) {
//             return res.status(404).json({ message: "Cart item not found or already assigned." });
//         }

//         const cartItem = cartItems[0];
//         const cartId = cartItem.cartId;
//         const updateCartTimeQuery = `
//             UPDATE cartitems
//             SET assignedTo = ?
//             WHERE cartId = ?
//         `;
//         await conn.promise().query(updateCartTimeQuery, [nearestArtistId, cartItemId]);


//         // Step 7: Return success response
//         res.status(200).json({
//             status: "success",
//             message: `Cart item ${cartItemId} has been assigned to artist ${nearestArtistId}`,
//             nearestArtistId,
//             bookingStatus: 'assigned',
//             bookingDate: new Date().toISOString()
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };



// module.exports.addArtistToCartItems = async (req, res) => {
//     const { userId, artistId } = req.body;

//     try {
//         // Fetch user address
//         const userQuery = `SELECT address FROM users WHERE id = ?`;
//         const [userRows] = await conn.promise().query(userQuery, [userId]);
//         if (userRows.length === 0) {
//             return res.status(404).json({ message: "User address not found." });
//         }
//         const userAddress = userRows[0].address;

//         // Fetch artist address
//         const artistQuery = `SELECT address FROM artists WHERE id = ?`;
//         const [artistRows] = await conn.promise().query(artistQuery, [artistId]);
//         if (artistRows.length === 0) {
//             return res.status(404).json({ message: "Artist address not found." });
//         }
//         const artistAddress = artistRows[0].address;

//         // Convert addresses to lat/lon (Mock example, replace with real geocoding API)
//         const userLatLon = { lat: 40.7128, lon: -74.0060 }; // Example lat/lon for user's address
//         const artistLatLon = { lat: 40.7306, lon: -73.9352 }; // Example lat/lon for artist's address

//         // Calculate one cart item distance
//         const oneCarItemTotalDistance = calculateDistance(
//             userLatLon.lat,
//             userLatLon.lon,
//             artistLatLon.lat,
//             artistLatLon.lon
//         );

//         // Calculate traveler fee
//         const travelerFee = calculateTravelerFee(oneCarItemTotalDistance);

//         // Fetch cart items for the user
//         const cartItemsQuery = `
//             SELECT id FROM cartitems 
//             WHERE cartId IN (
//                 SELECT id FROM usercart WHERE userId = ?
//             )`;
//         const [cartItems] = await conn.promise().query(cartItemsQuery, [userId]);

//         if (cartItems.length === 0) {
//             return res.status(404).json({ message: "No cart items found for the user." });
//         }

//         // Update each cart item with artistId and travelerFee
//         const updateCartItemQuery = `
//             UPDATE cartitems 
//             SET artistId = ?, travelerFee = ? 
//             WHERE id = ?`;

//         for (const cartItem of cartItems) {
//             await conn.promise().query(updateCartItemQuery, [artistId, travelerFee, cartItem.id]);
//         }

//         res.status(200).json({
//             status: "success",
//             message: "Artist and traveler fee added to cart items.",
//             cartItemsUpdated: cartItems.length,
//             travelerFee: travelerFee,
//             oneCarItemTotalDistance: oneCarItemTotalDistance.toFixed(2) + " miles",
//         });
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ error: "Internal Server Error" });
//     }
// };