require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const logger = require('./src/utils/logger');
const connectDB = require('./src/config/db');
const { connectRedis } = require('./src/config/redis');
const { initQueue } = require('./src/services/queueService');
const loansRoutes = require('./src/routes/loansRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Connections
connectDB();
connectRedis();

// Queue Initialization
initQueue();

// Routes
app.use('/api/loans', loansRoutes);
app.use('/api/users', require('./src/routes/userRoutes'));
// Backward compatibility for existing link in previous response
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
});
