const getCategoriesWithServicesService = require("../services/getCategoriesWithServicesService");

module.exports.getCategoriesWithServicesController = async (req, res) => {
  try {
    const response = await getCategoriesWithServicesService.GetServices(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};