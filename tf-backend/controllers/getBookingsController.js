const getBookingsService = require('../services/getBookingsService');

// Controller for fetching bookings based on userId
module.exports.getBookingsController = async (req, res) => {
    try {
        const response = await getBookingsService.GetBookings(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};

module.exports.getBookingsDataController = async (req, res) => {
    try {
        const response = await getBookingsService.GetBookingsData(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};

module.exports.AddGratuityController = async (req, res) => {
    try {
        const response = await getBookingsService.AddGratuity(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};


module.exports.AddRatingController = async (req, res) => {
    try {
        const response = await getBookingsService.AddRating(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};

module.exports.getTotalGratuityCategoryWiseController = async (req, res) => {
    try {
        const response = await getBookingsService.getTotalGratuityCategoryWise(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};

module.exports.UserDeleteUpcomingBookingController = async (req, res) => {
    try {
        const response = await getBookingsService.UserDeleteUpcomingBooking(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};
module.exports.UserCancelBookingController = async (req, res) => {
    try {
        const response = await getBookingsService.UserCancelBooking(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};



module.exports.getBookingtypeCountsController = async (req, res) => {
    try {
        const response = await getBookingsService.getBookingtypeCounts(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};

module.exports.bookingdetailsController = async (req, res) => {
    try {
        const response = await getBookingsService.bookingdetails(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};

