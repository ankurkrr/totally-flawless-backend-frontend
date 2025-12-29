const cron = require("node-cron");
const db = require("../connection/knexdatabase");
const admin = require("../utils/firebaseInit");
const moment = require("moment");

const sendnotificationBookings = async () => {
    console.log(`[${new Date().toISOString()}] Checking for unpaid bookings to notify...`);
    const cronType = "unpaid_booking_notifications";

    try {
        const currentTime = new Date();

        const bookings = await db("bookings")
            .join("booking_item", "bookings.id", "booking_item.booking_id")
            .select(
                "bookings.id",
                "bookings.userId",
                "booking_item.bookingTime",
                "bookings.totalAmount",
                "bookings.amountPaid"
            )
            .where("bookings.amountPaid", "<", db.raw("bookings.totalAmount"))
            .where("bookings.status", "confirmed")
            .whereRaw("STR_TO_DATE(booking_item.bookingTime, '%Y-%m-%d, %h:%i %p') < ?", [currentTime])
            .whereNotExists(function () {
                this.select("pushnotifications.id")
                    .from("pushnotifications")
                    .whereRaw("pushnotifications.booking_id = bookings.id");
            });

        if (!bookings.length) {
            console.log("No unpaid bookings to notify.");

            await db("cron_jobs").insert({
                cronType,
                description: "No unpaid bookings to notify.",
                status: "success",
            });

            return;
        }

        console.log(`Found ${bookings.length} unpaid bookings:`);

        const userIds = bookings.map(booking => booking.userId);
        const userDeviceTokens = await db("devices")
            .select("userId", "deviceToken")
            .whereIn("userId", userIds);

        const deviceTokenMap = new Map(userDeviceTokens.map(d => [d.userId, d.deviceToken]));

        let notificationsSent = 0;

        for (const { id, userId, bookingTime, totalAmount, amountPaid } of bookings) {
            const remainingAmount = (totalAmount - amountPaid).toFixed(2);
            console.log(`➡ Processing Booking ID: ${id}, User ID: ${userId}, Booking Time: ${bookingTime}, Remaining Amount: $${remainingAmount}`);

            const deviceToken = deviceTokenMap.get(userId);
            if (deviceToken) {
                try {
                    await admin.messaging().send({
                        notification: {
                            title: "Booking Payment Reminder",
                            body: `The remaining amount ($${remainingAmount}) for the booking scheduled on ${bookingTime} is not paid. The booking will be cancelled if the amount is not paid.`,
                        },
                        token: deviceToken,
                    });

                    console.log(`Notification sent for Booking ID: ${id}`);

                    await db("pushnotifications").insert({
                        booking_id: id,
                        status: "sent",
                        created_at: db.fn.now(),
                    });

                    notificationsSent++;

                } catch (error) {
                    console.error(`Error sending notification for Booking ID ${id}:`, error);
                }
            } else {
                console.log(`No device token found for User ID: ${userId}`);
            }
        }

        console.log(`Notifications sent: ${notificationsSent}`);

        await db("cron_jobs").insert({
            cronType,
            description: `Sent ${notificationsSent} payment reminders.`,
            status: "success",
        });

    } catch (error) {
        console.error("Error processing unpaid bookings:", error);

        await db("cron_jobs").insert({
            cronType,
            description: `Error: ${error.message}`,
            status: "failed",
        });
    }
};
cron.schedule("*/10 * * * *", async () => {
    console.log("Running unpaid booking status update...");
    await sendnotificationBookings();
});

// ----------------------------------------------------------------------------
//booking cancelled

//single booking
// const cancelUnpaidBookings = async () => {
//     console.log(`[${new Date().toISOString()}] Checking for an unpaid booking to cancel...`);

//     try {
//         const currentTime = moment().toDate();

//         // Fetch only the first unpaid booking
//         const bookingToCancel = await db("bookings")
//             .join("booking_item", "bookings.id", "booking_item.booking_id")
//             .select("bookings.id", "bookings.userId", "booking_item.bookingTime", "bookings.totalAmount", "bookings.amountPaid")
//             .where("bookings.amountPaid", "<", db.raw("bookings.totalAmount")) // Unpaid booking
//             .where("bookings.status", "confirmed") // Only confirmed bookings
//             .whereRaw("STR_TO_DATE(booking_item.bookingTime, '%Y-%m-%d, %h:%i %p') < ?",
//                 [moment(currentTime).subtract(10, "minutes").format("YYYY-MM-DD HH:mm:ss")])
//             .first(); // Get only the first booking

//         if (!bookingToCancel) {
//             console.log("No unpaid booking to cancel.");
//             return;
//         }

//         console.log(`Cancelling Booking ID: ${bookingToCancel.id}, User ID: ${bookingToCancel.userId}`);

//         // Cancel booking in the database
//         await db("bookings")
//             .where("id", bookingToCancel.id)
//             .update({
//                 status: "cancelled",
//             });
//         await db("booking_item")
//             .where("booking_id", bookingToCancel.id)
//             .update({
//                 status: "cancelled",
//             });


//         console.log(`Cancelled Booking ID: ${bookingToCancel.id}`);

//         // Fetch the user's device token
//         const userDevice = await db("devices")
//             .select("deviceToken")
//             .where("userId", bookingToCancel.userId)
//             .first(); // Get only one device token

//         if (userDevice && userDevice.deviceToken) {
//             try {
//                 await admin.messaging().send({
//                     notification: {
//                         title: "Booking Cancelled",
//                         body: `Your booking is cancelled due to delay in the payment of the balance amount for the booking scheduled on ${bookingToCancel.bookingTime}`,
//                     },
//                     token: userDevice.deviceToken,
//                 });

//                 console.log(`Notification sent for Booking ID: ${bookingToCancel.id}`);
//             } catch (error) {
//                 console.error(`Error sending notification for Booking ID ${bookingToCancel.id}:`, error);
//             }
//         } else {
//             console.log(`No device token found for User ID: ${bookingToCancel.userId}`);
//         }

//     } catch (error) {
//         console.error("Error cancelling unpaid booking:", error);
//     }
// };

//mulitple bookgin
const cancelUnpaidBookings = async () => {
    console.log(`[${new Date().toISOString()}] Checking for unpaid bookings to cancel...`);
    const cronType = "cancel_unpaid_bookings";

    try {
        const currentTime = moment().toDate();

        const bookingsToCancel = await db("bookings")
            .join("booking_item", "bookings.id", "booking_item.booking_id")
            .select("bookings.id", "bookings.userId", "booking_item.bookingTime", "bookings.totalAmount", "bookings.amountPaid")
            .where("bookings.amountPaid", "<", db.raw("bookings.totalAmount"))
            .where("bookings.status", "confirmed")
            .whereRaw("STR_TO_DATE(booking_item.bookingTime, '%Y-%m-%d, %h:%i %p') < ?", [
                moment(currentTime).subtract(10, "minutes").format("YYYY-MM-DD HH:mm:ss")
            ]);

        if (!bookingsToCancel.length) {
            console.log("No unpaid bookings to cancel.");
            await db("cron_jobs").insert({
                cronType,
                description: "No unpaid bookings found for cancellation.",
                status: "success",
            });
            return;
        }

        console.log(`Found ${bookingsToCancel.length} unpaid bookings to cancel.`);

        const bookingIds = bookingsToCancel.map(booking => booking.id);
        const userIds = bookingsToCancel.map(booking => booking.userId);

        console.log("Booking IDs to cancel:", bookingIds);
        console.log("User IDs:", userIds);

        await db("bookings")
            .whereIn("id", bookingIds)
            .update({
                status: "cancelled",
                updatedAt: db.fn.now(),
            });

        await db("booking_item")
            .whereIn("booking_id", bookingIds)
            .update({
                status: "cancelled",
                updated_at: db.fn.now(),
            });

        console.log(`Cancelled ${bookingsToCancel.length} bookings.`);

        const userDeviceTokens = await db("devices")
            .select("userId", "deviceToken")
            .whereIn("userId", userIds);

        const deviceTokenMap = new Map(userDeviceTokens.map(d => [d.userId, d.deviceToken]));

        let notificationsSent = 0;
        let notificationErrors = 0;

        for (const { id, userId, bookingTime } of bookingsToCancel) {
            const deviceToken = deviceTokenMap.get(userId);

            if (deviceToken) {
                try {
                    await admin.messaging().send({
                        notification: {
                            title: "Booking Cancelled",
                            body: `Your booking is cancelled due to delay in the payment of the balance amount for the booking scheduled on ${bookingTime}.`,
                        },
                        token: deviceToken,
                    });

                    console.log(`Notification sent for Booking ID: ${id}`);
                    notificationsSent++;
                } catch (error) {
                    console.error(`Error sending notification for Booking ID ${id}:`, error);
                    notificationErrors++;
                }
            } else {
                console.log(`No device token found for User ID: ${userId}`);
            }
        }

        await db("cron_jobs").insert({
            cronType,
            description: `Cancelled ${bookingsToCancel.length} bookings. Notifications sent: ${notificationsSent}, Errors: ${notificationErrors}.`,
            status: "success",
        });

    } catch (error) {
        console.error("Error cancelling unpaid bookings:", error);

        await db("cron_jobs").insert({
            cronType,
            description: `Error: ${error.message}`,
            status: "failed",
        });
    }
};

cron.schedule("*/30 * * * *", async () => {
    console.log("Running unpaid booking status update...");
    await cancelUnpaidBookings();
});

// ----------------------------------------------------------------------------
//delete artist

const deleteOldArtists = async () => {
    console.log(`[${new Date().toISOString()}] Running artist cleanup cron job...`);
    const cronType = "delete_old_artists";

    try {
        const cutoffTime = moment().subtract(1, "days").set({ hour: 22, minute: 0, second: 0 }).format("YYYY-MM-DD HH:mm:ss");

        console.log(`Deleting artists created before: ${cutoffTime}`);

        const artistsToDelete = await db("artists")
            .select("id")
            .whereNull("firstName")
            .whereNull("lastName")
            .whereNull("businessType")
            .where("createdDate", "<", cutoffTime);

        if (!artistsToDelete.length) {
            console.log("No artists found for deletion.");
            await db("cron_jobs").insert({
                cronType,
                description: "No artists found for deletion",
                status: "success",
            });
            return;
        }

        const artistIds = artistsToDelete.map(artist => artist.id);
        console.log(`Artists to be deleted (IDs): ${artistIds.join(", ")}`);

        await db("artists").whereIn("id", artistIds).del();

        console.log(`Deleted ${artistIds.length} artists.`);

        await db("cron_jobs").insert({
            cronType,
            description: `Deleted artists: ${artistIds.join(", ")}`,
            status: "success",
        });

    } catch (error) {
        console.error("Error deleting old artists:", error);

        await db("cron_jobs").insert({
            cronType,
            description: `Error: ${error.message}`,
            status: "failed",
        });
    }
};

// Schedule the cron job to run **every day at 12:00 AM (midnight)**
cron.schedule("0 0 * * *", async () => {
    console.log("Running artist cleanup cron job...");
    await deleteOldArtists();
});


// ----------------------------------------------------------------------------
//delete user

const deleteOldUser = async () => {
    console.log(`[${new Date().toISOString()}] Running user cleanup cron job...`);
    const cronType = "delete_users";

    try {
        const cutoffTime = moment()
            .subtract(1, "days")
            .set({ hour: 22, minute: 0, second: 0 })
            .format("YYYY-MM-DD HH:mm:ss");

        console.log(`Deleting users created before: ${cutoffTime}`);

        const usersToDelete = await db("users")
            .select("id")
            .whereNull("firstName")
            .whereNull("lastName")
            .whereNull("email")
            .where("createdDate", "<", cutoffTime);

        if (!usersToDelete.length) {
            console.log("No users found for deletion.");
            await db("cron_jobs").insert({
                cronType,
                description: "No users found for deletion",
                status: "success",
            });
            return;
        }

        const userIds = usersToDelete.map(user => user.id);
        console.log(`Users to be deleted (IDs): ${userIds.join(", ")}`);

        await db("users").whereIn("id", userIds).del();

        console.log(`Deleted ${userIds.length} users.`);

        await db("cron_jobs").insert({
            cronType,
            // description: `Deleted ${userIds.length} users.`,
            description: `Deleted users: ${userIds.join(", ")}`,
            status: "success",
        });

    } catch (error) {
        console.error("Error deleting old users:", error);

        await db("cron_jobs").insert({
            cronType,
            description: `Error: ${error.message}`,
            status: "failed",
        });
    }
};

// Schedule the cron job to run **every day at 12:00 AM (midnight)**
cron.schedule("0 0 * * *", async () => {
    console.log("Running user cleanup cron job...");
    await deleteOldUser();
});

// ----------------------------------------------------------------------------
//chat delete

const deleteOldChats = async () => {
    console.log(`[${new Date().toISOString()}] Running chat cleanup cron job...`);
    const cronType = "delete_chats";

    try {
        const cutoffTime = moment()
            .subtract(48, "hours")
            .format("YYYY-MM-DD HH:mm:ss");

        console.log(`Checking completed bookings before: ${cutoffTime}`);

        const completedBookings = await db("bookings")
            .select("id", "userId")
            .where("status", "completed")
            .where("updatedAt", "<", cutoffTime);

        if (!completedBookings.length) {
            console.log("No completed bookings found for chat cleanup.");
            await db("cron_jobs").insert({
                cronType,
                description: "No completed bookings found for chat cleanup.",
                status: "success",
            });
            return;
        }

        console.log(`Found ${completedBookings.length} completed bookings for chat cleanup.`);

        let deletedChats = 0;

        for (const booking of completedBookings) {
            const { id: bookingId, userId } = booking;

            const artists = await db("booking_item")
                .select("artistId")
                .where("booking_id", bookingId);

            if (!artists.length) {
                console.log(`No artist found for booking ID: ${bookingId}`);
                continue;
            }

            for (const artist of artists) {
                const artistId = artist.artistId;

                console.log(`Deleting chat for Booking ID: ${bookingId}, User ID: ${userId}, and Artist ID: ${artistId}`);

                const deleted = await db("chat")
                    .where((builder) =>
                        builder
                            .where("senderId", userId)
                            .where("receiverId", artistId)
                    )
                    .orWhere((builder) =>
                        builder
                            .where("senderId", artistId)
                            .where("receiverId", userId)
                    )
                    .del();

                deletedChats += deleted;
            }
        }

        console.log(`Chat cleanup completed. Total chats deleted: ${deletedChats}`);

        await db("cron_jobs").insert({
            cronType,
            description: `Deleted ${deletedChats} chats.`,
            status: "success",
        });

    } catch (error) {
        console.error("Error deleting old chats:", error);

        await db("cron_jobs").insert({
            cronType,
            description: `Error: ${error.message}`,
            status: "failed",
        });
    }
};

cron.schedule("0 0 * * *", async () => {
    console.log("Running unpaid booking status update...");
    await deleteOldChats();
});

// ----------------------------------------------------------------------------
// Key Rotation Cron Jobs (Tier-based automatic rotation)
// See: cron/keyRotationCron.js for implementation
require('./keyRotationCron');

// module.exports = { sendnotificationBookings };
