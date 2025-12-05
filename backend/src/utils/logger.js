let logger;
try {
    // Try to load the user's custom logger
    const loggerModule = require('@moscotoce/logger');
    logger = loggerModule.default || loggerModule;
} catch (err) {
    console.warn("Custom logger not found, falling back to console");
    logger = {
        info: (msg, meta) => console.log(`[INFO] ${msg}`, meta || ''),
        error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || ''),
        warn: (msg, meta) => console.warn(`[WARN] ${msg}`, meta || ''),
        debug: (msg, meta) => console.debug(`[DEBUG] ${msg}`, meta || '')
    };
}

module.exports = logger;
