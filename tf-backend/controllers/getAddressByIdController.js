const getAddressByIdService = require('../services/getAddressbyIdService');

module.exports.getAddressByIdController = async (req, res) => {
    try {
        const response = await getAddressByIdService.GetAddressById(req, res);
        return response;
    } catch (err) {
        throw err;
    }
}