const addAddressesService = require("../services/addAddressesService");

module.exports.addAddressesController = async (req, res) => {
  try {
    const response = await addAddressesService.AddAddress(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};