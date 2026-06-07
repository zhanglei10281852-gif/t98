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
var dayjs_1 = require("dayjs");
var Order_1 = require("../models/Order");
var Elderly_1 = require("../models/Elderly");
var Canteen_1 = require("../models/Canteen");
var SubsidyRecord_1 = require("../models/SubsidyRecord");
var MonthlySubsidyQuota_1 = require("../models/MonthlySubsidyQuota");
var auth_1 = require("../middleware/auth");
var subsidy_1 = require("../utils/subsidy");
var config_1 = require("../config");
var router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.get("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, page, _c, pageSize, _d, status_1, _e, canteenId, _f, startDate, _g, endDate, _h, mealType, query, end, pageNum, size, skip, _j, total, list, error_1;
    var _k;
    return __generator(this, function (_l) {
        switch (_l.label) {
            case 0:
                _l.trys.push([0, 2, , 3]);
                _a = req.query, _b = _a.page, page = _b === void 0 ? "1" : _b, _c = _a.pageSize, pageSize = _c === void 0 ? "10" : _c, _d = _a.status, status_1 = _d === void 0 ? "" : _d, _e = _a.canteenId, canteenId = _e === void 0 ? "" : _e, _f = _a.startDate, startDate = _f === void 0 ? "" : _f, _g = _a.endDate, endDate = _g === void 0 ? "" : _g, _h = _a.mealType, mealType = _h === void 0 ? "" : _h;
                query = {};
                if (((_k = req.user) === null || _k === void 0 ? void 0 : _k.role) === "canteen") {
                    query.canteenId = req.user.canteenId;
                }
                else if (canteenId) {
                    query.canteenId = canteenId;
                }
                if (status_1)
                    query.status = status_1;
                if (mealType)
                    query.mealType = mealType;
                if (startDate || endDate) {
                    query.mealDate = {};
                    if (startDate)
                        query.mealDate.$gte = new Date(startDate);
                    if (endDate) {
                        end = (0, dayjs_1.default)(endDate)
                            .add(1, "day")
                            .toDate();
                        query.mealDate.$lt = end;
                    }
                }
                pageNum = parseInt(page, 10);
                size = parseInt(pageSize, 10);
                skip = (pageNum - 1) * size;
                return [4 /*yield*/, Promise.all([
                        Order_1.Order.countDocuments(query),
                        Order_1.Order.find(query)
                            .populate("elderlyId", "name age phone subsidyCategory")
                            .populate("canteenId", "name")
                            .skip(skip)
                            .limit(size)
                            .sort({ createdAt: -1 }),
                    ])];
            case 1:
                _j = _l.sent(), total = _j[0], list = _j[1];
                res.json({
                    total: total,
                    list: list,
                    page: pageNum,
                    pageSize: size,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _l.sent();
                console.error(error_1);
                res.status(500).json({ message: "获取订单列表失败" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var order, error_2;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Order_1.Order.findById(req.params.id)
                        .populate("elderlyId")
                        .populate("canteenId", "name")];
            case 1:
                order = _c.sent();
                if (!order) {
                    return [2 /*return*/, res.status(404).json({ message: "订单不存在" })];
                }
                if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "canteen" &&
                    order.canteenId.toString() !== ((_b = req.user.canteenId) === null || _b === void 0 ? void 0 : _b.toString())) {
                    return [2 /*return*/, res.status(403).json({ message: "无权查看此订单" })];
                }
                res.json(order);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _c.sent();
                res.status(500).json({ message: "获取订单详情失败" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post("/", (0, auth_1.requireRoles)("admin", "worker"), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, elderlyId, canteenId, mealDate, mealType, mealStandard, _b, remark, _c, deliveryType, elderly, canteen, mealPrice, mealDateObj, today, tomorrow, dayStart, dayEnd, existingOrders, subsidy, monthKey, quota, orderNo, order, error_3;
    var _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 8, , 9]);
                _a = req.body, elderlyId = _a.elderlyId, canteenId = _a.canteenId, mealDate = _a.mealDate, mealType = _a.mealType, mealStandard = _a.mealStandard, _b = _a.remark, remark = _b === void 0 ? "" : _b, _c = _a.deliveryType, deliveryType = _c === void 0 ? "pickup" : _c;
                return [4 /*yield*/, Elderly_1.Elderly.findById(elderlyId)];
            case 1:
                elderly = _e.sent();
                if (!elderly) {
                    return [2 /*return*/, res.status(404).json({ message: "老人信息不存在" })];
                }
                return [4 /*yield*/, Canteen_1.Canteen.findById(canteenId)];
            case 2:
                canteen = _e.sent();
                if (!canteen) {
                    return [2 /*return*/, res.status(404).json({ message: "助餐点不存在" })];
                }
                mealPrice = subsidy_1.MEAL_PRICES[mealStandard];
                if (!mealPrice) {
                    return [2 /*return*/, res.status(400).json({ message: "无效的餐标" })];
                }
                mealDateObj = new Date(mealDate);
                today = new Date();
                today.setHours(0, 0, 0, 0);
                tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                if (mealDateObj < tomorrow) {
                    return [2 /*return*/, res.status(400).json({ message: "只能预订次日及以后的餐食" })];
                }
                dayStart = new Date(mealDateObj);
                dayStart.setHours(0, 0, 0, 0);
                dayEnd = new Date(dayStart);
                dayEnd.setDate(dayEnd.getDate() + 1);
                return [4 /*yield*/, Order_1.Order.countDocuments({
                        canteenId: canteenId,
                        mealDate: { $gte: dayStart, $lt: dayEnd },
                        mealType: mealType,
                        status: { $ne: "cancelled" },
                    })];
            case 3:
                existingOrders = _e.sent();
                if (existingOrders >= canteen.dailyCapacity) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ message: "该助餐点当日此餐次已达最大供餐能力" })];
                }
                subsidy = (0, subsidy_1.calculateSubsidy)(elderly, mealPrice);
                monthKey = (0, subsidy_1.getMonthKey)(mealDateObj);
                return [4 /*yield*/, MonthlySubsidyQuota_1.MonthlySubsidyQuota.findOne({ month: monthKey })];
            case 4:
                quota = _e.sent();
                if (!quota) {
                    quota = new MonthlySubsidyQuota_1.MonthlySubsidyQuota({
                        month: monthKey,
                        totalQuota: config_1.config.monthlySubsidyQuota,
                        usedAmount: 0,
                        remainingAmount: config_1.config.monthlySubsidyQuota,
                    });
                }
                orderNo = (0, subsidy_1.generateOrderNo)();
                order = new Order_1.Order({
                    orderNo: orderNo,
                    elderlyId: elderlyId,
                    canteenId: canteenId,
                    mealDate: mealDateObj,
                    mealType: mealType,
                    mealStandard: mealStandard,
                    mealPrice: mealPrice,
                    remark: remark,
                    deliveryType: deliveryType,
                    subsidyAmount: subsidy.totalSubsidy,
                    selfPayAmount: subsidy.selfPayAmount,
                    createdBy: (_d = req.user) === null || _d === void 0 ? void 0 : _d._id,
                });
                return [4 /*yield*/, order.save()];
            case 5:
                _e.sent();
                return [4 /*yield*/, order.populate("elderlyId", "name age phone")];
            case 6:
                _e.sent();
                return [4 /*yield*/, order.populate("canteenId", "name")];
            case 7:
                _e.sent();
                res.status(201).json(order);
                return [3 /*break*/, 9];
            case 8:
                error_3 = _e.sent();
                console.error(error_3);
                res.status(500).json({ message: error_3.message || "创建订单失败" });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
router.patch("/:id/status", (0, auth_1.requireRoles)("admin", "canteen"), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status_2, validStatuses, order, elderly, subsidy, monthKey, existingRecord, subsidyRecord, quota, error_4;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 11, , 12]);
                status_2 = req.body.status;
                validStatuses = [
                    "ordered",
                    "confirmed",
                    "preparing",
                    "ready",
                    "completed",
                    "cancelled",
                ];
                if (!validStatuses.includes(status_2)) {
                    return [2 /*return*/, res.status(400).json({ message: "无效的订单状态" })];
                }
                return [4 /*yield*/, Order_1.Order.findById(req.params.id)];
            case 1:
                order = _c.sent();
                if (!order) {
                    return [2 /*return*/, res.status(404).json({ message: "订单不存在" })];
                }
                if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) === "canteen" &&
                    order.canteenId.toString() !== ((_b = req.user.canteenId) === null || _b === void 0 ? void 0 : _b.toString())) {
                    return [2 /*return*/, res.status(403).json({ message: "无权操作此订单" })];
                }
                order.status = status_2;
                if (status_2 === "confirmed") {
                    order.confirmedAt = new Date();
                }
                if (!(status_2 === "completed")) return [3 /*break*/, 7];
                order.completedAt = new Date();
                return [4 /*yield*/, Elderly_1.Elderly.findById(order.elderlyId)];
            case 2:
                elderly = _c.sent();
                if (!elderly) return [3 /*break*/, 7];
                subsidy = (0, subsidy_1.calculateSubsidy)(elderly, order.mealPrice);
                monthKey = (0, subsidy_1.getMonthKey)(order.mealDate);
                return [4 /*yield*/, SubsidyRecord_1.SubsidyRecord.findOne({
                        orderId: order._id,
                    })];
            case 3:
                existingRecord = _c.sent();
                if (!!existingRecord) return [3 /*break*/, 7];
                subsidyRecord = new SubsidyRecord_1.SubsidyRecord({
                    orderId: order._id,
                    elderlyId: order.elderlyId,
                    canteenId: order.canteenId,
                    mealDate: order.mealDate,
                    subsidyCategory: elderly.subsidyCategory,
                    baseSubsidy: subsidy.baseSubsidy,
                    seniorSubsidy: subsidy.seniorSubsidy,
                    totalSubsidy: subsidy.totalSubsidy,
                    mealPrice: order.mealPrice,
                    selfPayAmount: subsidy.selfPayAmount,
                    month: monthKey,
                    settled: true,
                });
                return [4 /*yield*/, subsidyRecord.save()];
            case 4:
                _c.sent();
                return [4 /*yield*/, MonthlySubsidyQuota_1.MonthlySubsidyQuota.findOne({ month: monthKey })];
            case 5:
                quota = _c.sent();
                if (!quota) {
                    quota = new MonthlySubsidyQuota_1.MonthlySubsidyQuota({
                        month: monthKey,
                        totalQuota: config_1.config.monthlySubsidyQuota,
                        usedAmount: 0,
                        remainingAmount: config_1.config.monthlySubsidyQuota,
                    });
                }
                quota.usedAmount += subsidy.totalSubsidy;
                quota.remainingAmount = quota.totalQuota - quota.usedAmount;
                if (quota.remainingAmount <= 0) {
                    quota.status = "exhausted";
                    quota.remainingAmount = 0;
                }
                return [4 /*yield*/, quota.save()];
            case 6:
                _c.sent();
                _c.label = 7;
            case 7: return [4 /*yield*/, order.save()];
            case 8:
                _c.sent();
                return [4 /*yield*/, order.populate("elderlyId", "name age phone")];
            case 9:
                _c.sent();
                return [4 /*yield*/, order.populate("canteenId", "name")];
            case 10:
                _c.sent();
                res.json(order);
                return [3 /*break*/, 12];
            case 11:
                error_4 = _c.sent();
                console.error(error_4);
                res.status(500).json({ message: "更新订单状态失败" });
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); });
router.patch("/:id/delivery", (0, auth_1.requireRoles)("admin", "canteen"), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, volunteerName, estimatedTime, order, error_5;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 5, , 6]);
                _a = req.body, volunteerName = _a.volunteerName, estimatedTime = _a.estimatedTime;
                return [4 /*yield*/, Order_1.Order.findById(req.params.id)];
            case 1:
                order = _d.sent();
                if (!order) {
                    return [2 /*return*/, res.status(404).json({ message: "订单不存在" })];
                }
                if (((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) === "canteen" &&
                    order.canteenId.toString() !== ((_c = req.user.canteenId) === null || _c === void 0 ? void 0 : _c.toString())) {
                    return [2 /*return*/, res.status(403).json({ message: "无权操作此订单" })];
                }
                order.deliveryType = "delivery";
                order.deliveryInfo = {
                    volunteerName: volunteerName,
                    estimatedTime: estimatedTime,
                };
                return [4 /*yield*/, order.save()];
            case 2:
                _d.sent();
                return [4 /*yield*/, order.populate("elderlyId", "name age phone")];
            case 3:
                _d.sent();
                return [4 /*yield*/, order.populate("canteenId", "name")];
            case 4:
                _d.sent();
                res.json(order);
                return [3 /*break*/, 6];
            case 5:
                error_5 = _d.sent();
                res.status(500).json({ message: "设置配送信息失败" });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
router.delete("/:id", (0, auth_1.requireRoles)("admin", "worker"), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var order, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, Order_1.Order.findById(req.params.id)];
            case 1:
                order = _a.sent();
                if (!order) {
                    return [2 /*return*/, res.status(404).json({ message: "订单不存在" })];
                }
                order.status = "cancelled";
                return [4 /*yield*/, order.save()];
            case 2:
                _a.sent();
                res.json({ message: "订单已取消" });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _a.sent();
                res.status(500).json({ message: "取消订单失败" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
