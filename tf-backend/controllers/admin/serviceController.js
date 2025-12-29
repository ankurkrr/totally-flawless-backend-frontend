const serviceService = require('../../services/admin/serviceService');

module.exports.admingetAllServiceController = async (req, res) => {
    try {
        const response = await serviceService.getAllService(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admingetServiceByIdController = async (req, res) => {
    try {
        const response = await serviceService.getServiceById(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};
module.exports.admingetServiceByCategoryidController = async (req, res) => {
    try {
        const response = await serviceService.getServiceByCategoryid(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};


module.exports.admincreateOrUpdateServiceController = async (req, res) => {
    try {
        const response = await serviceService.createOrUpdateService(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admindeleteServiceController = async (req, res) => {
    try {
        const response = await serviceService.deleteService(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

//sub service
module.exports.admincreateOrUpdateSubServiceController = async (req, res) => {
    try {
        const response = await serviceService.createOrUpdateSubService(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admindeleteSubServiceController = async (req, res) => {
    try {
        const response = await serviceService.deleteSubService(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admingetSubServicesByServiceIdController = async (req, res) => {
    try {
        const response = await serviceService.getSubServicesByServiceId(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};


