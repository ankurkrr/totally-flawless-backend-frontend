const { v4: uuidv4 } = require("uuid");
const moment = require("moment");
const conn = require("../connection/database");
const S3Service = require("../connection/s3Service");
const { uploadFileToS3, deleteFileFromS3 } = require('../connection/s3ServiceImg');

const s3Service = new S3Service();
module.exports.CreateSignup = async (req, res) => {
    try {
        // Extract form data with trimming
        const {
            first_name = "",
            last_name = "",
            email = "",
            mobile = "",
            address = "", city = "", state = "", zipCode = "", lat = "", long = "",
            business_type = "",
            sin = "",
            countryCode = "",
            facebook = "",
            instagram = ""
        } = req.body;

        const uniqueID = uuidv4();
        const dateTime = moment().format("YYYY-MM-DD HH:mm:ss");

        const images = [];
        const videos = [];
        let licenceUrl = null;
        let profileImage = null;

        console.log("Uploaded files:", req.files);

        if (req.files && req.files.length > 0) {
            for (let file of req.files) {
                try {
                    const fileUrl = await uploadFileToS3(file);
                    console.log("Uploaded URL:", fileUrl);

                    if (file.fieldname === "images[]") {
                        images.push(fileUrl);
                    } else if (file.fieldname === "videos[]") {
                        videos.push(fileUrl);
                    } else if (file.fieldname === "licence") {
                        licenceUrl = fileUrl;
                    } else if (file.fieldname === "profileImage") {
                        profileImage = fileUrl;
                    }

                } catch (error) {
                    console.error("S3 Upload Error:", error);
                    return res.status(500).json({ error: "File upload failed" });
                }
            }
        }

        // Convert arrays to comma-separated strings or NULL
        const imagesString = images.length > 0 ? `"${images.join(",")}"` : "NULL";
        const videosString = videos.length > 0 ? `"${videos.join(",")}"` : "NULL";
        const licenceString = licenceUrl ? `"${licenceUrl}"` : "NULL";
        const profileImageString = profileImage ? `"${profileImage}"` : "NULL";

        // Ensure mobile and business_type are properly formatted and trimmed
        const mobileValue = mobile.trim() ? `"${mobile.trim()}"` : "NULL";
        const businessTypeValue = business_type.trim() ? `"${business_type.trim()}"` : "NULL";
        const sinValue = sin.trim() ? `"${sin.trim()}"` : "NULL";
        const facebookValue = facebook.trim() ? `"${facebook.trim()}"` : "NULL";
        const instagramValue = instagram.trim() ? `"${instagram.trim()}"` : "NULL";

        // Insert into database
        const rawQuery = `
          INSERT INTO artists (
            id, firstName, lastName, email, mobile, address, businessType,
            videoUrl, createdDate, sin, countryCode,facebook, instagram, licenceUrl, profileImage
          ) 
          VALUES (
          "${uniqueID}",
          "${first_name.trim()}",
          "${last_name.trim()}",
          "${email.trim()}",
          ${mobileValue},
          "${address.trim()}",
          ${businessTypeValue},
          ${videosString},
          "${dateTime}",
          ${sinValue},
          ${countryCode},
          ${facebookValue},
          ${instagramValue},
          ${licenceString},
          ${profileImageString})`;

        console.log("Executing SQL Query:", rawQuery);

        conn.query(rawQuery, (err) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            const uniqueAddressID = uuidv4();
            const addAddress = `INSERT INTO useraddresses (id, userid, street, city, state, pincode, isdefault, createddate, geocode) VALUES ( "${uniqueAddressID}", "${uniqueID}", "${address.trim()}", "${city}", "${state}", "${zipCode}", 1, "${dateTime}", "${lat},${long}")`;
            conn.query(addAddress, (err) => {
                if (err) {
                    return res.status(500).json({ error: err.message });
                }
            });

            // Insert images into artistsdata table if there are any images
            if (images.length > 0) {
                let imageQuery = `INSERT INTO artistsdata (id, artistId, type, url, createdAt) VALUES `;
                imageQuery += images
                    .map(image => `("${uuidv4()}","${uniqueID}","image","${image}","${dateTime}")`)
                    .join(",");

                conn.query(imageQuery, (err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }
                    res.status(200).json({
                        status: "success",
                        message: "Artist Signed up successfully.",
                        id: uniqueID,
                    });
                });
            } else {
                res.status(200).json({
                    status: "success",
                    message: "Artist Signed up successfully.",
                    id: uniqueID,
                });
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
};
