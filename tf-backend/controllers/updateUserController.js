const updateUserService = require("../services/updateUserService");

module.exports.updateUserController = async (req, res) => {
  try {
    const response = await updateUserService.UpdateUser(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};

module.exports.updateUserGratuityController = async (req, res) => {
  try {
    const response = await updateUserService.UpdateUserGratuity(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};