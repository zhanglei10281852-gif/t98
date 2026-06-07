"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubsidyRecord = void 0;
var mongoose_1 = require("mongoose");
var subsidyRecordSchema = new mongoose_1.default.Schema({
    orderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        unique: true,
    },
    elderlyId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Elderly",
        required: true,
    },
    canteenId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Canteen",
        required: true,
    },
    mealDate: { type: Date, required: true },
    subsidyCategory: { type: String, required: true },
    baseSubsidy: { type: Number, required: true, default: 0 },
    seniorSubsidy: { type: Number, required: true, default: 0 },
    totalSubsidy: { type: Number, required: true, default: 0 },
    mealPrice: { type: Number, required: true, default: 0 },
    selfPayAmount: { type: Number, required: true, default: 0 },
    month: { type: String, required: true },
    settled: { type: Boolean, default: true },
}, { timestamps: true });
subsidyRecordSchema.index({ month: 1, elderlyId: 1 });
subsidyRecordSchema.index({ month: 1, canteenId: 1 });
exports.SubsidyRecord = mongoose_1.default.model("SubsidyRecord", subsidyRecordSchema);
