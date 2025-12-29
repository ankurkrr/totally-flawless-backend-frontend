const DiviceService = require("../services/DeviceService");

module.exports.DivicesController = async (req, res) => {
    try {
        const response = await DiviceService.Divice(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};


module.exports.DivicesCallController = async (req, res) => {
    try {
        const response = await DiviceService.DivicesCallController(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.DivicesGetCallController = async (req, res) => {
    try {
        const response = await DiviceService.DivicesGetCallController(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};
