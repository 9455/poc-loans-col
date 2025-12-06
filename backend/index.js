require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const logger = require('./src/utils/logger');
const connectDB = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');
const { serverAdapter, scheduleJobs } = require('./src/services/queueService');
const loansRoutes = require('./src/routes/loansRoutes');
const userRoutes = require('./src/routes/userRoutes');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connections
connectDB();
connectRedis();

// Bull Board Dashboard (Queue Monitoring)
app.use('/admin/queues', serverAdapter.getRouter());

// Routes
app.use('/api/loans', loansRoutes);
app.use('/api/users', userRoutes);
// Backward compatibility
app.use('/api', loansRoutes);

// Swagger Documentation with Dark Theme
const swaggerDocument = YAML.load('./swagger.yaml');
const swaggerOptions = {
    customCss: `
        .swagger-ui .topbar { display: none }
        body { background-color: #0b0e14; color: #fff; }
        .swagger-ui .info .title, .swagger-ui .info .description, .swagger-ui .scheme-container { color: #fff; }
        .swagger-ui .opblock .opblock-summary-operation-method, .swagger-ui .opblock .opblock-summary-path, .swagger-ui .opblock .opblock-summary-description { color: #fff; }
        .swagger-ui .opblock-get .opblock-summary { border-color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .swagger-ui .opblock-get .opblock-summary-method { background: #3b82f6; }
        .swagger-ui .opblock-post .opblock-summary { border-color: #22c55e; background: rgba(34, 197, 94, 0.1); }
        .swagger-ui .opblock-post .opblock-summary-method { background: #22c55e; }
    `,
    customSiteTitle: "DedlyFi API Docs"
};
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Start Server
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    logger.info(`Bull Board available at http://localhost:${PORT}/admin/queues`);
    
    // Initialize scheduled jobs
    scheduleJobs();
});
