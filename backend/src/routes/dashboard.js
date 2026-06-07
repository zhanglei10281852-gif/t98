"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var dayjs_1 = require("dayjs");
var Order_1 = require("../models/Order");
var Elderly_1 = require("../models/Elderly");
var SubsidyRecord_1 = require("../models/SubsidyRecord");
var MonthlySubsidyQuota_1 = require("../models/MonthlySubsidyQuota");
var Canteen_1 = require("../models/Canteen");
var auth_1 = require("../middleware/auth");
var subsidy_1 = require("../utils/subsidy");
var config_1 = require("../config");
var router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get("/stats", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var today, tomorrow, currentMonth, canteenFilter, _a, todayOrders, totalElderly, totalCanteens, monthSubsidy, monthQuota, canteenOrders, dailyTrend, subsidyTotal, subsidyCount, quota, error_1;
    var _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 2, , 3]);
                today = new Date();
                today.setHours(0, 0, 0, 0);
                tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                currentMonth = (0, subsidy_1.getMonthKey)(today);
                canteenFilter = {};
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === "canteen") {
                    canteenFilter.canteenId = req.user.canteenId;
                }
                return [4 /*yield*/, Promise.all([
                        Order_1.Order.countDocuments(__assign(__assign({}, canteenFilter), { mealDate: { $gte: today, $lt: tomorrow }, status: { $ne: "cancelled" } })),
                        Elderly_1.Elderly.countDocuments({ status: "active" }),
                        Canteen_1.Canteen.countDocuments({ status: "active" }),
                        SubsidyRecord_1.SubsidyRecord.aggregate([
                            {
                                $match: __assign({ month: currentMonth }, (canteenFilter.canteenId
                                    ? { canteenId: canteenFilter.canteenId }
                                    : {})),
                            },
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: "$totalSubsidy" },
                                    count: { $sum: 1 },
                                },
                            },
                        ]),
                        MonthlySubsidyQuota_1.MonthlySubsidyQuota.findOne({ month: currentMonth }),
                        Order_1.Order.aggregate([
                            {
                                $match: __assign({ mealDate: { $gte: today, $lt: tomorrow }, status: { $ne: "cancelled" } }, canteenFilter),
                            },
                            { $group: { _id: "$canteenId", count: { $sum: 1 } } },
                            {
                                $lookup: {
                                    from: "canteens",
                                    localField: "_id",
                                    foreignField: "_id",
                                    as: "canteen",
                                },
                            },
                            { $unwind: "$canteen" },
                            { $project: { canteenName: "$canteen.name", count: 1 } },
                        ]),
                        getDailyTrend(canteenFilter),
                    ])];
            case 1:
                _a = _e.sent(), todayOrders = _a[0], totalElderly = _a[1], totalCanteens = _a[2], monthSubsidy = _a[3], monthQuota = _a[4], canteenOrders = _a[5], dailyTrend = _a[6];
                subsidyTotal = ((_c = monthSubsidy[0]) === null || _c === void 0 ? void 0 : _c.total) || 0;
                subsidyCount = ((_d = monthSubsidy[0]) === null || _d === void 0 ? void 0 : _d.count) || 0;
                quota = monthQuota || {
                    totalQuota: config_1.config.monthlySubsidyQuota,
                    usedAmount: subsidyTotal,
                    remainingAmount: config_1.config.monthlySubsidyQuota - subsidyTotal,
                };
                res.json({
                    todayOrders: todayOrders,
                    totalElderly: totalElderly,
                    totalCanteens: totalCanteens,
                    monthSubsidyTotal: subsidyTotal,
                    monthSubsidyCount: subsidyCount,
                    monthQuota: {
                        totalQuota: quota.totalQuota,
                        usedAmount: quota.usedAmount || 0,
                        remainingAmount: quota.remainingAmount !== undefined
                            ? quota.remainingAmount
                            : quota.totalQuota - (quota.usedAmount || 0),
                    },
                    canteenOrders: canteenOrders.sort(function (a, b) { return b.count - a.count; }),
                    dailyTrend: dailyTrend,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _e.sent();
                console.error(error_1);
                res.status(500).json({ message: "获取统计数据失败" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
function getDailyTrend(canteenFilter) {
    return __awaiter(this, void 0, void 0, function () {
        var days, today, i, date, dayStart, dayEnd, count;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    days = [];
                    today = (0, dayjs_1.default)();
                    i = 29;
                    _a.label = 1;
                case 1:
                    if (!(i >= 0)) return [3 /*break*/, 4];
                    date = today.subtract(i, "day");
                    dayStart = date.startOf("day").toDate();
                    dayEnd = date.endOf("day").toDate();
                    return [4 /*yield*/, Order_1.Order.countDocuments(__assign(__assign({}, canteenFilter), { mealDate: { $gte: dayStart, $lt: dayEnd }, status: { $ne: "cancelled" } }))];
                case 2:
                    count = _a.sent();
                    days.push({
                        date: date.format("YYYY-MM-DD"),
                        count: count,
                    });
                    _a.label = 3;
                case 3:
                    i--;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, days];
            }
        });
    });
}
exports.default = router;
