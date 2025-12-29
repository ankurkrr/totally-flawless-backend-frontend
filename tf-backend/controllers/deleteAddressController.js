const deleteAddressService = require("../services/deleteAddressService");

module.exports.deleteAddressController = async (req, res) => {
  try {
    const response = await deleteAddressService.DeleteAddress(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};