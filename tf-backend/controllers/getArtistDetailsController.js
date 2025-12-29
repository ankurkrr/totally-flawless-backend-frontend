const getArtistDetailsService = require('../services/getArtistDetailsService');

module.exports.getArtistDetailsController = async (req, res) => {
    try {
        const response = await getArtistDetailsService.GetArtistDetails(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.GetArtistBookingsController = async (req, res) => {
    try {
        const response = await getArtistDetailsService.GetArtistBookings(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.artistChangeBookingStatusController = async (req, res) => {
    try {
        const response = await getArtistDetailsService.artistChangeBookingStatus(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.GetCurrentBookingsForArtistController = async (req, res) => {
    try {
        const response = await getArtistDetailsService.GetCurrentBookingsForArtist(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.ArtistApproveController = async (req, res) => {
    try {
        const response = await getArtistDetailsService.ArtistApprove(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};
module.exports.ArtistAvailableController = async (req, res) => {
    try {
        const response = await getArtistDetailsService.ArtistAvailable(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};






