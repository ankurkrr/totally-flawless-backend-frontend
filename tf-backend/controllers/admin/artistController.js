const artistService = require('../../services/admin/artistService');

module.exports.getArtistsController = async (req, res) => {
    try {
        const response = await artistService.getArtists(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
        // return res.status(500).json({ status: 0, message: 'An error occurred: ' + err.message });
    }
};

module.exports.addArtistsController = async (req, res) => {
    try {
        const response = await artistService.addArtists(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
        // return res.status(500).json({ status: 0, message: 'An error occurred: ' + err.message });
    }
};

module.exports.adminupdateArtistController = async (req, res) => {
    try {
        const response = await artistService.updateArtist(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
        // return res.status(500).json({ status: 0, message: 'An error occurred: ' + err.message });
    }
};

module.exports.admindeleteArtistController = async (req, res) => {
    try {
        const response = await artistService.deleteArtist(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
        // return res.status(500).json({ status: 0, message: 'An error occurred: ' + err.message });
    }
};

module.exports.adminaddArtistImagesController = async (req, res) => {
    try {
        const response = await artistService.addArtistImages(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
        // return res.status(500).json({ status: 0, message: 'An error occurred: ' + err.message });
    }
};


module.exports.admindeleteArtistImageController = async (req, res) => {
    try {
        const response = await artistService.deleteArtistImage(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
        // return res.status(500).json({ status: 0, message: 'An error occurred: ' + err.message });
    }
};

module.exports.admingetArtistByIdArtistController = async (req, res) => {
    try {
        const response = await artistService.getArtistById(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
        // return res.status(500).json({ status: 0, message: 'An error occurred: ' + err.message });
    }
};

module.exports.adminapproveArtistController = async (req, res) => {
    try {
        const response = await artistService.approveArtist(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
        // return res.status(500).json({ status: 0, message: 'An error occurred: ' + err.message });
    }
};



