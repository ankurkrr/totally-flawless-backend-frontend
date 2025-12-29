// Load environment variables FIRST, before anything else
const path = require('path');
const dotenv = require('dotenv');

// Try multiple .env file locations
const envPath = path.resolve(__dirname, '..', '.env');
const envLocalPath = path.resolve(__dirname, '..', '.env.local');

// Load .env.local first (if exists), then .env
const envResult = dotenv.config({ path: envLocalPath });
if (envResult.error) {
    // If .env.local doesn't exist, try .env
    const envResult2 = dotenv.config({ path: envPath });
    if (envResult2.error) {
        console.warn('⚠️  Warning: .env file not found. Using system environment variables.');
    } else {
        console.log('✅ Loaded .env file from:', envPath);
    }
} else {
    console.log('✅ Loaded .env.local file from:', envLocalPath);
}

// Log loaded database config (without password)
console.log('📊 Database Configuration:');
console.log('   Host:', process.env.DB_HOST || 'NOT SET');
console.log('   Port:', process.env.DB_PORT || '3306');
console.log('   User:', process.env.DB_USER || 'NOT SET');
console.log('   Database:', process.env.DB_NAME || 'NOT SET');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

var mysql = require('mysql2');

// Validate required environment variables
if (!process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
    console.error('❌ Missing required database environment variables!');
    console.error('   Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    console.error('   Please check your .env file exists and contains these variables.');
    throw new Error('Missing required database environment variables: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
}

const ProductionConnection = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 500,
    queueLimit: 0,
    charset: 'utf8mb4', // Use utf8mb4 instead of cesu8
    timezone: '+00:00',
    // Suppress charset errors during handshake - we'll set it properly after connection
    typeCast: function (field, next) {
        if (field.type === 'VAR_STRING' || field.type === 'STRING') {
            return field.string();
        }
        return next();
    }
};

const DevConnection = {
    host: process.env.DB_DEV_HOST || process.env.DB_HOST,
    port: parseInt(process.env.DB_DEV_PORT) || parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_DEV_USER || process.env.DB_USER,
    password: process.env.DB_DEV_PASSWORD || process.env.DB_PASSWORD,
    database: process.env.DB_DEV_NAME || process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT) || 500,
    queueLimit: 0,
    charset: 'utf8mb4', // Use utf8mb4 instead of cesu8
    timezone: '+00:00',
    // Suppress charset errors during handshake - we'll set it properly after connection
    typeCast: function (field, next) {
        if (field.type === 'VAR_STRING' || field.type === 'STRING') {
            return field.string();
        }
        return next();
    }
};

// Use environment variable to determine which connection to use
const useDev = process.env.NODE_ENV === 'development' || process.env.USE_DEV_DB === 'true';
const connectionConfig = useDev ? DevConnection : ProductionConnection;

console.log('🔌 Using', useDev ? 'DEVELOPMENT' : 'PRODUCTION', 'database connection');
console.log('   Connecting to database:', connectionConfig.database);

const conn = mysql.createPool(connectionConfig);

// Set charset after pool creation to ensure utf8mb4 is used
conn.on('connection', (connection) => {
    // Set charset immediately on connection
    connection.query("SET NAMES 'utf8mb4' COLLATE 'utf8mb4_unicode_ci'", (err) => {
        if (err && process.env.NODE_ENV !== 'test') {
            console.warn('⚠️  Failed to set charset:', err.message);
        }
    });
    connection.query("SET CHARACTER SET utf8mb4", (err) => {
        if (err && process.env.NODE_ENV !== 'test') {
            console.warn('⚠️  Failed to set character set:', err.message);
        }
    });
});

// Test connection immediately
conn.getConnection((err, connection) => {
    if (err) {
        // Suppress encoding errors in test environment (they're handled gracefully)
        const isEncodingError = err.message && err.message.includes('Encoding not recognized');
        const isTestEnv = process.env.NODE_ENV === 'test';
        
        // In test environment, suppress encoding errors, "Pool is closed" errors, timeout errors, and Jest teardown errors
        const isPoolClosedError = err.message && err.message.includes('Pool is closed');
        const isTimeoutError = err.code === 'ETIMEDOUT' || (err.message && err.message.includes('ETIMEDOUT'));
        const isJestTornDown = err.message && (
            err.message.includes('Jest environment has been torn down') ||
            err.message.includes('import') ||
            err.message.includes('getCodec')
        );
        
        if (isTestEnv && (isEncodingError || isPoolClosedError || isTimeoutError || isJestTornDown)) {
            // Silently ignore these errors in test environment
            return; // Exit early, don't log anything
        }
        
        // Log other errors normally
        console.error('❌ Database connection failed!');
        console.error('   Error:', err.message);
        console.error('   Code:', err.code);
        
        if (err.code === 'ER_BAD_DB_ERROR') {
            console.error('   💡 The database "' + connectionConfig.database + '" does not exist!');
            console.error('   💡 Please create the database or check DB_NAME in your .env file.');
        } else if (err.code === 'ECONNREFUSED') {
            console.error('   💡 Cannot connect to MySQL server. Is MySQL running?');
        } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   💡 Access denied. Check DB_USER and DB_PASSWORD in your .env file.');
        }
        
        console.error('\n📝 Current configuration:');
        console.error('   Host:', connectionConfig.host);
        console.error('   Port:', connectionConfig.port);
        console.error('   User:', connectionConfig.user);
        console.error('   Database:', connectionConfig.database);
        
        // Don't exit in test environment - let tests handle the error
        if (process.env.NODE_ENV !== 'test') {
            process.exit(1);
        } else {
            // In test environment, silently ignore encoding errors, timeouts, and Jest teardown errors
            // Only warn for actual connection problems (not already suppressed)
            const shouldSuppress = isEncodingError || isTimeoutError || isJestTornDown || isPoolClosedError;
            if (!shouldSuppress) {
                console.warn('⚠️  Test environment: Continuing despite database connection error');
                console.warn('   Make sure your database is accessible and credentials are correct');
            }
            // Suppressed errors don't affect functionality
        }
    } else {
        console.log('✅ Database connection successful!');
        console.log('   Connected to database:', connectionConfig.database);
        connection.release();
    }
});

conn.on('error', (err) => {
    // Suppress errors in test environment after teardown
    const isTestEnv = process.env.NODE_ENV === 'test';
    const isJestTornDown = err.message && (
        err.message.includes('Jest environment has been torn down') ||
        err.message.includes('import') ||
        err.message.includes('getCodec')
    );
    
    if (isTestEnv && isJestTornDown) {
        // Silently ignore - Jest is tearing down
        return;
    }
    
    console.error('❌ Database pool error:', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('🔄 Attempting to reconnect to the database...');
    } else {
        console.error('   Error code:', err.code);
    }
});

console.log('✅ Database pool created successfully.');

// var conn = mysql.createConnection(ProductionConnection);
// conn.connect(function (err) {
//     if (err) throw err;
//     console.log("Database is connected successfully !");
// });

module.exports = conn;

