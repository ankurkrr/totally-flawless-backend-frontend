const createSignupService = require("../services/createSignupService");

module.exports.createSignupController = async (req, res) => {
  try {
    const response = await createSignupService.CreateSignup(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};