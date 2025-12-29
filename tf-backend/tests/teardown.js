/**
 * Global Test Teardown
 * Runs after all tests complete - cleans up resources
 */

module.exports = async () => {
    // Close database connection pool with timeout
    try {
        const conn = require('../connection/database');
        
        // Close all connections in the pool with timeout
        if (conn && typeof conn.end === 'function') {
            // Use Promise.race to ensure we don't hang forever
            await Promise.race([
                new Promise((resolve) => {
                    // Set a shorter timeout for the callback
                    const timeout = setTimeout(() => {
                        resolve();
                    }, 1000);
                    
                    conn.end((err) => {
                        clearTimeout(timeout);
                        // Ignore errors during teardown
                        resolve();
                    });
                }),
                new Promise((resolve) => setTimeout(resolve, 1500)) // 1.5 second max timeout
            ]);
        }
    } catch (error) {
        // Ignore errors - tests are done
    }

    // Close any test database connections
    try {
        const dbHelpers = require('./helpers/dbHelpers');
        if (dbHelpers && typeof dbHelpers.closeConnection === 'function') {
            await Promise.race([
                dbHelpers.closeConnection(),
                new Promise((resolve) => setTimeout(resolve, 500)) // 0.5 second timeout
            ]);
        }
    } catch (error) {
        // Ignore errors - tests are done
    }

    // Force close any remaining connections
    try {
        // Give Node.js time to clean up
        await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
        // Ignore errors
    }
};

