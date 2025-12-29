const reportService = require('../../services/admin/reportService');

module.exports.getAllBookingItemController = async (req, res) => {
    try {
        const response = await reportService.getAllBookingItem(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.updateArtistPaymentStatusController = async (req, res) => {
    try {
        const response = await reportService.updateArtistPaymentStatus(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.getTotalBookingFee = async (req, res) => {
    try {
        const response = await reportService.getTotalBookingFee(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};


