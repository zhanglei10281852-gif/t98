"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Elderly = void 0;
var mongoose_1 = require("mongoose");
var elderlySchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    idCard: { type: String, required: true, unique: true },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, enum: ["male", "female"], required: true },
    community: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    subsidyCategory: {
        type: String,
        enum: ["low_income_full", "low_income", "normal", "senior_extra"],
        required: true,
    },
    canteenId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Canteen",
        required: true,
    },
    hasSeniorSubsidy: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });
exports.Elderly = mongoose_1.default.model("Elderly", elderlySchema);
