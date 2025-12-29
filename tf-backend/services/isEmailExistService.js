const conn = require('../connection/database');

// Helper function to promisify conn.query
const executeQuery = (rawQuery) => {
    return new Promise((resolve, reject) => {
        conn.query(rawQuery, (err, rows) => {
            if (err) {
                return reject(err); // Reject the promise on error
            }
            resolve(rows); // Resolve with the rows
        });
    });
};

module.exports.IsEmailExist = async (req, res) => {
    try {
        const { emailId, phone } = req.query;

        var message = '';
        var isEmailExist = false;
        var isPhoneExist = false;
        var data = [];

        // Check if emailId exists
        if (emailId) {
            const rawQuery = `SELECT * FROM artists WHERE email = '${emailId}'`;
            const rows = await executeQuery(rawQuery); // Wait for the query to finish

            if (rows.length > 0) {
                data = JSON.parse(JSON.stringify(rows));
                isEmailExist = true;
            }
        }

        // Check if phone exists
        if (phone) {
            const rawPhoneQuery = `SELECT * FROM artists WHERE mobile = '${phone}'`;
            const rows = await executeQuery(rawPhoneQuery); // Wait for the query to finish

            if (rows.length > 0) {
                data = JSON.parse(JSON.stringify(rows));
                isPhoneExist = true;
            }
        }

        // Send the response after both queries are done
        res.status(200).json({ isEmailExist, isPhoneExist, data });
    } catch (err) {
        console.log('Error>>>>' + err);
        res.status(500).json({ message: err });
    }
};
