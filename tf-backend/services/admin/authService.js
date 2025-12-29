const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const knex = require('../connection/knexdatabase');
const db = require('../../connection/knexdatabase');
const KeyProvider = require('../../utils/keyProvider');

module.exports.AuthLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ status: 0, message: 'Email and password are required' });
    }

    try {
        const admin = await db('admins').where({ email }).first();

        if (!admin) {
            return res.status(404).json({ status: 0, message: 'Admin not found' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(401).json({ status: 0, message: 'Invalid credentials' });
        }

        // Get JWT secret from KeyProvider (supports dynamic key management)
        const jwtSecret = await KeyProvider.getJWTSecret();
        const payload = { id: admin.id, email: admin.email };
        const token = jwt.sign(payload, jwtSecret, { expiresIn: '7d' });

        return res.status(200).json({
            status: 1,
            message: 'Successfully logged in',
            data: {
                _id: admin.id,
                name: admin.name || 'Unknown',
                email: admin.email,
                accessToken: token,
            },
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: 0, message: 'An error occurred:' + err.message });
    }
};

module.exports.updatePassword = async (req, res) => {
    try {
        const { adminId, currentPassword, newPassword, confirmPassword } = req.body;

        // Validate required fields
        if (!adminId || !currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ status: 0, message: "All fields are required." });
        }

        // Check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ status: 0, message: "New password and confirm password do not match." });
        }

        // Fetch admin from the database
        const admin = await db("admins").where({ id: adminId }).first();
        if (!admin) {
            return res.status(404).json({ status: 0, message: "Admin not found." });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return res.status(401).json({ status: 0, message: "Current password is incorrect." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the database
        await db("admins").where({ id: adminId }).update({ password: hashedPassword });

        res.status(200).json({
            status: 1,
            message: "Password updated successfully.",
        });

    } catch (err) {
        console.error("Error updating password:", err);
        res.status(500).json({ status: 0, message: "Internal server error." });
    }
};

module.exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const [user] = await db('admins').where({ id: userId });

        if (!user) {
            return res.status(404).json({ status: 0, message: 'User not found' });
        }

        res.status(200).json({
            status: 1,
            message: 'Profile retrieved successfully',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 0, message: 'An error occurred: ' + err.message });
    }
};

module.exports.updateProfile = async (req, res) => {
    try {
        const id = req.params.id;
        const { name, email, mobile } = req.body;

        if (!name || !email) {
            return res.status(400).json({ status: 0, message: 'Name and email are required' });
        }

        const [existingUser] = await db('admins').where({ id: id });
        if (!existingUser) {
            return res.status(404).json({ status: 0, message: 'User not found' });
        }

        await db('admins')
            .where({ id: id })
            .update({ name, email, mobile });

        res.status(200).json({
            status: 1,
            message: 'Profile updated successfully',
            data: { id: id, name, email },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 0, message: 'An error occurred: ' + err.message });
    }
};

module.exports.getProfileByMobile = async (req, res) => {
    try {
        const { mobile } = req.body;
        const [user] = await db('admins').where({ mobile: mobile });

        if (!user) {
            return res.status(404).json({ status: 0, message: 'Admin user not found' });
        }

        res.status(200).json({
            status: 1,
            message: 'Profile retrieved successfully',
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 0, message: 'An error occurred: ' + err.message });
    }
};

module.exports.forgotPassword = async (req, res) => {
    try {
        const { adminId, newPassword, confirmPassword } = req.body;

        // Validate required fields
        if (!adminId || !newPassword || !confirmPassword) {
            return res.status(400).json({ status: 0, message: "All fields are required." });
        }

        // Check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ status: 0, message: "New password and confirm password do not match." });
        }

        // Fetch admin from the database
        const admin = await db("admins").where({ id: adminId }).first();
        if (!admin) {
            return res.status(404).json({ status: 0, message: "Admin not found." });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password in the database
        await db("admins").where({ id: adminId }).update({ password: hashedPassword });

        res.status(200).json({
            status: 1,
            message: "Password updated successfully.",
        });

    } catch (err) {
        console.error("Error updating password:", err);
        res.status(500).json({ status: 0, message: "Internal server error." });
    }
};
