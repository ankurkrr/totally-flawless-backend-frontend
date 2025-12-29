const bookingService = require('../../services/admin/bookingService');

module.exports.admingetAllBookingController = async (req, res) => {
    try {
        const response = await bookingService.getAllBooking(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admingetBookingByIdController = async (req, res) => {
    try {
        const response = await bookingService.getBookingById(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.adminupdateBookingStatusController = async (req, res) => {
    try {
        const response = await bookingService.updateBookingStatus(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.getAllTrainingBookingController = async (req, res) => {
    try {
        const response = await bookingService.getAllTrainingBooking(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.updateTrainingBookingController = async (req, res) => {
    try {
        const response = await bookingService.updateTrainingBooking(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};


