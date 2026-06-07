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
var db_1 = require("../db");
var User_1 = require("../models/User");
var Canteen_1 = require("../models/Canteen");
var Elderly_1 = require("../models/Elderly");
var Order_1 = require("../models/Order");
var SubsidyRecord_1 = require("../models/SubsidyRecord");
var MonthlySubsidyQuota_1 = require("../models/MonthlySubsidyQuota");
var subsidy_1 = require("../utils/subsidy");
var config_1 = require("../config");
var dayjs_1 = require("dayjs");
var canteenData = [
    {
        name: "幸福社区食堂",
        address: "幸福路128号幸福社区服务中心1楼",
        phone: "021-58881001",
        dailyCapacity: 50,
        businessHours: {
            lunch: "11:30-12:30",
            dinner: "17:30-18:30",
        },
    },
    {
        name: "阳光日间照料中心",
        address: "阳光大街56号阳光社区综合为老服务中心",
        phone: "021-58881002",
        dailyCapacity: 80,
        businessHours: {
            lunch: "11:00-12:30",
            dinner: "17:00-18:30",
        },
    },
    {
        name: "百合长者餐厅",
        address: "百合路88弄百合老年公寓内",
        phone: "021-58881003",
        dailyCapacity: 60,
        businessHours: {
            lunch: "11:15-12:15",
            dinner: "17:15-18:15",
        },
    },
];
var communities = [
    "幸福社区",
    "阳光社区",
    "百合社区",
    "和平社区",
    "新华社区",
];
var elderlyNames = [
    { name: "张桂芳", gender: "female" },
    { name: "李建国", gender: "male" },
    { name: "王秀英", gender: "female" },
    { name: "刘德明", gender: "male" },
    { name: "陈美华", gender: "female" },
    { name: "杨振华", gender: "male" },
    { name: "赵玉珍", gender: "female" },
    { name: "黄志强", gender: "male" },
    { name: "周金凤", gender: "female" },
    { name: "吴明辉", gender: "male" },
    { name: "徐桂兰", gender: "female" },
    { name: "孙伟国", gender: "male" },
    { name: "马丽华", gender: "female" },
    { name: "朱长根", gender: "male" },
    { name: "胡素珍", gender: "female" },
    { name: "郭建强", gender: "male" },
    { name: "何秀琴", gender: "female" },
    { name: "罗光明", gender: "male" },
    { name: "梁玉梅", gender: "female" },
    { name: "宋永福", gender: "male" },
];
var subsidyCategories = [
    "low_income_full",
    "low_income",
    "normal",
    "normal",
    "normal",
];
function randomIdCard(age, gender) {
    var year = new Date().getFullYear() - age;
    var month = String(Math.floor(Math.random() * 12) + 1).padStart(2, "0");
    var day = String(Math.floor(Math.random() * 28) + 1).padStart(2, "0");
    var area = "310101";
    var seq = String(Math.floor(Math.random() * 900) + 100);
    var genderDigit = gender === "male"
        ? Math.floor(Math.random() * 5) * 2 + 1
        : Math.floor(Math.random() * 5) * 2;
    var check = String(Math.floor(Math.random() * 10));
    return "".concat(area).concat(year).concat(month).concat(day).concat(seq).concat(genderDigit).concat(check);
}
function randomPhone() {
    var prefixes = ["138", "139", "158", "159", "189", "180", "136"];
    var prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    var suffix = String(Math.floor(Math.random() * 90000000) + 10000000);
    return prefix + suffix;
}
function seed() {
    return __awaiter(this, void 0, void 0, function () {
        var canteens, adminUser, canteenUsers, _i, canteenUsers_1, cu, user, workerUsers, _a, workerUsers_1, wu, user, elderlyList, i, age, person, canteenIndex, communityIndex, subsidyIndex, elderly, today, worker, orderCount, subsidyTotal, dayOffset, mealDate, i, elderly, mealTypes, mealType, standards, standard, mealPrice, subsidy, statuses, status_1, order, monthKey, subsidyRecord, currentMonth, monthRecords, monthUsed, quota;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log("开始初始化数据...");
                    return [4 /*yield*/, (0, db_1.connectDB)()];
                case 1:
                    _b.sent();
                    console.log("清理旧数据...");
                    return [4 /*yield*/, User_1.User.deleteMany({})];
                case 2:
                    _b.sent();
                    return [4 /*yield*/, Canteen_1.Canteen.deleteMany({})];
                case 3:
                    _b.sent();
                    return [4 /*yield*/, Elderly_1.Elderly.deleteMany({})];
                case 4:
                    _b.sent();
                    return [4 /*yield*/, Order_1.Order.deleteMany({})];
                case 5:
                    _b.sent();
                    return [4 /*yield*/, SubsidyRecord_1.SubsidyRecord.deleteMany({})];
                case 6:
                    _b.sent();
                    return [4 /*yield*/, MonthlySubsidyQuota_1.MonthlySubsidyQuota.deleteMany({})];
                case 7:
                    _b.sent();
                    console.log("创建助餐点...");
                    return [4 /*yield*/, Canteen_1.Canteen.insertMany(canteenData)];
                case 8:
                    canteens = _b.sent();
                    console.log("  \u5DF2\u521B\u5EFA ".concat(canteens.length, " \u4E2A\u52A9\u9910\u70B9"));
                    console.log("创建用户账号...");
                    adminUser = new User_1.User({
                        username: "admin",
                        password: "Pass@2024",
                        role: "admin",
                        name: "系统管理员",
                    });
                    return [4 /*yield*/, adminUser.save()];
                case 9:
                    _b.sent();
                    canteenUsers = [
                        {
                            username: "canteen1",
                            password: "cc123",
                            name: "幸福社区食堂管理员",
                            canteenIndex: 0,
                        },
                        {
                            username: "canteen2",
                            password: "cc123",
                            name: "阳光日间照料中心管理员",
                            canteenIndex: 1,
                        },
                        {
                            username: "canteen3",
                            password: "cc123",
                            name: "百合长者餐厅管理员",
                            canteenIndex: 2,
                        },
                    ];
                    _i = 0, canteenUsers_1 = canteenUsers;
                    _b.label = 10;
                case 10:
                    if (!(_i < canteenUsers_1.length)) return [3 /*break*/, 13];
                    cu = canteenUsers_1[_i];
                    user = new User_1.User({
                        username: cu.username,
                        password: cu.password,
                        role: "canteen",
                        name: cu.name,
                        canteenId: canteens[cu.canteenIndex]._id,
                    });
                    return [4 /*yield*/, user.save()];
                case 11:
                    _b.sent();
                    _b.label = 12;
                case 12:
                    _i++;
                    return [3 /*break*/, 10];
                case 13:
                    workerUsers = [
                        { username: "worker1", password: "wk123", name: "社区工作者小王" },
                        { username: "worker2", password: "wk123", name: "社区工作者小李" },
                    ];
                    _a = 0, workerUsers_1 = workerUsers;
                    _b.label = 14;
                case 14:
                    if (!(_a < workerUsers_1.length)) return [3 /*break*/, 17];
                    wu = workerUsers_1[_a];
                    user = new User_1.User({
                        username: wu.username,
                        password: wu.password,
                        role: "worker",
                        name: wu.name,
                    });
                    return [4 /*yield*/, user.save()];
                case 15:
                    _b.sent();
                    _b.label = 16;
                case 16:
                    _a++;
                    return [3 /*break*/, 14];
                case 17:
                    console.log("  已创建 6 个用户账号（1管理员 + 3助餐点 + 2社区工作者）");
                    console.log("创建老人信息...");
                    elderlyList = [];
                    i = 0;
                    _b.label = 18;
                case 18:
                    if (!(i < 20)) return [3 /*break*/, 21];
                    age = 65 + Math.floor(Math.random() * 26);
                    person = elderlyNames[i];
                    canteenIndex = i % 3;
                    communityIndex = i % communities.length;
                    subsidyIndex = i % subsidyCategories.length;
                    elderly = new Elderly_1.Elderly({
                        name: person.name,
                        idCard: randomIdCard(age, person.gender),
                        age: age,
                        gender: person.gender,
                        community: communities[communityIndex],
                        phone: randomPhone(),
                        address: "".concat(communities[communityIndex], "\u5C0F\u533A").concat(Math.floor(Math.random() * 20) + 1, "\u53F7\u697C").concat(Math.floor(Math.random() * 6) + 1, "0").concat(Math.floor(Math.random() * 9) + 1, "\u5BA4"),
                        subsidyCategory: subsidyCategories[subsidyIndex],
                        canteenId: canteens[canteenIndex]._id,
                        hasSeniorSubsidy: age >= 80,
                        status: "active",
                    });
                    return [4 /*yield*/, elderly.save()];
                case 19:
                    _b.sent();
                    elderlyList.push(elderly);
                    _b.label = 20;
                case 20:
                    i++;
                    return [3 /*break*/, 18];
                case 21:
                    console.log("  \u5DF2\u521B\u5EFA ".concat(elderlyList.length, " \u4F4D\u8001\u4EBA"));
                    console.log("创建模拟订单...");
                    today = (0, dayjs_1.default)();
                    return [4 /*yield*/, User_1.User.findOne({ username: "worker1" })];
                case 22:
                    worker = _b.sent();
                    orderCount = 0;
                    subsidyTotal = 0;
                    dayOffset = 0;
                    _b.label = 23;
                case 23:
                    if (!(dayOffset < 30)) return [3 /*break*/, 29];
                    mealDate = today.subtract(dayOffset, "day");
                    i = 0;
                    _b.label = 24;
                case 24:
                    if (!(i < elderlyList.length)) return [3 /*break*/, 28];
                    elderly = elderlyList[i];
                    if (Math.random() > 0.6)
                        return [3 /*break*/, 27];
                    mealTypes = ["lunch", "dinner"];
                    mealType = mealTypes[Math.floor(Math.random() * mealTypes.length)];
                    standards = ["A", "B", "C"];
                    standard = standards[Math.floor(Math.random() * standards.length)];
                    mealPrice = subsidy_1.MEAL_PRICES[standard];
                    subsidy = (0, subsidy_1.calculateSubsidy)(elderly, mealPrice);
                    statuses = [
                        "completed",
                        "completed",
                        "completed",
                        "ready",
                        "preparing",
                        "confirmed",
                        "ordered",
                    ];
                    status_1 = dayOffset === 0 ? statuses[Math.floor(Math.random() * 4)] : "completed";
                    order = new Order_1.Order({
                        orderNo: (0, subsidy_1.generateOrderNo)(),
                        elderlyId: elderly._id,
                        canteenId: elderly.canteenId,
                        mealDate: mealDate.toDate(),
                        mealType: mealType,
                        mealStandard: standard,
                        mealPrice: mealPrice,
                        remark: Math.random() > 0.8 ? "少盐少油" : "",
                        status: status_1,
                        deliveryType: Math.random() > 0.7 ? "delivery" : "pickup",
                        subsidyAmount: subsidy.totalSubsidy,
                        selfPayAmount: subsidy.selfPayAmount,
                        createdBy: worker === null || worker === void 0 ? void 0 : worker._id,
                        confirmedAt: status_1 !== "ordered" ? mealDate.toDate() : undefined,
                        completedAt: status_1 === "completed" ? mealDate.toDate() : undefined,
                    });
                    if (order.deliveryType === "delivery") {
                        order.deliveryInfo = {
                            volunteerName: ["张志愿者", "李志愿者", "王志愿者"][Math.floor(Math.random() * 3)],
                            estimatedTime: mealType === "lunch" ? "12:00" : "18:00",
                        };
                    }
                    return [4 /*yield*/, order.save()];
                case 25:
                    _b.sent();
                    orderCount++;
                    if (!(status_1 === "completed")) return [3 /*break*/, 27];
                    monthKey = (0, subsidy_1.getMonthKey)(mealDate.toDate());
                    subsidyRecord = new SubsidyRecord_1.SubsidyRecord({
                        orderId: order._id,
                        elderlyId: elderly._id,
                        canteenId: elderly.canteenId,
                        mealDate: mealDate.toDate(),
                        subsidyCategory: elderly.subsidyCategory,
                        baseSubsidy: subsidy.baseSubsidy,
                        seniorSubsidy: subsidy.seniorSubsidy,
                        totalSubsidy: subsidy.totalSubsidy,
                        mealPrice: mealPrice,
                        selfPayAmount: subsidy.selfPayAmount,
                        month: monthKey,
                        settled: true,
                    });
                    return [4 /*yield*/, subsidyRecord.save()];
                case 26:
                    _b.sent();
                    subsidyTotal += subsidy.totalSubsidy;
                    _b.label = 27;
                case 27:
                    i++;
                    return [3 /*break*/, 24];
                case 28:
                    dayOffset++;
                    return [3 /*break*/, 23];
                case 29:
                    currentMonth = (0, subsidy_1.getMonthKey)(today.toDate());
                    return [4 /*yield*/, SubsidyRecord_1.SubsidyRecord.find({ month: currentMonth })];
                case 30:
                    monthRecords = _b.sent();
                    monthUsed = monthRecords.reduce(function (sum, r) { return sum + r.totalSubsidy; }, 0);
                    quota = new MonthlySubsidyQuota_1.MonthlySubsidyQuota({
                        month: currentMonth,
                        totalQuota: config_1.config.monthlySubsidyQuota,
                        usedAmount: monthUsed,
                        remainingAmount: config_1.config.monthlySubsidyQuota - monthUsed,
                        status: config_1.config.monthlySubsidyQuota - monthUsed > 0 ? "active" : "exhausted",
                    });
                    return [4 /*yield*/, quota.save()];
                case 31:
                    _b.sent();
                    console.log("  \u5DF2\u521B\u5EFA ".concat(orderCount, " \u4E2A\u8BA2\u5355"));
                    console.log("  \u5DF2\u751F\u6210 ".concat(monthRecords.length, " \u6761\u8865\u8D34\u8BB0\u5F55"));
                    console.log("  \u672C\u6708\u5DF2\u4F7F\u7528\u8865\u8D34: ".concat(monthUsed.toFixed(2), " \u5143"));
                    console.log("\n数据初始化完成！");
                    console.log("\n账号信息：");
                    console.log("  管理员: admin / Pass@2024");
                    console.log("  助餐点1: canteen1 / cc123 (幸福社区食堂)");
                    console.log("  助餐点2: canteen2 / cc123 (阳光日间照料中心)");
                    console.log("  助餐点3: canteen3 / cc123 (百合长者餐厅)");
                    console.log("  社区工作者1: worker1 / wk123");
                    console.log("  社区工作者2: worker2 / wk123");
                    return [4 /*yield*/, (0, db_1.disconnectDB)()];
                case 32:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
seed().catch(function (err) {
    console.error("初始化数据失败:", err);
    process.exit(1);
});
