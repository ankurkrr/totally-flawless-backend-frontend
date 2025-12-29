const getPricesForService = require("../services/getPricesForService");

module.exports.getPricesForServiceController = async (req, res) => {
  try {
    const response = await getPricesForService.GetPrices(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};