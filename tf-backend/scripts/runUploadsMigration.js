/**
 * Run Uploads Schema Migration
 * 
 * Executes the uploads table creation SQL
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function runMigration() {
    console.log('🔄 Running uploads schema migration...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, '..', 'DB', 'uploads_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Get database connection from environment
    const connectionConfig = {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true // Allow multiple SQL statements
    };

    if (!connectionConfig.host || !connectionConfig.user || !connectionConfig.password || !connectionConfig.database) {
        console.error('❌ Missing required database environment variables!');
        console.error('   Required: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
        process.exit(1);
    }

    let connection;
    try {
        // Create connection
        connection = await mysql.createConnection(connectionConfig);
        console.log('✅ Connected to database:', connectionConfig.database);

        // Execute SQL
        console.log('📝 Executing SQL migration...');
        await connection.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('   Table "uploads" should now exist.');

        // Verify table exists
        const [tables] = await connection.query(
            "SHOW TABLES LIKE 'uploads'"
        );

        if (tables.length > 0) {
            console.log('✅ Verified: "uploads" table exists');
            
            // Show table structure
            const [columns] = await connection.query('DESCRIBE uploads');
            console.log('\n📊 Table structure:');
            console.table(columns.map(col => ({
                Field: col.Field,
                Type: col.Type,
                Null: col.Null,
                Key: col.Key
            })));
        } else {
            console.warn('⚠️  Warning: Could not verify table creation');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('   ℹ️  Table already exists. This is OK.');
        } else {
            console.error('   Error code:', error.code);
            process.exit(1);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n✅ Database connection closed');
        }
    }
}

// Run migration
runMigration().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});

