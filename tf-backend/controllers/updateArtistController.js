const updateArtistService = require('../services/updateArtistService');

module.exports.updateArtistController = async (req, res) => {
    try {
        const response = await updateArtistService.UpdateArtist(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.updateArtistVideoController = async (req, res) => {
    try {
        const response = await updateArtistService.UpdateArtistVideo(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

/**
 * @function deleteUserController
 * @description Delete user account (soft delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
module.exports.deleteUserController = async (req, res) => {
    try {
        const response = await updateArtistService.DeleteUsers(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

// Legacy export for backward compatibility
module.exports.DeleteUsers = module.exports.deleteUserController;