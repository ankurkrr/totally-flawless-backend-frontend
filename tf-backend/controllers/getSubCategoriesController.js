const getSubCategoriesService = require("../services/getSubCategoriesService");

module.exports.getSubCategoriesController = async (req, res) => {
  try {
    const response = await getSubCategoriesService.GetSubCategories(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};