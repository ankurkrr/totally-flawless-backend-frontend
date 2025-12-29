const db = require('../../connection/knexdatabase');
const { v4: uuidv4 } = require("uuid");

module.exports.getAllBooking = async (req, res) => {
    try {
        let { page, pageSize, status, search, startDate, endDate } = req.query;
        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 10;

        const offset = (page - 1) * pageSize;

        if (startDate) startDate = new Date(startDate);
        if (endDate) endDate = new Date(endDate);

        let query = db("bookings")
            .leftJoin("users", "bookings.userId", "users.id")
            .select(
                "bookings.*",
                "users.firstName",
                "users.lastName",
                "users.email"
            )
            .orderBy("bookings.createdAt", "desc");

        if (status) {
            query = query.where("bookings.status", status);
        }

        if (search) {
            query = query.where((builder) => {
                builder
                    .whereRaw("CONCAT(users.firstName, ' ', users.lastName) LIKE ?", [`%${search}%`])
                    .orWhere("users.firstName", "like", `%${search}%`)
                    .orWhere("users.lastName", "like", `%${search}%`)
                    .orWhere("users.email", "like", `%${search}%`);
            });
        }

        if (startDate && endDate) {
            if (startDate.toISOString().split("T")[0] === endDate.toISOString().split("T")[0]) {
                query.whereRaw("DATE(bookings.createdAt) = ?", [startDate.toISOString().split("T")[0]]);
            } else {
                endDate.setHours(23, 59, 59, 999);

                query.where("bookings.createdAt", ">=", startDate);
                query.where("bookings.createdAt", "<=", endDate);
            }
        } else if (startDate) {
            query.whereRaw("DATE(bookings.createdAt) = ?", [startDate.toISOString().split("T")[0]]);
        } else if (endDate) {
            query.where("bookings.createdAt", "<=", endDate);
        }

        const totalRecordsResult = await query.clone().clearSelect().count("* as total").first();
        const totalRecords = totalRecordsResult?.total || 0;
        const totalPages = Math.ceil(totalRecords / pageSize);

        const bookings = await query.limit(pageSize).offset(offset);

        if (bookings.length === 0) {
            return res.status(200).json({ message: "No bookings found.", bookings: [], totalPages });
        }

        const bookingDetails = await Promise.all(
            bookings.map(async (booking) => {
                const userDetails = await db("users").where("id", booking.userId).first();
                const userCart = await db("usercart").where("id", booking.cartId).first();
                const userAddress = userCart ? await db("useraddresses").where("id", userCart.addressId).first() : null;
                const bookingItems = await db("booking_item").where("booking_id", booking.id).select("*");

                let totalTravelFee = 0;
                let totalGratuity = 0;
                const artistIds = [...new Set(bookingItems.map(item => item.artistId).filter(Boolean))];

                let artistDetails = {};
                if (artistIds.length > 0) {
                    const artists = await db("artists").whereIn("id", artistIds).select("*");
                    artistDetails = artists.reduce((acc, artist) => {
                        acc[artist.id] = artist;
                        return acc;
                    }, {});
                }

                const categorizedBookingItems = { now: [], later: [] };
                bookingItems.forEach(item => {
                    totalTravelFee += Number(item.travelFee || 0);
                    totalGratuity += Number(item.gratuity || 0);

                    const itemData = {
                        ...item,
                        artistDetails: artistDetails[item.artistId] || null,
                    };

                    if (item.bookingType === "now") {
                        categorizedBookingItems.now.push(itemData);
                    } else {
                        categorizedBookingItems.later.push(itemData);
                    }
                });

                return {
                    id: booking.id,
                    userId: booking.userId,
                    createdAt: booking.createdAt,
                    updatedAt: booking.updatedAt,
                    cartId: booking.cartId,
                    assignedTo: booking.assignedTo || null,
                    amountPaid: booking.amountPaid,
                    travelFee: booking.travelFee,
                    transactionId: booking.transactionId,
                    totalAmount: booking.totalAmount,
                    status: booking.status,
                    firstName: booking.firstName || "",
                    lastName: booking.lastName || "",
                    email: booking.email || "",
                    userDetails: userDetails || {},
                    userCart: userCart || {},
                    userAddress: userAddress || {},
                    bookingItems: categorizedBookingItems,
                    totalTravelFee: totalTravelFee.toFixed(2),
                    totalGratuity: totalGratuity.toFixed(2),
                };
            })
        );

        res.status(200).json({
            message: "Bookings retrieved successfully.",
            bookings: bookingDetails,
            pagination: {
                currentPage: page,
                pageSize,
                totalRecords,
                totalPages,
            },
        });
    } catch (err) {
        console.error("Error retrieving bookings:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await db("bookings").where("id", id).first();

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found.",
            });
        }

        const userDetails = await db("users").where("id", booking.userId).select("*");
        const usercart = await db("usercart").where("id", booking.cartId).first();
        const useraddress = await db("useraddresses").where("id", usercart?.addressId).first();
        const bookingItems = await db("booking_item").where("booking_id", id).select("*");

        let totalTravelFee = 0;
        let totalGratuity = 0;

        const artistIds = [...new Set(bookingItems.map(item => item.artistId).filter(Boolean))];

        let artistDetails = {};
        if (artistIds.length > 0) {
            const artists = await db("artists").whereIn("id", artistIds).select("*");
            artistDetails = artists.reduce((acc, artist) => {
                acc[artist.id] = artist;
                return acc;
            }, {});
        }

        const updatedBookingItems = bookingItems.map(item => {
            totalTravelFee += parseFloat(item.travelFee || 0);
            totalGratuity += parseFloat(item.gratuity || 0);

            return {
                ...item,
                artistDetails: artistDetails[item.artistId] || null,
            };
        });

        res.status(200).json({
            message: "Booking retrieved successfully.",
            booking: {
                ...booking,
                userDetails,
                useraddress,
                usercart,
                bookingItems: updatedBookingItems,
                totalTravelFee: totalTravelFee.toFixed(2),
                totalGratuity: totalGratuity.toFixed(2),
            },
        });
    } catch (err) {
        console.error("Error retrieving booking details:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId, status } = req.body;

        if (!bookingId || !status) {
            return res.status(400).json({
                message: "Booking ID and status are required."
            });
        }

        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'accepted'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status provided."
            });
        }

        const updatedBooking = await db('bookings')
            .where('id', bookingId)
            .update({
                status: status,
                updatedAt: new Date()
            });

        if (updatedBooking === 0) {
            return res.status(404).json({
                message: "Booking not found."
            });
        }

        const updatedBookingData = await db('bookings')
            .where('id', bookingId)
            .first();

        const { cartId, ...bookingData } = updatedBookingData;
        const cartData = await db('usercart').where('id', cartId).first();
        const cartimes = await db('cartitems').where('cartId', cartId).select('*');

        const later = cartimes.filter(cartime => cartime.bookingType === 'later');
        const now = cartimes.filter(cartime => cartime.bookingType === 'now');

        cartData.later = later;
        cartData.now = now;

        res.status(200).json({
            message: "Booking status updated successfully.",
            booking: {
                ...bookingData,
                cartData,
            },
        });
    } catch (err) {
        console.error("Error updating booking status:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.getAllTrainingBooking = async (req, res) => {
    try {
        let { page, pageSize, status, search, startDate, endDate } = req.query;
        page = parseInt(page) || 1;
        pageSize = parseInt(pageSize) || 10;

        const offset = (page - 1) * pageSize;
        const formatDate = (date) => new Date(date).toISOString().split("T")[0];

        // if (startDate) startDate = new Date(startDate);
        // if (endDate) endDate = new Date(endDate);

        let query = db("training_service")
            .leftJoin("users", "training_service.user_id", "users.id")
            .join("training_payment", "training_service.id", "training_payment.training_id")
            .leftJoin("services", "training_service.service_id", "services.id")
            .select(
                "training_service.*",
                "services.name as service_name",
                "services.imgUrl as service_image",
                "users.firstName",
                "users.lastName",
                "users.email"
            )
            .where("training_payment.status", 'paid')
            .orderBy("training_service.created_at", "desc");

        if (status) {
            query = query.where("training_service.status", status);
        }

        if (search) {
            query = query.where((builder) => {
                builder
                    .whereRaw("CONCAT(users.firstName, ' ', users.lastName) LIKE ?", [`%${search}%`])
                    .orWhere("users.firstName", "like", `%${search}%`)
                    .orWhere("users.lastName", "like", `%${search}%`)
                    .orWhere("users.email", "like", `%${search}%`);
            });
        }

        if (startDate && endDate) {
            query.whereBetween('training_service.training_date', [startDate, endDate]);
            // console.log(query.toSQL(), startDate, endDate);
            // query.whereBetween(
            //     db.raw("DATE(CONVERT_TZ(training_service.training_date, '+00:00', '+05:30'))"),
            //     [startDate, endDate]
            // );
        }

        const totalRecordsResult = await query.clone().clearSelect().count("* as total").first();
        const totalRecords = totalRecordsResult?.total || 0;
        const totalPages = Math.ceil(totalRecords / pageSize);

        const bookings = await query.limit(pageSize).offset(offset);

        if (bookings.length === 0) {
            return res.status(200).json({ message: "No bookings found.", data: [], totalPages });
        }

        // const bookingDetails = await Promise.all(
        //     bookings.map(async (booking) => {
        //         const userDetails = await db("users").where("id", booking.userId).first();
        //         const userCart = await db("usercart").where("id", booking.cartId).first();
        //         const userAddress = userCart ? await db("useraddresses").where("id", userCart.addressId).first() : null;
        //         const bookingItems = await db("booking_item").where("booking_id", booking.id).select("*");

        //         let totalTravelFee = 0;
        //         let totalGratuity = 0;
        //         const artistIds = [...new Set(bookingItems.map(item => item.artistId).filter(Boolean))];

        //         let artistDetails = {};
        //         if (artistIds.length > 0) {
        //             const artists = await db("artists").whereIn("id", artistIds).select("*");
        //             artistDetails = artists.reduce((acc, artist) => {
        //                 acc[artist.id] = artist;
        //                 return acc;
        //             }, {});
        //         }

        //         const categorizedBookingItems = { now: [], later: [] };
        //         bookingItems.forEach(item => {
        //             totalTravelFee += Number(item.travelFee || 0);
        //             totalGratuity += Number(item.gratuity || 0);

        //             const itemData = {
        //                 ...item,
        //                 artistDetails: artistDetails[item.artistId] || null,
        //             };

        //             if (item.bookingType === "now") {
        //                 categorizedBookingItems.now.push(itemData);
        //             } else {
        //                 categorizedBookingItems.later.push(itemData);
        //             }
        //         });

        //         return {
        //             id: booking.id,
        //             userId: booking.userId,
        //             createdAt: booking.createdAt,
        //             updatedAt: booking.updatedAt,
        //             cartId: booking.cartId,
        //             assignedTo: booking.assignedTo || null,
        //             amountPaid: booking.amountPaid,
        //             travelFee: booking.travelFee,
        //             transactionId: booking.transactionId,
        //             totalAmount: booking.totalAmount,
        //             status: booking.status,
        //             firstName: booking.firstName || "",
        //             lastName: booking.lastName || "",
        //             email: booking.email || "",
        //             userDetails: userDetails || {},
        //             userCart: userCart || {},
        //             userAddress: userAddress || {},
        //             bookingItems: categorizedBookingItems,
        //             totalTravelFee: totalTravelFee.toFixed(2),
        //             totalGratuity: totalGratuity.toFixed(2),
        //         };
        //     })
        // );

        res.status(200).json({
            message: "Bookings retrieved successfully.",
            data: bookings,
            pagination: {
                currentPage: page,
                pageSize,
                totalRecords,
                totalPages,
            },
        });
    } catch (err) {
        console.error("Error retrieving bookings:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports.updateTrainingBooking = async (req, res) => {
    try {
        const { bookingId, status } = req.body;

        if (!bookingId || !status) {
            return res.status(400).json({
                message: "Booking ID and status are required."
            });
        }

        const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'accepted'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid status provided."
            });
        }

        const updatedBooking = await db('training_service')
            .where('id', bookingId)
            .update({
                status: status,
                updated_at: new Date()
            });

        if (updatedBooking === 0) {
            return res.status(404).json({ message: "Booking not found." });
        }

        res.status(200).json({
            message: "Trainig Booking status updated successfully.",
            booking: [],
        });
    } catch (err) {
        console.error("Error updating booking status:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};
