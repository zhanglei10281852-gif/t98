"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var SubsidyRecord_1 = require("../models/SubsidyRecord");
var MonthlySubsidyQuota_1 = require("../models/MonthlySubsidyQuota");
var auth_1 = require("../middleware/auth");
var subsidy_1 = require("../utils/subsidy");
var config_1 = require("../config");
var router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.use((0, auth_1.requireRoles)("admin", "worker"));
router.get("/monthly-summary", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, month, _c, page, _d, pageSize, targetMonth, quota, records, pageNum, size, skip, paginatedRecords, error_1;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                _a = req.query, _b = _a.month, month = _b === void 0 ? "" : _b, _c = _a.page, page = _c === void 0 ? "1" : _c, _d = _a.pageSize, pageSize = _d === void 0 ? "10" : _d;
                targetMonth = month || (0, subsidy_1.getMonthKey)(new Date());
                return [4 /*yield*/, MonthlySubsidyQuota_1.MonthlySubsidyQuota.findOne({ month: targetMonth })];
            case 1:
                quota = _e.sent();
                return [4 /*yield*/, SubsidyRecord_1.SubsidyRecord.aggregate([
                        { $match: { month: targetMonth } },
                        {
                            $group: {
                                _id: "$elderlyId",
                                mealCount: { $sum: 1 },
                                totalSubsidy: { $sum: "$totalSubsidy" },
                                totalSelfPay: { $sum: "$selfPayAmount" },
                                totalMealPrice: { $sum: "$mealPrice" },
                            },
                        },
                        {
                            $lookup: {
                                from: "elderlies",
                                localField: "_id",
                                foreignField: "_id",
                                as: "elderly",
                            },
                        },
                        { $unwind: "$elderly" },
                        {
                            $project: {
                                elderlyId: "$_id",
                                name: "$elderly.name",
                                idCard: "$elderly.idCard",
                                community: "$elderly.community",
                                subsidyCategory: "$elderly.subsidyCategory",
                                mealCount: 1,
                                totalSubsidy: 1,
                                totalSelfPay: 1,
                                totalMealPrice: 1,
                            },
                        },
                        { $sort: { mealCount: -1 } },
                    ])];
            case 2:
                records = _e.sent();
                pageNum = parseInt(page, 10);
                size = parseInt(pageSize, 10);
                skip = (pageNum - 1) * size;
                paginatedRecords = records.slice(skip, skip + size);
                res.json({
                    month: targetMonth,
                    quota: quota || {
                        month: targetMonth,
                        totalQuota: config_1.config.monthlySubsidyQuota,
                        usedAmount: 0,
                        remainingAmount: config_1.config.monthlySubsidyQuota,
                        status: "active",
                    },
                    total: records.length,
                    list: paginatedRecords,
                    page: pageNum,
                    pageSize: size,
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _e.sent();
                console.error(error_1);
                res.status(500).json({ message: "获取月度补贴汇总失败" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
router.get("/quota", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, month, targetMonth, quota, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query.month, month = _a === void 0 ? "" : _a;
                targetMonth = month || (0, subsidy_1.getMonthKey)(new Date());
                return [4 /*yield*/, MonthlySubsidyQuota_1.MonthlySubsidyQuota.findOne({ month: targetMonth })];
            case 1:
                quota = _b.sent();
                if (!quota) {
                    quota = {
                        month: targetMonth,
                        totalQuota: config_1.config.monthlySubsidyQuota,
                        usedAmount: 0,
                        remainingAmount: config_1.config.monthlySubsidyQuota,
                        status: "active",
                    };
                }
                res.json(quota);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                res.status(500).json({ message: "获取补贴额度失败" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get("/category-stats", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, month, targetMonth, stats, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query.month, month = _a === void 0 ? "" : _a;
                targetMonth = month || (0, subsidy_1.getMonthKey)(new Date());
                return [4 /*yield*/, SubsidyRecord_1.SubsidyRecord.aggregate([
                        { $match: { month: targetMonth } },
                        {
                            $group: {
                                _id: "$subsidyCategory",
                                count: { $sum: 1 },
                                totalSubsidy: { $sum: "$totalSubsidy" },
                            },
                        },
                        {
                            $project: {
                                category: "$_id",
                                count: 1,
                                totalSubsidy: 1,
                            },
                        },
                    ])];
            case 1:
                stats = _b.sent();
                res.json(stats);
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                res.status(500).json({ message: "获取补贴分类统计失败" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get("/export-csv", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, month, targetMonth, records, categoryMap_1, header, rows, csv, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query.month, month = _a === void 0 ? "" : _a;
                targetMonth = month || (0, subsidy_1.getMonthKey)(new Date());
                return [4 /*yield*/, SubsidyRecord_1.SubsidyRecord.aggregate([
                        { $match: { month: targetMonth } },
                        {
                            $group: {
                                _id: "$elderlyId",
                                mealCount: { $sum: 1 },
                                totalSubsidy: { $sum: "$totalSubsidy" },
                                totalSelfPay: { $sum: "$selfPayAmount" },
                            },
                        },
                        {
                            $lookup: {
                                from: "elderlies",
                                localField: "_id",
                                foreignField: "_id",
                                as: "elderly",
                            },
                        },
                        { $unwind: "$elderly" },
                        {
                            $project: {
                                name: "$elderly.name",
                                idCard: "$elderly.idCard",
                                community: "$elderly.community",
                                subsidyCategory: "$elderly.subsidyCategory",
                                mealCount: 1,
                                totalSubsidy: 1,
                                totalSelfPay: 1,
                            },
                        },
                        { $sort: { mealCount: -1 } },
                    ])];
            case 1:
                records = _b.sent();
                categoryMap_1 = {
                    low_income_full: "低保户全额补贴",
                    low_income: "低收入补贴",
                    normal: "普通老人补贴",
                    senior_extra: "高龄补贴",
                };
                header = "姓名,身份证号,所属社区,补贴类别,用餐次数,补贴总额(元),自付总额(元)\n";
                rows = records.map(function (r) {
                    return [
                        r.name,
                        r.idCard,
                        r.community,
                        categoryMap_1[r.subsidyCategory] || r.subsidyCategory,
                        r.mealCount,
                        r.totalSubsidy.toFixed(2),
                        r.totalSelfPay.toFixed(2),
                    ].join(",");
                });
                csv = header + rows.join("\n");
                res.setHeader("Content-Type", "text/csv; charset=utf-8");
                res.setHeader("Content-Disposition", "attachment; filename=\"subsidy-summary-".concat(targetMonth, ".csv\""));
                res.send("\uFEFF" + csv);
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                res.status(500).json({ message: "导出CSV失败" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
