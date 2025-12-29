const db = require('../connection/knexdatabase');
const { v4: uuidv4 } = require("uuid");
const S3Service = require('../connection/s3Service');
const s3Service = new S3Service();
const { uploadFileToS3, deleteFileFromS3 } = require('../connection/s3ServiceImg');

module.exports.getGalleryByUserId = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "userId is required." });
        }
        const galleryItems = await db('gallery').where({ userId }).select('*');
        if (galleryItems.length === 0) {
            return res.status(404).json({ message: "No gallery items found for this user." });
        }

        res.status(200).json({
            message: "Gallery fetched successfully.",
            gallery: galleryItems,
        });

    } catch (err) {
        console.error("Error fetching gallery:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports.createGallery = async (req, res) => {
    try {
        const { userId, image } = req.body;

        const requiredFields = ["userId"];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    message: `${field} is required.`,
                });
            }
        }
        const galleryData = {
            userId: userId,
            image: image,
        };

        await db('gallery').insert(galleryData);

        res.status(201).json({
            message: "Gallery added successfully.",
            gallery: galleryData,
        });
    } catch (err) {
        console.error("Error adding user:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.deleteGallery = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "id is required." });
        }
        const galleryEntry = await db('gallery').where({ id: id }).first();
        if (!galleryEntry) {
            return res.status(404).json({ message: "Gallery item not found." });
        }
        if (galleryEntry.image) {
            await deleteFileFromS3(galleryEntry.image);
        }
        await db('gallery').where({ id: id }).del();
        res.status(200).json({ message: "Gallery item deleted successfully." });
    } catch (err) {
        console.error("Error deleting gallery item:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};
