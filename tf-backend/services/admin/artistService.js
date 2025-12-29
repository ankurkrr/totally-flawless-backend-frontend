const db = require('../../connection/knexdatabase');
const { v4: uuidv4 } = require("uuid");
const S3Service = require('../../connection/s3Service');
const s3Service = new S3Service();
const { uploadFileToS3, deleteFileFromS3 } = require('../../connection/s3ServiceImg');
const admin = require('../../utils/firebaseInit');

module.exports.getArtists = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || "";
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
        const businessType = req.query.businessType || "";
        const status = req.query.status || "";

        const commonFilter = (query) => {
            query.whereNotNull('firstName')
                .whereNotNull('lastName')
                .whereNotNull('businessType');
            if (search) {
                query.where(function () {
                    this.whereRaw('CONCAT(firstName, " ", lastName) LIKE ?', [`%${search}%`])
                        .orWhere('firstName', 'like', `%${search}%`)
                        .orWhere('lastName', 'like', `%${search}%`)
                        .orWhere('email', 'like', `%${search}%`)
                        .orWhere('mobile', 'like', `%${search}%`);
                });
            }

            if (businessType) {
                query.where('businessType', businessType);
            }

            if (status) {
                query.where('isApproved', status);
            }

            if (startDate && endDate) {
                const adjustedEndDate = new Date(endDate);
                adjustedEndDate.setHours(23, 59, 59, 999);
                query.whereBetween('createdDate', [startDate, adjustedEndDate]);
            } else if (startDate) {
                query.whereRaw('DATE(createdDate) = ?', [startDate.toISOString().split('T')[0]]);
            } else if (endDate) {
                query.where('createdDate', '<=', endDate);
            }

            return query;
        };

        let query = db('artists')
            .select(
                'artists.*',
            )
            .modify(commonFilter)
            .groupBy('artists.id')
            .orderBy('artists.createdDate', 'desc')
            .limit(limit)
            .offset(offset);

        const artists = await query;

        const artistsWithAddresses = await Promise.all(
            artists.map(async (artist) => {
                const address = await db('useraddresses')
                    .select('*')
                    .where('userid', artist.id)
                    .first();
                return { ...artist, address: address || null };
            })
        );

        const totalArtistsQuery = db('artists').count('* as total').modify(commonFilter);
        const totalArtists = await totalArtistsQuery.first();

        res.status(200).json({
            message: "Artists fetched successfully.",
            artists: artistsWithAddresses,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalArtists.total / limit),
                totalArtists: totalArtists.total,
                limit: limit
            }
        });
    } catch (err) {
        console.error("Error fetching artists:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.addArtists = async (req, res) => {
    try {
        const { firstName, lastName, email, mobile, address, businessType, videoUrl, countryCode, sin, facebook, instagram, licenceUrl, isApproved, addresses } = req.body;
        const files = req.files;
        const requiredFields = ["firstName", "email", "businessType", "mobile", "isApproved"];

        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    message: `${field} is required.`,
                });
            }
        }

        const artistId = uuidv4();

        const existingArtist = await db("artists")
            .select("id")
            .where("mobile", mobile)
            .first();

        if (existingArtist) {
            return res.status(400).json({
                message: "An artist with this mobile already exists.",
            });
        }

        let profileImageUrl = null;
        let uploadedImages = [];

        if (files && files.length > 0) {
            for (let file of files) {
                try {
                    const fileUrl = await uploadFileToS3(file);
                    if (file.fieldname === "profileImage") {
                        profileImageUrl = fileUrl;
                    } else {
                        uploadedImages.push({ id: uuidv4(), artistId, type: "image", url: fileUrl });
                    }
                } catch (error) {
                    console.error("S3 Upload Error:", error);
                    return res.status(500).json({ message: "File upload failed." });
                }
            }
        }

        const artistData = {
            id: artistId,
            firstName,
            lastName: lastName || null,
            email: email || null,
            mobile: mobile || null,
            address: address || null,
            businessType: businessType || null,
            sin: sin || null,
            videoUrl: videoUrl || null,
            countryCode: countryCode || null,
            isApproved: isApproved || 0,
            facebook: facebook || null,
            instagram: instagram || null,
            licenceUrl: licenceUrl || null,
            profileImage: profileImageUrl || null,
        };

        await db("artists").insert(artistData);

        if (uploadedImages.length > 0) {
            await db("artistsdata").insert(uploadedImages);
        }

        let parsedAddresses = [];
        if (addresses) {
            try {
                parsedAddresses = JSON.parse(addresses);
            } catch (err) {
                return res.status(400).json({ message: "Invalid addresses format." });
            }

            const newAddresses = parsedAddresses.map((address) => ({
                id: uuidv4(),
                userid: artistId,
                street: address.street || null,
                city: address.city || null,
                state: address.state || null,
                pincode: address.pincode || null,
                isdefault: address.isdefault || 0,
                geocode: address.geocode || null,
                createddate: new Date(),
            }));

            await db("useraddresses").insert(newAddresses);
        }

        const addedArtist = await db("artists").select("*").where("id", artistId).first();
        const addedAddresses = await db("useraddresses").select("*").where("userid", artistId);
        const addedImages = await db("artistsdata").select("id", "url").where("artistId", artistId);

        // Send response
        res.status(201).json({
            message: "Artist added successfully.",
            artist: addedArtist,
            images: addedImages,
            addresses: addedAddresses,
        });
    } catch (err) {
        console.error("Error adding artist:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.updateArtist = async (req, res) => {
    const artistId = req.params.id;
    const { firstName, lastName, email, mobile, address, businessType, videoUrl, sin, countryCode, facebook, instagram, licenceUrl, isApproved, addresses, level } = req.body;
    const file = req.file;

    try {
        const existingArtist = await db("artists")
            .select("*")
            .where("id", artistId)
            .first();

        if (!existingArtist) {
            return res.status(404).json({
                message: "Artist not found.",
            });
        }

        const artistData = {
            firstName: firstName || existingArtist.firstName,
            lastName: lastName || existingArtist.lastName,
            email: email || existingArtist.email,
            mobile: mobile || existingArtist.mobile,
            sin: sin || existingArtist.sin,
            address: address || existingArtist.address,
            businessType: businessType || existingArtist.businessType,
            videoUrl: videoUrl || existingArtist.videoUrl,
            countryCode: countryCode || existingArtist.countryCode,
            isApproved: isApproved !== undefined ? isApproved : existingArtist.isApproved ?? 0,
            facebook: facebook,
            instagram: instagram,
            licenceUrl: licenceUrl || existingArtist.licenceUrl,
            level: level
        };

        let profileImageUrl = existingArtist.profileImage;

        if (file) {
            const newProfileImageUrl = await uploadFileToS3(file);

            if (existingArtist.profileImage) {
                const oldKey = existingArtist.profileImage.split("/").pop();
                await deleteFileFromS3(oldKey);
            }

            profileImageUrl = newProfileImageUrl;
        }

        await db("artists")
            .where("id", artistId)
            .update({ ...artistData, profileImage: profileImageUrl });

        await db("useraddresses")
            .where("userid", artistId)
            .del();

        let newAddresses = [];

        if (addresses) {
            try {
                const parsedAddresses = Array.isArray(addresses) ? addresses : JSON.parse(addresses);

                newAddresses = parsedAddresses.map((address) => ({
                    id: uuidv4(),
                    userid: artistId,
                    street: address.street || null,
                    city: address.city || null,
                    state: address.state || null,
                    pincode: address.pincode || null,
                    isdefault: address.isdefault || 0,
                    geocode: address.geocode || null,
                    createddate: new Date(),
                }));

                await db("useraddresses").insert(newAddresses);
            } catch (error) {
                return res.status(400).json({ message: "Invalid addresses format." });
            }
        }

        res.status(200).json({
            message: "Artist updated successfully.",
            artist: { ...artistData, profileImage: profileImageUrl },
            addresses: newAddresses,
        });
    } catch (err) {
        console.error("Error updating artist:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.deleteArtist = async (req, res) => {
    const artistId = req.params.id;

    try {
        const artist = await db('artists')
            .select('*')
            .where('id', artistId)
            .first();

        if (!artist) {
            return res.status(404).json({
                message: "Artist not found.",
            });
        }
        const artistMedia = await db('artistsdata')
            .select('url')
            .where('artistId', artistId);

        for (const media of artistMedia) {
            await deleteFileFromS3(media.URL);
        }

        await db('artistsdata')
            .where('artistId', artistId)
            .del();

        const address = await db('useraddresses')
            .select('*')
            .where('userid', artistId)
            .first();

        if (address) {
            await db('useraddresses')
                .where('userid', artistId)
                .del();
        }

        await db('artists')
            .where('id', artistId)
            .del();

        res.status(200).json({
            message: "Artist deleted successfully.",
        });
    } catch (err) {
        console.error("Error deleting artist:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.getArtistById = async (req, res) => {
    const artistId = req.params.id;
    try {
        const artist = await db('artists')
            .select('*')
            .where('id', artistId)
            .first();

        if (!artist) {
            return res.status(404).json({ message: "Artist not found." });
        }

        const artistMedia = await db('artistsdata')
            .select('id', 'type', 'url')
            .where('artistId', artistId);

        const images = artistMedia.filter(media => media.type === 'image').map(media => ({
            id: media.id,
            URL: media.url
        }));
        // const videos = artistMedia.filter(media => media.type === 'video').map(media => media.url);

        // artist.profileImage = images.length > 0 ? images[0] : null;
        // artist.video = videos.length > 0 ? videos[0] : null;

        const addresses = await db('useraddresses')
            .select('*')
            .where('userid', artistId);

        res.status(200).json({
            message: "Artist fetched successfully.",
            artist: {
                ...artist,
                images: images,

            },
            addresses: addresses || [],
        });
    } catch (err) {
        console.error("Error fetching artist:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.approveArtist = async (req, res) => {
    const { artistId, status } = req.body;

    if (!artistId || typeof status !== "number") {
        return res.status(400).json({
            message: "Both artistId and status are required, and status must be a number.",
        });
    }

    try {
        const artist = await db('artists')
            .select('*')
            .where('id', artistId)
            .first();
        if (!artist) {
            return res.status(404).json({
                message: "Artist not found.",
            });
        }
        await db('artists')
            .update({ isApproved: status })
            .where('id', artistId);

        const device = await db("devices")
            .select("deviceType", "deviceToken", "deviceId")
            .where("userId", artistId)
            .first();

        if (!device || !device.deviceToken) {
            return res.status(200).json({
                message: "Artist approval status updated, but no device found for notification.",
                artistId,
                isApproved: status,
            });
        }
        const message = {
            token: device.deviceToken,
            notification: {
                title: "Approval Status Update",
                body: status === 1 ? "Your request for registration has been approved .You can now accept the bookings" : "Your request for registration has been declined .Kindly contact the admin for more details",
            },
            data: {
                artistId: String(artistId),
                isApproved: String(status),
            },
        };

        try {
            await admin.messaging().send(message);
        } catch (firebaseError) {
            console.error("Error sending push notification:", firebaseError);
        }


        res.status(200).json({
            message: `Artist approval status updated successfully.`,
            artistId: artistId,
            isApproved: status,
        });
    } catch (error) {
        console.error("Error updating artist approval status:", error.message);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};


module.exports.addArtistImages = async (req, res) => {
    const { artistId } = req.body;
    const files = req.files;

    try {
        const artistExists = await db("artists")
            .select("id")
            .where("id", artistId)
            .first();

        if (!artistExists) {
            return res.status(404).json({
                message: "Artist not found.",
            });
        }

        if (!files || files.length === 0) {
            return res.status(400).json({
                message: "No images uploaded.",
            });
        }

        let uploadedImages = [];

        for (let file of files) {
            try {
                const fileUrl = await uploadFileToS3(file);
                uploadedImages.push({
                    id: uuidv4(),
                    artistId,
                    type: "image",
                    url: fileUrl,
                });
            } catch (error) {
                console.error("S3 Upload Error:", error);
                return res.status(500).json({ message: "File upload failed." });
            }
        }

        await db("artistsdata").insert(uploadedImages);

        const addedImages = await db("artistsdata").select("id", "url").where("artistId", artistId);

        res.status(201).json({
            message: "Images added successfully.",
            images: addedImages,
        });
    } catch (err) {
        console.error("Error adding artist images:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};
module.exports.deleteArtistImage = async (req, res) => {
    const id = req.params.id;

    try {
        const artist = await db('artistsdata')
            .select('*')
            .where('id', id)
            .first();

        if (!artist) {
            return res.status(404).json({
                message: "Image record not found.",
            });
        }
        const artistMedia = await db('artistsdata')
            .select('url')
            .where('id', id);

        for (const media of artistMedia) {
            await deleteFileFromS3(media.URL);
        }

        await db('artistsdata')
            .where('id', id)
            .del();

        res.status(200).json({
            message: "Image deleted successfully.",
        });
    } catch (err) {
        console.error("Error deleting artist:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};