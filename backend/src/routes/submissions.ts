import { Router, Request, Response } from "express";
import { SubmissionRecord } from "../models/SubmissionRecord";
import { Report, ReportType } from "../models/Report";
import { authMiddleware } from "../middleware/auth";
import { getPeriodRange, generateReportStats } from "../utils/report";
import dayjs from "dayjs";

const router = Router();

router.use(authMiddleware);

const SUBMISSION_FIELDS = [
  { key: "period", label: "统计周期" },
  { key: "reportType", label: "报表类型" },
  { key: "totalOrders", label: "总订单数" },
  { key: "mealPersonTimes", label: "就餐人次" },
  { key: "revenue", label: "营业额(元)" },
  { key: "subsidyAmount", label: "补贴发放额(元)" },
  { key: "selfPayAmount", label: "自费金额(元)" },
  { key: "newElderlyCount", label: "新增老人数" },
  { key: "activeElderlyCount", label: "活跃老人数" },
  { key: "totalElderlyCount", label: "服务老人总数" },
  { key: "subsidyCoverageRate", label: "补贴覆盖率(%)" },
  { key: "lunchCount", label: "午餐人次" },
  { key: "dinnerCount", label: "晚餐人次" },
  { key: "canteenCount", label: "助餐点数量" },
];

router.get("/fields", async (req: Request, res: Response) => {
  res.json(SUBMISSION_FIELDS);
});

router.post("/generate", async (req: Request, res: Response) => {
  try {
    const { reportType, period } = req.body;

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

    const periodRange = getPeriodRange(reportType as ReportType, targetDate);

    let report = await Report.findOne({
      reportType,
      period: periodRange.period,
    });
    let stats: any;

    if (report) {
      stats = report.toObject();
    } else {
      stats = await generateReportStats(
        reportType as ReportType,
        periodRange.start,
        periodRange.end,
      );
    }

    const submissionData = buildSubmissionData(
      reportType,
      periodRange.period,
      stats,
    );

    const validationErrors = validateSubmissionData(submissionData, stats);

    const submissionNo = generateSubmissionNo(reportType, periodRange.period);

    let submission = await SubmissionRecord.findOne({
      reportType,
      period: periodRange.period,
      status: "draft",
    });

    if (submission) {
      submission.data = submissionData;
      submission.validationErrors = validationErrors;
      submission.submissionNo = submissionNo;
      await submission.save();
    } else {
      submission = new SubmissionRecord({
        reportId: report?._id || null,
        reportType,
        period: periodRange.period,
        status: "draft",
        submissionNo,
        data: submissionData,
        validationErrors,
      });
      await submission.save();
    }

    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "生成上报表失败" });
  }
});

router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const submission = await SubmissionRecord.findById(id);

    if (!submission) {
      return res.status(404).json({ message: "上报记录不存在" });
    }

    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "获取上报记录失败" });
  }
});

router.get("/", async (req: Request, res: Response) => {
  try {
    const { reportType, status, page = 1, pageSize = 20 } = req.query;

    const filter: any = {};
    if (reportType) filter.reportType = reportType;
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(pageSize);

    const [submissions, total] = await Promise.all([
      SubmissionRecord.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(pageSize)),
      SubmissionRecord.countDocuments(filter),
    ]);

    res.json({
      list: submissions,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "获取上报列表失败" });
  }
});

router.put("/:id/confirm", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const submission = await SubmissionRecord.findById(id);
    if (!submission) {
      return res.status(404).json({ message: "上报记录不存在" });
    }

    if (submission.status !== "draft") {
      return res.status(400).json({ message: "只有草稿状态可以确认" });
    }

    if (submission.validationErrors.length > 0) {
      return res.status(400).json({
        message: "数据校验未通过，请先修正问题",
        errors: submission.validationErrors,
      });
    }

    submission.status = "confirmed";
    submission.confirmedBy = (req as any).user?._id;
    submission.confirmedAt = new Date();

    await submission.save();
    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "确认上报失败" });
  }
});

router.put("/:id/submit", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const submission = await SubmissionRecord.findById(id);
    if (!submission) {
      return res.status(404).json({ message: "上报记录不存在" });
    }

    if (submission.status !== "confirmed") {
      return res.status(400).json({ message: "只有已确认状态可以上报" });
    }

    submission.status = "submitted";
    submission.submittedBy = (req as any).user?._id;
    submission.submittedAt = new Date();

    await submission.save();
    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "上报失败" });
  }
});

router.post("/validate", async (req: Request, res: Response) => {
  try {
    const { reportType, period } = req.body;

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

    const periodRange = getPeriodRange(reportType as ReportType, targetDate);
    const stats = await generateReportStats(
      reportType as ReportType,
      periodRange.start,
      periodRange.end,
    );

    const submissionData = buildSubmissionData(
      reportType,
      periodRange.period,
      stats,
    );
    const errors = validateSubmissionData(submissionData, stats);

    res.json({
      valid: errors.length === 0,
      errors,
      data: submissionData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "数据校验失败" });
  }
});

function buildSubmissionData(
  reportType: string,
  period: string,
  stats: any,
): Record<string, any> {
  const reportTypeNames: Record<string, string> = {
    daily: "日报",
    monthly: "月报",
    quarterly: "季报",
  };

  return {
    period,
    reportType: reportTypeNames[reportType] || reportType,
    totalOrders: stats.totalOrders || 0,
    mealPersonTimes: stats.mealPersonTimes || 0,
    revenue: Number((stats.revenue || 0).toFixed(2)),
    subsidyAmount: Number((stats.subsidyAmount || 0).toFixed(2)),
    selfPayAmount: Number((stats.selfPayAmount || 0).toFixed(2)),
    newElderlyCount: stats.newElderlyCount || 0,
    activeElderlyCount: stats.activeElderlyCount || 0,
    totalElderlyCount: stats.totalElderlyCount || 0,
    subsidyCoverageRate: Number(
      ((stats.subsidyCoverageRate || 0) * 100).toFixed(2),
    ),
    lunchCount: stats.mealTypeStats?.lunch || 0,
    dinnerCount: stats.mealTypeStats?.dinner || 0,
    canteenCount: stats.canteenStats?.length || 0,
    canteenDetails: stats.canteenStats || [],
  };
}

function validateSubmissionData(
  data: Record<string, any>,
  stats: any,
): string[] {
  const errors: string[] = [];

  if (data.totalOrders > 0 && data.mealPersonTimes === 0) {
    errors.push("有订单但就餐人次为0，请检查数据");
  }

  if (data.subsidyAmount > data.revenue) {
    errors.push("补贴发放额大于营业额，请检查数据");
  }

  if (data.subsidyAmount < 0 || data.revenue < 0 || data.selfPayAmount < 0) {
    errors.push("金额不能为负数");
  }

  if (data.lunchCount + data.dinnerCount !== data.mealPersonTimes) {
    errors.push("午餐人次 + 晚餐人次 不等于 总就餐人次");
  }

  if (stats.canteenStats && stats.canteenStats.length > 0) {
    const canteenTotal = stats.canteenStats.reduce(
      (sum: number, c: any) => sum + c.mealCount,
      0,
    );
    if (canteenTotal !== data.mealPersonTimes) {
      errors.push("各助餐点就餐量之和不等于总就餐人次");
    }

    const canteenRevenue = stats.canteenStats.reduce(
      (sum: number, c: any) => sum + c.revenue,
      0,
    );
    if (Math.abs(canteenRevenue - data.revenue) > 0.01) {
      errors.push("各助餐点营业额之和不等于总营业额");
    }
  }

  if (data.activeElderlyCount > data.totalElderlyCount) {
    errors.push("活跃老人数不能大于服务老人总数");
  }

  if (data.subsidyCoverageRate < 0 || data.subsidyCoverageRate > 100) {
    errors.push("补贴覆盖率应在0%-100%之间");
  }

  return errors;
}

function generateSubmissionNo(reportType: string, period: string): string {
  const typeCode =
    reportType === "daily" ? "D" : reportType === "monthly" ? "M" : "Q";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `SUB-${typeCode}-${period.replace(/[-Q]/g, "")}-${timestamp}${random}`;
}

export default router;
