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
var Elderly_1 = require("../models/Elderly");
var auth_1 = require("../middleware/auth");
var router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
router.use((0, auth_1.requireRoles)("admin", "worker"));
router.get("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, page, _c, pageSize, _d, keyword, _e, community, _f, subsidyCategory, query, pageNum, size, skip, _g, total, list, error_1;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _h.trys.push([0, 2, , 3]);
                _a = req.query, _b = _a.page, page = _b === void 0 ? "1" : _b, _c = _a.pageSize, pageSize = _c === void 0 ? "10" : _c, _d = _a.keyword, keyword = _d === void 0 ? "" : _d, _e = _a.community, community = _e === void 0 ? "" : _e, _f = _a.subsidyCategory, subsidyCategory = _f === void 0 ? "" : _f;
                query = {};
                if (keyword) {
                    query.$or = [
                        { name: { $regex: keyword, $options: "i" } },
                        { idCard: { $regex: keyword, $options: "i" } },
                        { phone: { $regex: keyword, $options: "i" } },
                    ];
                }
                if (community)
                    query.community = community;
                if (subsidyCategory)
                    query.subsidyCategory = subsidyCategory;
                pageNum = parseInt(page, 10);
                size = parseInt(pageSize, 10);
                skip = (pageNum - 1) * size;
                return [4 /*yield*/, Promise.all([
                        Elderly_1.Elderly.countDocuments(query),
                        Elderly_1.Elderly.find(query)
                            .populate("canteenId", "name")
                            .skip(skip)
                            .limit(size)
                            .sort({ createdAt: -1 }),
                    ])];
            case 1:
                _g = _h.sent(), total = _g[0], list = _g[1];
                res.json({
                    total: total,
                    list: list,
                    page: pageNum,
                    pageSize: size,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _h.sent();
                res.status(500).json({ message: "获取老人列表失败" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.get("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var elderly, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Elderly_1.Elderly.findById(req.params.id).populate("canteenId", "name")];
            case 1:
                elderly = _a.sent();
                if (!elderly) {
                    return [2 /*return*/, res.status(404).json({ message: "老人信息不存在" })];
                }
                res.json(elderly);
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({ message: "获取老人信息失败" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.post("/", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var elderly, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                elderly = new Elderly_1.Elderly(req.body);
                return [4 /*yield*/, elderly.save()];
            case 1:
                _a.sent();
                return [4 /*yield*/, elderly.populate("canteenId", "name")];
            case 2:
                _a.sent();
                res.status(201).json(elderly);
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                if (error_3.code === 11000) {
                    return [2 /*return*/, res.status(400).json({ message: "身份证号已存在" })];
                }
                res.status(500).json({ message: "创建老人信息失败" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
router.put("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var elderly, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Elderly_1.Elderly.findByIdAndUpdate(req.params.id, req.body, {
                        new: true,
                        runValidators: true,
                    }).populate("canteenId", "name")];
            case 1:
                elderly = _a.sent();
                if (!elderly) {
                    return [2 /*return*/, res.status(404).json({ message: "老人信息不存在" })];
                }
                res.json(elderly);
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                if (error_4.code === 11000) {
                    return [2 /*return*/, res.status(400).json({ message: "身份证号已存在" })];
                }
                res.status(500).json({ message: "更新老人信息失败" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
router.delete("/:id", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var elderly, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Elderly_1.Elderly.findByIdAndDelete(req.params.id)];
            case 1:
                elderly = _a.sent();
                if (!elderly) {
                    return [2 /*return*/, res.status(404).json({ message: "老人信息不存在" })];
                }
                res.json({ message: "删除成功" });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                res.status(500).json({ message: "删除老人信息失败" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
