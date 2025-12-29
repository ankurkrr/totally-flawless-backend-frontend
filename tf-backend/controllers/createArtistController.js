const createArtistService = require("../services/createArtistService");
const db = require('./../connection/knexdatabase');

module.exports.createArtistController = async (req, res) => {
    try {
        const response = await createArtistService.CreateArtist(req, res);
        return response;
    } catch (err) {
        throw err;
    }
};

module.exports.createArtistLocationController = async (req, res) => {
    try {
        const data = req.body;
        await db('artist_location').insert(data);
        res.status(200).json({
            message: `Artist last location updated successfully.`,
        })
    } catch (err) {
        res.status(400).json({
            message: err?.message || "somthing wrong data!!",
        })
        throw err;
    }
};

module.exports.getArtistLocationController = async (req, res) => {
    try {
        const data = req.params;
        var artistLocation;
        if (data?.id) {
            artistLocation = await db('artist_location')
                .select('*')
                .where('artist_id', data?.id)
                .orderBy('id', 'desc')
                .first();
        }
        res.status(200).json({
            message: `Artist last location get successfully.`,
            data: artistLocation || null,
        })
    } catch (err) {
        throw err;
    }
};
