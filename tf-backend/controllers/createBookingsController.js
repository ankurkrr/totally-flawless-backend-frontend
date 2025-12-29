const createBookingService = require("../services/createBookingsService");

module.exports.createBookingController = async (req, res) => {
    try {
        const response = await createBookingService.CreateBooking(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.confirmBookingController = async (req, res) => {
    try {
        const response = await createBookingService.ConfirmBooking(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.CancelAndCompleteBookingController = async (req, res) => {
    try {
        const response = await createBookingService.CancelAndCompleteBooking(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};


