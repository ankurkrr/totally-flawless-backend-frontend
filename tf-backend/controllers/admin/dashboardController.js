const dashboardService = require('../../services/admin/dashboardService');

module.exports.admingetCountController = async (req, res) => {
    try {
        const response = await dashboardService.getCount(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};