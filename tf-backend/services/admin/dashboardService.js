const db = require('../../connection/knexdatabase');

module.exports.getCount = async (req, res) => {
    try {
        const totalBookingCount = await db("bookings").count("id as count").first();
        const totalArtistCount = await db("artists").whereNotNull("firstName").whereNotNull("lastName").whereNotNull("businessType").count("id as count").first();
        const totalUserCount = await db("users").whereNotNull("firstName").whereNotNull("lastName").whereNotNull("email").count("id as count").first();
        const totalServiceCount = await db("services").count("id as count").first();

        const bookingStatusCounts = await db("bookings")
            .select("status")
            .count("id as count")
            .groupBy("status");

        const bookingCountsByStatus = {};
        bookingStatusCounts.forEach(row => {
            bookingCountsByStatus[row.status] = row.count;
        });

        res.status(200).json({
            message: "Counts retrieved successfully.",
            totalBookingCount: totalBookingCount.count || 0,
            totalArtistCount: totalArtistCount.count || 0,
            totalUserCount: totalUserCount.count || 0,
            totalServiceCount: totalServiceCount.count || 0,
            bookingCountsByStatus
        });
    } catch (err) {
        console.error("Error retrieving counts:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};
