"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.config = {
    port: parseInt(process.env.PORT || '6847', 10),
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/elderly_meal',
    jwtSecret: process.env.JWT_SECRET || 'elderly-meal-service-secret-key-2024',
    jwtExpiresIn: '24h',
    monthlySubsidyQuota: parseInt(process.env.MONTHLY_SUBSIDY_QUOTA || '100000', 10),
};
