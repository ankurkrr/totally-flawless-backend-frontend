const getArtistOtpService = require("../services/getArtistOtpService");

module.exports.getArtistOtpController = async (req, res) => {
  try {
    const response = await getArtistOtpService.GetOtp(req, res);
    return response;
  } catch (err) {
    throw err;
  }
};