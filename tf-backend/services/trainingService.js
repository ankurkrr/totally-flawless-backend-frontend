require('dotenv').config();
const conn = require('../connection/database');

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports.AddtrainingService = async (req, res) => {
    const { user_id, service_id, price, training_date, training_time } = req.body;

    if (!user_id || !service_id || price === undefined || price === null) {
        return res.status(400).json({ error: 'user_id, service_id, and price are required' });
    }

    const priceRegex = /^\d+(\.\d{1,2})?$/;
    if (!priceRegex.test(price.toString())) {
        return res.status(400).json({ error: 'Price must be a valid number format (e.g., 52 or 23.20)' });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (training_date && !dateRegex.test(training_date)) {
        return res.status(400).json({ error: 'Invalid training date format. Use YYYY-MM-DD' });
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    if (training_time && !timeRegex.test(training_time)) {
        return res.status(400).json({ error: 'Invalid training time format. Use HH:MM or HH:MM:SS' });
    }

    try {
        const [serviceResult] = await conn.promise().query(
            'SELECT name FROM services WHERE id = ?',
            [service_id]
        );

        if (serviceResult.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        const serviceName = serviceResult[0].name;

        const insertQuery = `
            INSERT INTO training_service (
                user_id, service_id, service_name, price,
                training_date, training_time, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`;

        const [insertResult] = await conn.promise().query(insertQuery, [
            user_id,
            service_id,
            serviceName,
            price,
            training_date || null,
            training_time || null
        ]);

        const insertedId = insertResult.insertId;

        const [insertedData] = await conn.promise().query(
            'SELECT * FROM training_service WHERE id = ?',
            [insertedId]
        );

        return res.status(200).json({
            status: 'success',
            message: 'Training service added successfully',
            data: insertedData[0]
        });
    } catch (err) {
        console.error('Error adding training service:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports.GetTrainingController = async (req, res) => {
    const { user_id } = req.body;

    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required' });
    }

    try {
        const [serviceResult] = await conn.promise().query('SELECT ts.*, s.* FROM training_service ts JOIN users u ON ts.user_id = u.id JOIN services s ON ts.service_id = s.id WHERE ts.user_id = ?', [user_id]);

        if (serviceResult.length === 0) {
            return res.status(404).json({ error: 'Service not found' });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Training service list',
            data: serviceResult
        });
    } catch (err) {
        console.error('Error training service list:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports.AddtrainingServicePayment = async (req, res) => {
    const { training_id, user_id, payment_price, status } = req.body;

    if (!training_id || !payment_price || !status || !user_id) {
        return res.status(400).json({ error: 'training_id, payment_price, user_id, and status are required' });
    }

    const priceRegex = /^\d+(\.\d{1,2})?$/;
    if (!priceRegex.test(payment_price.toString())) {
        return res.status(400).json({ error: 'payment_price must be a valid number (e.g., 100 or 49.99)' });
    }

    try {
        const [trainingResult] = await conn.promise().query(
            'SELECT id FROM training_service WHERE id = ?',
            [training_id]
        );

        if (trainingResult.length === 0) {
            return res.status(404).json({ error: 'Training record not found' });
        }

        const insertQuery = `
            INSERT INTO training_payment (training_id, user_id, payment_price, status, created_at)
            VALUES (?, ?, ?, ?, NOW())`;

        const [insertResult] = await conn.promise().query(insertQuery, [
            training_id,
            user_id,
            parseFloat(payment_price),
            status
        ]);

        const insertedId = insertResult.insertId;

        const [paymentData] = await conn.promise().query(
            'SELECT * FROM training_payment WHERE id = ?',
            [insertedId]
        );

        return res.status(200).json({
            status: 'success',
            message: 'Training payment recorded successfully',
            data: paymentData[0]
        });
    } catch (err) {
        console.error('Error adding training payment:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports.AddTrainingServiceGetPaymentController = async (req, res) => {
    const { user_id, payment_price, booking_id } = req.body;

    if (!user_id || !payment_price || !booking_id) {
        return res.status(400).json({ error: 'payment_price, user_id and booking_id are required' });
    }

    const priceRegex = /^\d+(\.\d{1,2})?$/;
    if (!priceRegex.test(payment_price.toString())) {
        return res.status(400).json({ error: 'payment_price must be a valid number (e.g., 100 or 49.99)' });
    }

    try {

        const userQuery = 'SELECT * FROM users WHERE id = ?';
        const [userData] = await conn.promise().query(userQuery, [user_id]);

        if (!userData || userData.length === 0) {
            return res.status(404).json({ error: "User not found." });
        }

        const user = userData[0];

        if (user.customerId) {
            customerData = await stripe.customers.retrieve(user.customerId);
        } else {
            const customer = {
                name: `${user.firstName} ${user.lastName}`,
                email: user.email,
                phone: user.phone,
                metadata: { userId: user.id },
            };

            customerData = await stripe.customers.create(customer);

            const userUpdateQuery = `UPDATE users SET customerId = ? WHERE id = ?`;
            await conn.promise().query(userUpdateQuery, [customerData.id, user.id]);
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: payment_price * 100, // Convert to cents
            currency: 'usd',
            metadata: { bookingId: booking_id },
            customer: customerData.id, // Associate the payment with the Stripe customer
        });

        return res.status(200).json({
            status: 'success',
            message: 'Training payment recorded successfully',
            data: [{ 'payment_intent': paymentIntent }]
        });
    } catch (err) {
        console.error('Error adding training payment:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};