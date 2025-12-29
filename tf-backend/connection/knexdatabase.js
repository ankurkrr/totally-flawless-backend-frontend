require('dotenv').config();
const knex = require('knex');

// Validate required environment variables for production database
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    throw new Error('Missing required database environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
}

const dbPassword = process.env.DB_PASSWORD;
const dbPort = parseInt(process.env.DB_PORT) || 3306;

const productionDB = knex({
    client: 'mysql2',
    connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: dbPassword,
        port: dbPort,
        database: process.env.DB_NAME,
        charset: 'utf8mb4', // Use utf8mb4 instead of cesu8
        authPlugins: {
            mysql_clear_password: () => () => Buffer.from(dbPassword),
        },
        dateStrings: ['DATE']
    },
    pool: { min: 0 },
});

// Staging/Development database - uses same validation or falls back to production if not set
const dbDevPassword = process.env.DB_DEV_PASSWORD || process.env.DB_PASSWORD;
const dbDevPort = parseInt(process.env.DB_DEV_PORT) || parseInt(process.env.DB_PORT) || 3306;

const stagingDB = knex({
    client: 'mysql2',
    connection: {
        host: process.env.DB_DEV_HOST || process.env.DB_HOST,
        user: process.env.DB_DEV_USER || process.env.DB_USER,
        password: dbDevPassword,
        port: dbDevPort,
        database: process.env.DB_DEV_NAME || process.env.DB_NAME,
        charset: 'utf8mb4', // Use utf8mb4 instead of cesu8
        authPlugins: {
            mysql_clear_password: () => () => Buffer.from(dbDevPassword),
        },
        dateStrings: ['DATE']
    },
    pool: { min: 0 },
});

// Use environment variable to determine which database to use
const useDev = process.env.NODE_ENV === 'development' || process.env.USE_DEV_DB === 'true';
module.exports = useDev ? stagingDB : productionDB;
