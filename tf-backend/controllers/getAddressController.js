const getAddressService = require("../services/getAddressService");

module.exports.getAddressController = async (req, res) => {
    try {
        const response = await getAddressService.GetAddress(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.getUserToArtistLocationController = async (req, res) => {
    try {
        const response = await getAddressService.getUserToArtistLocation(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.artistBookingStatusController = async (req, res) => {
    try {
        const response = await getAddressService.artistBookingStatus(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.deleteBookingRequestController = async (req, res) => {
    try {
        const response = await getAddressService.deleteBookingRequest(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};


module.exports.assignBookingToArtistController = async (req, res) => {
    try {
        const response = await getAddressService.assignBookingToArtist(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};


module.exports.assignCartItemToArtistsController = async (req, res) => {
    try {
        const response = await getAddressService.assignCartItemToArtist(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};