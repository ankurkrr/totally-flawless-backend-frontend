const updateAddressService = require("../services/updateAddressService");

module.exports.updateAddressController = async (req, res) => {
  try {
    const response = await updateAddressService.UpdateAddress(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};