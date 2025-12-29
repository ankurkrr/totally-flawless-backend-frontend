const AuthService = require('../../services/admin/authService');

module.exports.AuthController = async (req, res) => {
    try {
        const response = await AuthService.AuthLogin(req, res);
        return response;
    } catch (err) {
        console.error(err);
    }
};

module.exports.AdminUpdatePasswordController = async (req, res) => {
    try {
        const response = await AuthService.updatePassword(req, res);
        return response;
    } catch (err) {
        console.error(err);
    }
};


module.exports.getProfileController = async (req, res) => {
    try {
        const response = await AuthService.getProfile(req, res);
        return response;
    } catch (err) {
        console.error(err);
    }
};

module.exports.updateProfileController = async (req, res) => {
    try {
        const response = await AuthService.updateProfile(req, res);
        return response;
    } catch (err) {
        console.error(err);
    }
};

module.exports.getProfileByMobile = async (req, res) => {
    try {
        const response = await AuthService.getProfileByMobile(req, res);
        return response;
    } catch (err) {
        console.error(err);
    }
};

module.exports.forgotPassword = async (req, res) => {
    try {
        const response = await AuthService.forgotPassword(req, res);
        return response;
    } catch (err) {
        console.error(err);
    }
};



