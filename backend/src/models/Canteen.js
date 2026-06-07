"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Canteen = void 0;
var mongoose_1 = require("mongoose");
var canteenSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    dailyCapacity: { type: Number, required: true, min: 0 },
    businessHours: {
        lunch: { type: String, required: true },
        dinner: { type: String, required: true },
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });
exports.Canteen = mongoose_1.default.model("Canteen", canteenSchema);
