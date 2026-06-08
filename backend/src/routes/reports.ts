import { Router, Request, Response } from "express";
import dayjs from "dayjs";
import { Report, ReportType } from "../models/Report";
import { authMiddleware } from "../middleware/auth";
import {
  getPeriodRange,
  getPreviousPeriod,
  getSamePeriodLastYear,
  generateReportStats,
  getCompareMetrics,
  METRIC_LABELS,
} from "../utils/report";

const router = Router();

router.use(authMiddleware);

router.get("/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { period, date, autoGenerate = "true" } = req.query;

    const reportType = type as ReportType;
    if (!["daily", "monthly", "quarterly"].includes(reportType)) {
      return res.status(400).json({ message: "不支持的报表类型" });
    }

    let targetPeriod: string;
    let targetDate: Date;

    if (period) {
      targetPeriod = period as string;
      if (reportType === "daily") {
        targetDate = dayjs(targetPeriod).toDate();
      } else if (reportType === "monthly") {
        targetDate = dayjs(`${targetPeriod}-01`).toDate();
      } else {
        const [year, q] = targetPeriod.split("-Q");
        targetDate = dayjs(`${year}-01-01`)
          .month((Number(q) - 1) * 3)
          .toDate();
      }
    } else if (date) {
      targetDate = new Date(date as string);
    } else {
      targetDate = new Date();
    }

    const periodRange = getPeriodRange(reportType, targetDate);
    targetPeriod = periodRange.period;

    let report = await Report.findOne({ reportType, period: targetPeriod });

    if (!report && autoGenerate === "true") {
      report = await generateAndSaveReport(reportType, periodRange);
    }

    if (report) {
      await loadComparisonData(report);
    }

    res.json(report || null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "获取报表失败" });
  }
});

router.post("/:type/generate", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { period } = req.body;

    const reportType = type as ReportType;
    if (!["daily", "monthly", "quarterly"].includes(reportType)) {
      return res.status(400).json({ message: "不支持的报表类型" });
    }

    let targetDate: Date;
    if (reportType === "daily") {
      targetDate = dayjs(period).toDate();
    } else if (reportType === "monthly") {
      targetDate = dayjs(`${period}-01`).toDate();
    } else {
      const [year, q] = period.split("-Q");
      targetDate = dayjs(`${year}-01-01`)
        .month((Number(q) - 1) * 3)
        .toDate();
    }

    const periodRange = getPeriodRange(reportType, targetDate);

    const existingReport = await Report.findOne({
      reportType,
      period: periodRange.period,
    });
    if (existingReport && existingReport.status === "locked") {
      return res.status(400).json({ message: "报表已锁定，无法重新生成" });
    }

    const report = await generateAndSaveReport(
      reportType,
      periodRange,
      existingReport?._id,
    );
    await loadComparisonData(report);

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "生成报表失败" });
  }
});

router.put("/:id/adjust", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { adjustments } = req.body;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "报表不存在" });
    }

    if (report.status === "locked") {
      return res.status(400).json({ message: "报表已锁定，无法调整" });
    }

    report.adjustments = { ...report.adjustments, ...adjustments };
    report.markModified("adjustments");

    await report.save();
    await loadComparisonData(report);

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "调整报表失败" });
  }
});

router.put("/:id/confirm", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "报表不存在" });
    }

    if (report.status === "locked") {
      return res.status(400).json({ message: "报表已锁定" });
    }

    report.status = "confirmed";
    report.confirmedBy = (req as any).user?._id;
    report.confirmedAt = new Date();

    await report.save();
    await loadComparisonData(report);

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "确认报表失败" });
  }
});

router.put("/:id/lock", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "报表不存在" });
    }

    report.status = "locked";
    await report.save();
    await loadComparisonData(report);

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "锁定报表失败" });
  }
});

router.get("/list/:type", async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const { page = 1, pageSize = 20 } = req.query;

    const reportType = type as ReportType;
    if (!["daily", "monthly", "quarterly"].includes(reportType)) {
      return res.status(400).json({ message: "不支持的报表类型" });
    }

    const skip = (Number(page) - 1) * Number(pageSize);

    const [reports, total] = await Promise.all([
      Report.find({ reportType })
        .sort({ period: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      Report.countDocuments({ reportType }),
    ]);

    res.json({
      list: reports,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "获取报表列表失败" });
  }
});

async function generateAndSaveReport(
  reportType: ReportType,
  periodRange: { start: Date; end: Date; period: string },
  existingId?: any,
) {
  const stats = await generateReportStats(
    reportType,
    periodRange.start,
    periodRange.end,
  );

  if (existingId) {
    const report = await Report.findById(existingId);
    if (report) {
      Object.assign(report, {
        ...stats,
        startDate: periodRange.start,
        endDate: periodRange.end,
        generatedAt: new Date(),
        status: "draft",
      });
      report.markModified("canteenStats");
      report.markModified("mealTypeStats");
      report.markModified("subsidyCategoryStats");
      report.markModified("compareData");
      await report.save();
      return report;
    }
  }

  const report = new Report({
    reportType,
    period: periodRange.period,
    startDate: periodRange.start,
    endDate: periodRange.end,
    ...stats,
    adjustments: {},
  });

  await report.save();
  return report;
}

async function loadComparisonData(report: any) {
  try {
    const momPeriod = getPreviousPeriod(report.reportType, report.period);
    const yoyPeriod = getSamePeriodLastYear(report.reportType, report.period);

    const [momReport, yoyReport] = await Promise.all([
      Report.findOne({
        reportType: report.reportType,
        period: momPeriod.period,
      }),
      Report.findOne({
        reportType: report.reportType,
        period: yoyPeriod.period,
      }),
    ]);

    let momStats: Record<string, number> | null = null;
    let yoyStats: Record<string, number> | null = null;

    if (momReport) {
      momStats = getCompareMetrics(momReport.toObject());
    } else {
      const momStatsRaw = await generateReportStats(
        report.reportType,
        momPeriod.start,
        momPeriod.end,
      );
      momStats = getCompareMetrics(momStatsRaw);
    }

    if (yoyReport) {
      yoyStats = getCompareMetrics(yoyReport.toObject());
    } else {
      const yoyStatsRaw = await generateReportStats(
        report.reportType,
        yoyPeriod.start,
        yoyPeriod.end,
      );
      yoyStats = getCompareMetrics(yoyStatsRaw);
    }

    const currentMetrics = getCompareMetrics(report.toObject());

    const mom = calculateChangeRates(currentMetrics, momStats);
    const yoy = calculateChangeRates(currentMetrics, yoyStats);

    const abnormalMetrics: string[] = [];
    for (const [key, rate] of Object.entries({ ...mom, ...yoy })) {
      if (rate !== null && Math.abs(rate) > 30) {
        const label = METRIC_LABELS[key] || key;
        if (!abnormalMetrics.includes(label)) {
          abnormalMetrics.push(label);
        }
      }
    }

    report.compareData = {
      mom,
      yoy,
      abnormalMetrics,
    };
    report.markModified("compareData");
  } catch (error) {
    console.error("加载对比数据失败:", error);
    report.compareData = {
      mom: {},
      yoy: {},
      abnormalMetrics: [],
    };
  }
}

function calculateChangeRates(
  current: Record<string, number>,
  previous: Record<string, number> | null,
): Record<string, number | null> {
  if (!previous) return {};

  const result: Record<string, number | null> = {};
  for (const key of Object.keys(current)) {
    const curr = current[key];
    const prev = previous[key];

    if (prev === undefined || prev === null || prev === 0) {
      result[key] = null;
    } else {
      const rate = ((curr - prev) / prev) * 100;
      result[key] = Math.round(rate * 100) / 100;
    }
  }
  return result;
}

export default router;
