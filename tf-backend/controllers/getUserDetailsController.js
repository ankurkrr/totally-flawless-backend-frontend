/**
 * @fileoverview Get User Details Controller
 * @description Handles requests to retrieve user profile information
 * @module controllers/getUserDetailsController
 * @version 1.0.0
 */

const getUserDetailsService = require("../services/getUserDetailsService");

/**
 * @function getUserDetailsController
 * @description Retrieves authenticated user's profile details
 * @param {Object} req - Express request object
 * @param {string} req.user.id - Authenticated user ID from JWT token
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 * @throws {Error} If user not authenticated or database error
 */
module.exports.getUserDetailsController = async (req, res) => {
  try {
    const response = await getUserDetailsService.GetUserDetails(req, res);
    return response;
  } catch (err) {
    console.error('Error in getUserDetailsController:', err);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch user details' 
    });
  }
};