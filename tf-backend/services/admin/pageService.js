const db = require('../../connection/knexdatabase');
const { v4: uuidv4 } = require("uuid");
const S3Service = require('../../connection/s3Service');
const s3Service = new S3Service();
const { uploadFileToS3, deleteFileFromS3 } = require('../../connection/s3ServiceImg');

module.exports.getPageDetails = async (req, res) => {
    try {
        const data = await db('pages').select('*');
        const pageData = await Promise.all(data);
        res.status(200).json({
            message: "Page fetched successfully.",
            data: pageData,
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
}

module.exports.updatePageDetails = async (req, res) => {
    try {
        const pageTitle = req.body.pageTitle;
        const pageDescription = req.body.pageDescription;

        const dataUpdated = await db('pages')
            .update({
                page_description: pageDescription
            })
            .where('page_name', pageTitle)
            .then(() => {
                //console.log('Insert or update was successful');
            })
            .catch(err => {
                console.error('Error:', err);
                throw err;
            });
        res.status(200).json({
            message: "Insert or update was successful",
            data: dataUpdated
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
}