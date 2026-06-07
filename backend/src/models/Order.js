"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
var mongoose_1 = require("mongoose");
var orderSchema = new mongoose_1.default.Schema({
    orderNo: { type: String, required: true, unique: true },
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
    mealType: { type: String, enum: ["lunch", "dinner"], required: true },
    mealStandard: { type: String, enum: ["A", "B", "C"], required: true },
    mealPrice: { type: Number, required: true, min: 0 },
    remark: { type: String, default: "" },
    status: {
        type: String,
        enum: [
            "ordered",
            "confirmed",
            "preparing",
            "ready",
            "completed",
            "cancelled",
        ],
        default: "ordered",
    },
    deliveryType: {
        type: String,
        enum: ["pickup", "delivery"],
        default: "pickup",
    },
    deliveryInfo: {
        volunteerName: String,
        estimatedTime: String,
        actualTime: String,
    },
    subsidyAmount: { type: Number, required: true, default: 0 },
    selfPayAmount: { type: Number, required: true, default: 0 },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    confirmedAt: Date,
    completedAt: Date,
}, { timestamps: true });
orderSchema.index({ canteenId: 1, mealDate: 1, mealType: 1, status: 1 });
orderSchema.index({ elderlyId: 1, mealDate: 1 });
exports.Order = mongoose_1.default.model("Order", orderSchema);
