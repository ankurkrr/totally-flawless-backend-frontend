const trainingService = require('../services/trainingService');

module.exports.AddtrainingController = async (req, res) => {
    try {
        const response = await trainingService.AddtrainingService(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};

module.exports.GetTrainingController = async (req, res) => {
    try {
        const response = await trainingService.GetTrainingController(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};

module.exports.AddtrainingServicePaymentController = async (req, res) => {
    try {
        const response = await trainingService.AddtrainingServicePayment(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};

module.exports.AddTrainingServiceGetPaymentController = async (req, res) => {
    try {
        const response = await trainingService.AddTrainingServiceGetPaymentController(req, res);
        return response;
    } catch (err) {
        res.status(500).json({ err });
    }
};

