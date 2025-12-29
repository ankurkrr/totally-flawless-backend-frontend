/**
 * Database Connection Verification Script
 * Run this to verify your database connection is working
 * Usage: node tests/verify-db-connection.js
 */

const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// Load .env file
const envPath = path.resolve(__dirname, '..', '.env');
const envResult = dotenv.config({ path: envPath });

if (envResult.error) {
    console.warn('⚠️  .env file not found, using environment variables');
} else {
    console.log('✅ Loaded .env file from:', envPath);
}

// Get database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'flawless_test',
};

console.log('\n📊 Database Configuration:');
console.log('   Host:', dbConfig.host);
console.log('   Port:', dbConfig.port);
console.log('   User:', dbConfig.user);
console.log('   Database:', dbConfig.database);
console.log('   Password:', dbConfig.password ? '***SET***' : 'NOT SET');

// Verify required fields
if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
    console.error('\n❌ Missing required database configuration!');
    console.error('   Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
    process.exit(1);
}

// Test connection
async function testConnection() {
    let connection;
    try {
        console.log('\n🔌 Attempting to connect to database...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Database connection successful!');
        
        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Database query test successful!');
        
        // Check if database exists and show some info
        const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db');
        console.log('✅ Current database:', dbInfo[0].current_db);
        
        // Try to get table count
        try {
            const [tables] = await connection.execute(
                "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ?",
                [dbConfig.database]
            );
            console.log('✅ Tables in database:', tables[0].count);
        } catch (err) {
            console.warn('⚠️  Could not count tables:', err.message);
        }
        
        await connection.end();
        console.log('\n✅ All database checks passed!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Database connection failed!');
        console.error('   Error:', error.message);
        console.error('   Code:', error.code);
        
        if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('   💡 The database "' + dbConfig.database + '" does not exist!');
        } else if (error.code === 'ECONNREFUSED') {
            console.error('   💡 Cannot connect to MySQL server. Is MySQL running?');
            console.error('   💡 Check if the host and port are correct.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   💡 Access denied. Check DB_USER and DB_PASSWORD.');
        }
        
        if (connection) {
            await connection.end();
        }
        process.exit(1);
    }
}

testConnection();

