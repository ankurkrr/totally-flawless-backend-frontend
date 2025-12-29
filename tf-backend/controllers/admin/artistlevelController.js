const artistlevelService = require('../../services/admin/artistlevelService');

module.exports.adminupdateArtistLevelsController = async (req, res) => {
    try {
        const response = await artistlevelService.updateArtistLevels(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.adminupdateAppVersionController = async (req, res) => {
    try {
        const response = await artistlevelService.updateAppVersion(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admingetArtistlevelController = async (req, res) => {
    try {
        const response = await artistlevelService.getArtistlevel(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admingetAppVersionController = async (req, res) => {
    try {
        const response = await artistlevelService.getAppVersion(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};


