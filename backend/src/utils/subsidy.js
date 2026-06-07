"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SENIOR_AGE_THRESHOLD = exports.SENIOR_SUBSIDY = exports.SUBSIDY_RATES = exports.MEAL_PRICES = void 0;
exports.calculateSubsidy = calculateSubsidy;
exports.generateOrderNo = generateOrderNo;
exports.getMonthKey = getMonthKey;
exports.MEAL_PRICES = {
    A: 12,
    B: 15,
    C: 18,
};
exports.SUBSIDY_RATES = {
    low_income_full: 15,
    low_income: 10,
    normal: 5,
    senior_extra: 5,
};
exports.SENIOR_SUBSIDY = 3;
exports.SENIOR_AGE_THRESHOLD = 80;
function calculateSubsidy(elderly, mealPrice) {
    var baseSubsidy = exports.SUBSIDY_RATES[elderly.subsidyCategory];
    var seniorSubsidy = 0;
    if (elderly.age >= exports.SENIOR_AGE_THRESHOLD) {
        seniorSubsidy = exports.SENIOR_SUBSIDY;
    }
    var totalSubsidy = baseSubsidy + seniorSubsidy;
    var selfPayAmount = mealPrice - totalSubsidy;
    if (selfPayAmount < 0) {
        selfPayAmount = 0;
        totalSubsidy = mealPrice;
    }
    return {
        baseSubsidy: Math.min(baseSubsidy, totalSubsidy),
        seniorSubsidy: totalSubsidy > baseSubsidy ? totalSubsidy - baseSubsidy : 0,
        totalSubsidy: totalSubsidy,
        selfPayAmount: selfPayAmount,
    };
}
function generateOrderNo() {
    var now = new Date();
    var dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
    var random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
    return "ORD".concat(dateStr).concat(random);
}
function getMonthKey(date) {
    var year = date.getFullYear();
    var month = (date.getMonth() + 1).toString().padStart(2, "0");
    return "".concat(year, "-").concat(month);
}
