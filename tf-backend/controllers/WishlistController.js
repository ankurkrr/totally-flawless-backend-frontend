const WishlistService = require('../services/WishlistService');

module.exports.AddWishlistController = async (req, res) => {
  try {
    const response = await WishlistService.AddWishlist(req, res);
    return response;
  } catch (err) {
    res.status(500).json({ err });
  }
};

module.exports.GetWishlistController = async (req, res) => {
  try {
    const response = await WishlistService.GetWishlist(req, res);
    return response;
  } catch (err) {
    res.status(500).json({ err });
  }
};

module.exports.RemoveWishlistController = async (req, res) => {
  try {
    const response = await WishlistService.RemoveWishlist(req, res);
    return response;
  } catch (err) {
    res.status(500).json({ err });
  }
};

module.exports.ContactSendMainController = async (req, res) => {
  try {
    const response = await WishlistService.ContactSendMain(req, res);
    return response;
  } catch (err) {
    res.status(500).json({ err });
  }
};


