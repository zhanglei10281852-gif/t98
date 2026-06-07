"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonthlySubsidyQuota = void 0;
var mongoose_1 = require("mongoose");
var monthlySubsidyQuotaSchema = new mongoose_1.default.Schema({
    month: { type: String, required: true, unique: true },
    totalQuota: { type: Number, required: true, default: 100000 },
    usedAmount: { type: Number, required: true, default: 0 },
    remainingAmount: { type: Number, required: true, default: 100000 },
    status: { type: String, enum: ["active", "exhausted"], default: "active" },
}, { timestamps: true });
exports.MonthlySubsidyQuota = mongoose_1.default.model("MonthlySubsidyQuota", monthlySubsidyQuotaSchema);
