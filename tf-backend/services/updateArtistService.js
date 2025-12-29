const conn = require('../connection/database');
var moment = require('moment');
const { v4: uuidv4 } = require('uuid');

module.exports.UpdateArtist = async (req, res) => {
    const {
        id,
        firstName,
        lastName,
        email,
        address,
        geocode,
        city,
        state,
        businessType,
        images,
        licenceUrl,
        videoUrl,
        sin,
        facebook,
        profileImage,
        instagram,
        mobile,
        countryCode,
    } = req.body;
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    try {
        // var otp = generateOtp();
        console.log(req.body);

        var otp = 1111;
        const rawQuery =
            mobile !== 'null' && mobile != ''
                ? `Update artists set firstName =  "${firstName}", profileImage =  "${profileImage}", lastName =  "${lastName}", email = "${email || null
                }", address =  "${address}", lastUpdatedOn = "${dateTime}", geocode = "${geocode || null}", city =  "${city || null
                }", state = "${state || null}", businessType = "${businessType || null}", licenceUrl = "${licenceUrl || null
                }", sin = "${sin || null}", facebook = "${facebook || null}", instagram = "${instagram || null}", videoUrl = "${videoUrl || null
                }", mobile = "${mobile}", countryCode = "${countryCode}" where id = "${id}"; `
                : `Update artists set firstName =  "${firstName}", lastName =  "${lastName}", email = "${email || null
                }", address =  "${address}", lastUpdatedOn = "${dateTime}", geocode = "${geocode || null}", city =  "${city || null
                }", state = "${state || null}", businessType = "${businessType || null}", licenceUrl = "${licenceUrl || null
                }", sin = "${sin || null}", facebook = "${facebook || null}", instagram = "${instagram || null}", videoUrl = "${videoUrl || null
                }" where id = "${id}" ;`;
        console.log(rawQuery);
        conn.query(rawQuery, async (err, rows) => {
            if (err) {
                res.status(500).json({ error: err });
            } else {
                if (videoUrl) {
                    const artistQuery = `Update artists set isVideoUploaded=1 where id = "${id}" `;
                    await conn.promise().query(artistQuery);
                }
                if (images && Array.isArray(images) && images.length > 0) {
                    const imageQuery = `DELETE FROM artistsdata where artistId = "${id}" `;
                    await conn.promise().query(imageQuery);
                    for (const image of images) {
                        const uniqueID = uuidv4();
                        const imageQuery = `INSERT INTO artistsdata (id, artistId, type, url, createdAt) VALUES ("${uniqueID.toString()}","${id}","image","${image}","${dateTime || null
                            }")`;
                        await conn.promise().query(imageQuery);
                    }
                }
                res.status(200).json({ status: 'success', message: 'Artist information updated successfully.' });
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.toString() });
    }
};

module.exports.UpdateArtistVideo = async (req, res) => {
    const { id, videos } = req.body;
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    try {
        console.log(req.body);
        for (const video of videos) {
            const uniqueID = uuidv4();
            const imageQuery = `INSERT INTO artistsdata (id, artistId, type, url, createdAt) VALUES ("${uniqueID.toString()}","${id}","video","${video}","${dateTime || null
                }")`;
            await conn.promise().query(imageQuery);
        }
        if (videos) {
            const artistQuery = `Update artists set isVideoUploaded=1, videoUrl="${videos[0]}" where id = "${id}" `;
            await conn.promise().query(artistQuery);
        }
        res.status(200).json({ status: 'success', message: 'Artist information updated successfully.' });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.toString() });
    }
};


module.exports.DeleteUsers = async (req, res) => {
    const {
        id,
        mobile,
        userType,
    } = req.body;
    const dateTime = moment().format('YYYY-MM-DD HH:mm:ss');
    try {
        console.log(req.body);
        if (userType === 1) {
            const rawQuery = `Update artists set mobile = "${mobile}000" where id = "${id}" ;`;
            conn.query(rawQuery, async (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err });
                } else {
                    res.status(200).json({ status: 'success', message: 'Artist information deleted successfully.' });
                }
            });
        }

        if (userType === 2) {
            const rawQuery = `Update users set phone = "${mobile}000" where id = "${id}" ;`;
            conn.query(rawQuery, async (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err });
                } else {
                    res.status(200).json({ status: 'success', message: 'Client information deleted successfully.' });
                }
            });
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.toString() });
    }
};
