const userService = require('../../services/admin/userService');

module.exports.admingetAllUsersController = async (req, res) => {
    try {
        const response = await userService.getAllUsers(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admingetUserByIdController = async (req, res) => {
    try {
        const response = await userService.getUserById(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.adminaddUserController = async (req, res) => {
    try {
        const response = await userService.addUser(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.adminupdateUserController = async (req, res) => {
    try {
        const response = await userService.updateUser(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admindeleteUserController = async (req, res) => {
    try {
        const response = await userService.deleteUser(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};

module.exports.admingetServiceStaticController = async (req, res) => {
    try {
        const response = await userService.getServiceStatic(req, res);
        return res.status(200).json(response);
    } catch (err) {
        console.error(err);
    }
};





