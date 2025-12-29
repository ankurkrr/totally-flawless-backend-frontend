const pageService = require('../../services/admin/pageService');


module.exports.getPageController = async (req, res) => {
    try {
        const response = await pageService.getPageDetails(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.updatePageController = async (req, res) => {
    try {
        const response = await pageService.updatePageDetails(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};