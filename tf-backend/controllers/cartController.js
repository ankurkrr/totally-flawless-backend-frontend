const cartService = require('../services/cartService');

class CartController {

    async getCart(req, res) {
        try {
            const userId = req.user.id || req.user.userId;
            const data = await cartService.getCart(userId);
            if (!data) {
                return res.status(200).json({ status: 'success', message: 'Cart not found!', data: [] });
            }
            return res.status(200).json({ status: 'success', data });
        } catch (error) {
            console.error('CartController.getCart Error:', error);
            return res.status(500).json({ error: error.message });
        }
    }

    /**
     * Dispatcher for legacy action-based cart operations.
     * Actions: 'A' (Add/Replace), 'U' (Update), 'D' (Delete items), 'C' (Clean/Deactivate)
     */
    async handleCartAction(req, res) {
        try {
            const userId = req.user.id || req.user.userId;
            const { actionType, ...data } = req.body;

            let result;
            if (actionType === 'A') {
                result = await cartService.replaceCart(userId, data);
            } else if (actionType === 'U') {
                result = await cartService.updateCart(userId, data);
            } else if (actionType === 'D') {
                result = await cartService.deleteCartItems(userId, data);
            } else if (actionType === 'C') {
                result = await cartService.deactivateCart(data.Id, userId); // note: 'Id' capitalized in original
            } else {
                return res.status(400).json({ status: 'error', message: 'Invalid or missing actionType' });
            }

            // Standardize success response based on old format
            // Old format: { status: 'success', message: '...', data: ... }
            const message = actionType === 'A' ? 'Added successfully.' :
                actionType === 'U' ? 'Updated successfully.' :
                    actionType === 'D' ? 'Cart updated successfully.' :
                        'Cart cleaned successfully.';

            return res.status(200).json({ status: 'success', message, data: result });

        } catch (error) {
            console.error('CartController.handleCartAction Error:', error);
            const status = error.message.includes('not found') ? 404 : 500;
            return res.status(status).json({ error: error.message });
        }
    }

    // TODO: move assignArtist logic here if part of Cart refactor
}

const cartController = new CartController();
module.exports = {
    getCart: cartController.getCart.bind(cartController),
    handleCartAction: cartController.handleCartAction.bind(cartController)
};
