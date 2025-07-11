"use strict";

require("dotenv").config({ path: require('path').join(__dirname, '.env') });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const path = require("path");
const fs = require('fs');
const logger = require("./config/logger");
const { errorHandler } = require('./middleware/errorHandler');
const { sanitizeInput } = require('./middleware/validation');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const ENV = process.env.NODE_ENV || "development";

app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(helmet());
app.use(compression());
app.use(sanitizeInput);

const corsWhitelist = (process.env.CORS_ORIGIN || "").split(',').map(o => o.trim()).filter(Boolean);
if (ENV === 'development') {
    corsWhitelist.push("http://localhost:5173", "http://127.0.0.1:5173");
}
const corsOptions = {
    origin: (origin, callback) => {
        if (!origin || corsWhitelist.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(morgan(ENV === 'production' ? 'combined' : 'dev', { stream: logger.stream }));

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});
const downloadLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

app.use("/api/", globalLimiter);
app.use("/api/v1/download", downloadLimiter);

app.use("/api/v1/download", require("./routes/download"));
app.use("/api/v1/health", require("./routes/health"));
app.use("/api/v1/stats", require("./routes/stats"));

if (ENV === "production") {
    const frontendDist = path.resolve(__dirname, "..", "frontend", "dist");
    if (fs.existsSync(frontendDist)) {
        app.use(express.static(frontendDist, { immutable: true, maxAge: '1y' }));
        app.get("*", (req, res) => res.sendFile(path.join(frontendDist, "index.html")));
    } else {
        logger.warn('Frontend build not found.');
    }
}

app.use("/api/*", (req, res) => {
    res.status(404).json({ error: true, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

app.use(errorHandler);

const server = app.listen(PORT, HOST, () => {
    logger.info(`Server listening on http://${HOST}:${PORT} [${ENV}]`);
});

const gracefulShutdown = (signal) => {
    logger.info(`${signal} received. Shutting down gracefully.`);
    server.close(() => {
        logger.info('HTTP server closed.');
        const { redisClient } = require('./middleware/cache');
        if (redisClient && redisClient.isOpen) {
            redisClient.quit().then(() => logger.info('Redis connection closed.'));
        }
        process.exit(0);
    });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;