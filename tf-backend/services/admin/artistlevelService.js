const db = require('../../connection/knexdatabase');

module.exports.updateArtistLevels = async (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const artistLevels = req.body;

            if (!Array.isArray(artistLevels) || artistLevels.length === 0) {
                return reject({ message: "Invalid request. Expected a non-empty array." });
            }

            for (const level of artistLevels) {
                const { artistleveleid, name, description } = level;

                if (!artistleveleid || !name || !description) {
                    return reject({ message: "Each artist level must have artistleveleid, name, and description." });
                }

                await db("artistlevels")
                    .where({ id: artistleveleid })
                    .update({
                        name,
                        description,
                    });
            }

            resolve({
                message: "Artist levels updated successfully.",
            });

        } catch (err) {
            console.error("Error updating artist levels:", err);
            reject({ message: "Internal server error." });
        }
    });
};

module.exports.updateAppVersion = async (req) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { id } = req.params;
            const { androidversion, iosversion } = req.body;

            if (!id) {
                return reject({ message: "App version ID is required." });
            }
            if (!androidversion && !iosversion) {
                return reject({ message: "At least one field (androidversion or iosversion) must be provided." });
            }

            const updateData = { updated_at: new Date() };
            if (androidversion) updateData.android_version = androidversion;
            if (iosversion) updateData.ios_version = iosversion;
            const updated = await db("app_version")
                .where({ id: id })
                .update(updateData);

            if (!updated) {
                return reject({ message: "App version not found or no changes applied." });
            }

            resolve({
                message: "App version updated successfully.",
            });

        } catch (err) {
            console.error("Error updating app version:", err);
            reject({ message: "Internal server error." });
        }
    });
};

module.exports.getArtistlevel = async (req, res) => {
    try {

        const artistlevel = await db("artistlevels")
            .select("id", "name", "description")
            ;

        res.status(200).json({
            message: "Artistlevel retrieved successfully.",
            artistlevel,
        });
    } catch (err) {
        console.error("Error fetching Artistlevel:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};

module.exports.getAppVersion = async (req, res) => {
    try {

        const appversion = await db("app_version")
            .select("id", "android_version", "ios_version")
            ;

        res.status(200).json({
            message: "appversion retrieved successfully.",
            appversion,
        });
    } catch (err) {
        console.error("Error fetching appversion:", err);
        res.status(500).json({ message: "Internal server error." });
    }
};

