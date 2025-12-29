const getOtpService = require("../services/getOtpService");

module.exports.getOtpController = async (req, res) => {
  try {
    const response = await getOtpService.GetOtp(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};