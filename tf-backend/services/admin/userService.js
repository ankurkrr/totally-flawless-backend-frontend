const db = require('../../connection/knexdatabase');
const { v4: uuidv4 } = require("uuid");
const S3Service = require('../../connection/s3Service');
const s3Service = new S3Service();
const { uploadFileToS3, deleteFileFromS3 } = require('../../connection/s3ServiceImg');

module.exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
        const search = req.query.search || "";
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

        const commonFilter = (query) => {
            query.whereNotNull('firstName')
                .whereNotNull('lastName')
                .whereNotNull('email');
            if (search) {
                query.where(function () {
                    this.whereRaw('CONCAT(firstName, " ", lastName) LIKE ?', [`%${search}%`])
                        .orWhere('firstName', 'like', `%${search}%`)
                        .orWhere('lastName', 'like', `%${search}%`)
                        .orWhere('phone', 'like', `%${search}%`)
                        .orWhere('email', 'like', `%${search}%`);
                });
            }

            if (startDate && endDate) {
                if (startDate.toISOString().split('T')[0] === endDate.toISOString().split('T')[0]) {
                    query.where('createdDate', '>=', startDate);
                    query.where('createdDate', '<', new Date(new Date(startDate).setDate(startDate.getDate() + 1)));
                } else {
                    const adjustedEndDate = new Date(endDate);
                    adjustedEndDate.setHours(23, 59, 59, 999);

                    query.where('createdDate', '>=', startDate);
                    query.where('createdDate', '<=', adjustedEndDate);
                }
            } else if (startDate) {
                query.whereRaw('DATE(createdDate) = ?', [startDate.toISOString().split('T')[0]]);
            } else if (endDate) {
                query.where('createdDate', '<=', endDate);
            }

            return query;
        };

        let query = db('users')
            .select('*')
            .orderBy('createdDate', 'desc')
            .limit(limit)
            .offset(offset);

        query = commonFilter(query);

        const users = await query;

        const usersWithAddresses = await Promise.all(users.map(async (user) => {
            const address = await db('useraddresses')
                .select('*')
                .where('userid', user.id)
                .first();
            return {
                ...user,
                address: address || null,
            };
        }));

        const totalUsersQuery = db('users').count('* as total');
        commonFilter(totalUsersQuery);

        const totalUsers = await totalUsersQuery.first();

        res.status(200).json({
            message: "Users fetched successfully.",
            users: usersWithAddresses,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalUsers.total / limit),
                totalUsers: totalUsers.total,
                limit: limit
            }
        });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.getUserById = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await db('users')
            .select('*')
            .where('id', userId)
            .first();

        if (!user) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        const addresses = await db('useraddresses')
            .select('*')
            .where('userid', userId);

        res.status(200).json({
            message: "User fetched successfully.",
            user: user,
            addresses: addresses || [],
        });
    } catch (err) {
        console.error("Error fetching user:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.addUser = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, countryCode, addresses } = req.body;
        const file = req.file;

        const requiredFields = ["firstName", "email", "phone"];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    message: `${field} is required.`,
                });
            }
        }

        const userId = uuidv4();

        const existingUser = await db('users')
            .select('id')
            .where('phone', phone)
            .first();

        if (existingUser) {
            return res.status(400).json({
                message: "A user with this phone already exists.",
            });
        }

        let profileImageUrl = null;
        if (file) {
            profileImageUrl = await uploadFileToS3(file);
        }

        const userData = {
            id: userId,
            firstName,
            lastName: lastName || null,
            email,
            phone,
            profileImage: profileImageUrl,
            countryCode: countryCode || null,
        };

        await db('users').insert(userData);

        let parsedAddresses = [];
        try {
            parsedAddresses = JSON.parse(addresses);
        } catch (err) {
            return res.status(400).json({ message: "Invalid addresses format." });
        }

        const newAddresses = parsedAddresses.map(address => ({
            id: uuidv4(),
            userid: userData.id,
            street: address.street,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            isdefault: address.isdefault,
            geocode: address.geocode,
            createddate: new Date(),
        }));

        await db('useraddresses').insert(newAddresses);

        const addedUser = await db('users').select('*').where('id', userId).first();
        const addedAddresses = await db('useraddresses').select('*').where('userid', userId);

        res.status(201).json({
            message: "User added successfully.",
            user: addedUser,
            addresses: addedAddresses,
        });
    } catch (err) {
        console.error("Error adding user:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.updateUser = async (req, res) => {
    const userId = req.params.id;
    const { firstName, lastName, email, phone, address, countryCode } = req.body;
    const file = req.file;

    let addresses = [];
    try {
        addresses = JSON.parse(req.body.addresses);
    } catch (err) {
        return res.status(400).json({ message: "Invalid addresses format." });
    }

    try {
        const existingUser = await db('users')
            .select('*')
            .where('id', userId)
            .first();

        if (!existingUser) {
            return res.status(404).json({
                message: "User not found.",
            });
        }

        let profileImageUrl = existingUser.profileImage;
        if (file) {
            const newProfileImageUrl = await uploadFileToS3(file);

            if (existingUser.profileImage) {
                const oldKey = existingUser.profileImage.split('/').pop();
                await deleteFileFromS3(oldKey);
            }

            profileImageUrl = newProfileImageUrl;
        }

        const userData = {
            firstName: firstName || existingUser.firstName,
            lastName: lastName || existingUser.lastName,
            email: email || existingUser.email,
            phone: phone || existingUser.phone,
            address: address || existingUser.address,
            profileImage: profileImageUrl,
            countryCode: countryCode || existingUser.countryCode,
        };

        await db('users')
            .where('id', userId)
            .update(userData);

        await db('useraddresses')
            .where('userid', userId)
            .del();

        const newAddresses = addresses.map(address => ({
            id: uuidv4(),
            userid: userId,
            street: address.street,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
            isdefault: address.isdefault,
            geocode: address.geocode,
            createddate: new Date(),
        }));

        await db('useraddresses').insert(newAddresses);

        return res.status(200).json({
            message: "User updated successfully.",
            user: userData,
            address: newAddresses,
        });

    } catch (err) {
        console.error("Error updating user:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.deleteUser = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await db('users')
            .select('*')
            .where('id', userId)
            .first();

        if (!user) {
            return res.status(404).json({
                message: "user not found.",
            });
        }
        if (user.profileImage) {
            await deleteFileFromS3(user.profileImage);
        }
        const address = await db('useraddresses')
            .select('*')
            .where('userid', userId)
            .first();

        if (address) {
            await db('useraddresses')
                .where('userid', userId)
                .del();
        }

        await db('users')
            .where('id', userId)
            .del();

        res.status(200).json({
            message: "user deleted successfully.",
        });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};

module.exports.getServiceStatic = async (req, res) => {
    try {
        const name = req.query.name;

        const staticRecords = [
            {
                id: 1,
                Name: "Hair Styles",
            },
            {
                id: 2,
                Name: "Makeup Looks",
            },
            {
                id: 3,
                Name: "Both",
            }
        ];

        res.status(200).json({
            message: "Records fetched successfully.",
            records: staticRecords
        });
    } catch (err) {
        console.error("Error fetching records:", err);
        res.status(500).json({
            message: "Internal server error.",
        });
    }
};
