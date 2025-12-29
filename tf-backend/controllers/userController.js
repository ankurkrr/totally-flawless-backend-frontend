const userService = require('../services/userService');

/**
 * Controller to handle HTTP requests for User operations.
 * Acts as an interface between the Router and the Service layer.
 */
class UserController {

    /**
     * Handle user creation request.
     * @param {import('express').Request} req - Express request object.
     * @param {import('express').Response} res - Express response object.
     */
    async createUser(req, res) {
        try {
            // Extract data from request body
            const userData = req.body;

            // Call the service layer
            const result = await userService.createUser(userData);

            // Send response
            return res.status(200).json(result);

        } catch (error) {
            console.error('UserController.createUser Error:', error);

            if (error.message.includes("Missing required fields")) {
                return res.status(400).json({ error: error.message });
            }

            // Generic error
            return res.status(500).json({
                error: "An error occurred while creating the user.",
                details: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

// Export a singleton instance or just the class methods if preferred.
// Binding 'this' to methods to avoid context loss if passed as callbacks.
const userController = new UserController();
module.exports = {
    createUser: userController.createUser.bind(userController)
};
