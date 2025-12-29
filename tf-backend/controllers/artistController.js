const artistService = require('../services/artistService');

class ArtistController {

    async createArtist(req, res) {
        try {
            const artistData = req.body;
            const result = await artistService.createArtist(artistData);
            return res.status(200).json(result);
        } catch (error) {
            console.error('ArtistController.createArtist Error:', error);
            const status = error.message.includes('required') ? 400 : 500;
            return res.status(status).json({ error: error.message });
        }
    }
}

const artistController = new ArtistController();
module.exports = {
    createArtist: artistController.createArtist.bind(artistController)
};
