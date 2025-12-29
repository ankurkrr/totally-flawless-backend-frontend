const tokenService = require("../services/tokenService");

module.exports.tokenController = async (req, res) => {
  try {
    const response = await tokenService.CreateToken(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};