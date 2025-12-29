const db = require('../../connection/knexdatabase');

const activityLogger = async (req, res, next) => {
    if (req.method === 'OPTIONS') {
        return next();
    }
    const startTime = Date.now();

    let responseBody = '';
    const originalWrite = res.write;
    const originalEnd = res.end;

    res.write = function (chunk, ...args) {
        responseBody += chunk.toString();
        originalWrite.apply(res, arguments);
    };

    res.end = function (chunk, ...args) {
        if (chunk) {
            responseBody += chunk.toString();
        }
        originalEnd.apply(res, arguments);
    };

    res.on("finish", async () => {
        // Skip activity logging in test environment to prevent async operations after tests
        if (process.env.NODE_ENV === 'test') {
            return;
        }

        const responseTime = Date.now() - startTime;

        try {
            const logData = {
                userId: req.user?.id || null,
                name: req.user?.name || "Guest",
                method: req.method,
                route: req.originalUrl,
                request_data: JSON.stringify(req.body || {}),
                response_data: responseBody,
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('user-agent') || '',
                status_code: res.statusCode,
                response_time: responseTime,
                headers: JSON.stringify(req.headers || {})
            };

            await db("activity_logger").insert(logData);

            // Only log if not in test environment
            if (process.env.NODE_ENV !== 'test') {
                console.log(`[ACTIVITY] ${logData.method} ${logData.route} | User: ${logData.userId || 'Guest'} | Status: ${logData.status_code} | Time: ${responseTime}ms`);
            }
        } catch (error) {
            // Silently fail in test environment, log in others
            if (process.env.NODE_ENV !== 'test') {
                console.error("Error logging API activity:", error);
            }
        }
    });

    next();
};

module.exports = activityLogger;
