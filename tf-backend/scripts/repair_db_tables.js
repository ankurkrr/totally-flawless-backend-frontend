console.log('Starting repair script...');
const path = require('path');
const dotenv = require('dotenv');

// Explicitly load .env from tf-backend root
const envPath = path.resolve(__dirname, '..', '.env');
console.log('Loading .env from:', envPath);
const envResult = dotenv.config({ path: envPath });
if (envResult.error) {
    console.warn('Warning: .env loading failed:', envResult.error.message);
} else {
    console.log('Environment variables loaded.');
}

// Log DB config (sanitized)
console.log('DB Config:', {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    db: process.env.DB_NAME,
    passwordLength: process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0
});

try {
    const db = require('../connection/knexdatabase');
    console.log('Database module loaded.');

    async function repairTables() {
        try {
            console.log('Checking connection...');
            await db.raw('SELECT 1');
            console.log('Connection successful.');

            console.log('Checking for bookings table...');
            const hasBookings = await db.schema.hasTable('bookings');
            if (!hasBookings) {
                console.log('Creating bookings table...');
                await db.schema.createTable('bookings', table => {
                    table.string('id', 100).primary();
                    table.string('userId', 100);
                    table.datetime('createdAt');
                    table.datetime('updatedAt');
                    table.string('cartId', 100);
                    table.string('assignedTo', 100);
                    table.float('amountPaid');
                    table.string('transactionId', 100);
                    table.float('totalAmount');
                    table.string('status', 100);
                });
                console.log('bookings table created.');
            } else {
                console.log('bookings table already exists.');
            }

            console.log('Checking for pushnotifications table...');
            const hasPushNotifications = await db.schema.hasTable('pushnotifications');
            if (!hasPushNotifications) {
                console.log('Creating pushnotifications table...');
                await db.schema.createTable('pushnotifications', table => {
                    table.increments('id').primary();
                    table.string('booking_id', 100);
                    table.string('status', 100);
                    table.datetime('created_at');
                });
                console.log('pushnotifications table created.');
            } else {
                console.log('pushnotifications table already exists.');
            }

            console.log('Repair complete.');
            process.exit(0);
        } catch (error) {
            console.error('Error repairing tables:', error);
            process.exit(1);
        }
    }

    repairTables();

} catch (error) {
    console.error('Failed to load database module:', error);
    process.exit(1);
}
