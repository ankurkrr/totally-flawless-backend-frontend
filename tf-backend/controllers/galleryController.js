const galleryService = require('../services/galleryService');



module.exports.admingetGalleryByUserIdController = async (req, res) => {
    try {
        const response = await galleryService.getGalleryByUserId(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admincreateGalleryController = async (req, res) => {
    try {
        const response = await galleryService.createGallery(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admindeleteGalleryController = async (req, res) => {
    try {
        const response = await galleryService.deleteGallery(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};