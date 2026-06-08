import { Router, Request, Response } from "express";
import { Report, ReportType } from "../models/Report";
import { authMiddleware } from "../middleware/auth";
import {
  getPeriodRange,
  generateReportStats,
  METRIC_LABELS,
} from "../utils/report";
import dayjs from "dayjs";

const router = Router();

router.use(authMiddleware);

router.get("/:type/:period/csv", async (req: Request, res: Response) => {
  try {
    const { type, period } = req.params;
    const reportType = type as ReportType;

    let report = await Report.findOne({ reportType, period });

    let stats: any;
    if (report) {
      stats = report.toObject();
    } else {
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
      stats = await generateReportStats(
        reportType,
        periodRange.start,
        periodRange.end,
      );
    }

    const csvContent = generateCSV(stats, reportType, period);
    const filename = `${reportType}_report_${period}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send("\uFEFF" + csvContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "导出CSV失败" });
  }
});

router.get("/:type/:period/html", async (req: Request, res: Response) => {
  try {
    const { type, period } = req.params;
    const reportType = type as ReportType;

    let report = await Report.findOne({ reportType, period });

    let stats: any;
    if (report) {
      stats = report.toObject();
    } else {
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
      stats = await generateReportStats(
        reportType,
        periodRange.start,
        periodRange.end,
      );
    }

    const htmlContent = generatePrintHTML(stats, reportType, period);
    const filename = `${reportType}_report_${period}.html`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.send(htmlContent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "导出HTML失败" });
  }
});

function generateCSV(stats: any, reportType: string, period: string): string {
  const lines: string[] = [];
  const typeNames: Record<string, string> = {
    daily: "日报",
    monthly: "月报",
    quarterly: "季报",
  };

  lines.push(`助餐服务运营${typeNames[reportType] || reportType}`);
  lines.push(`统计周期,${period}`);
  lines.push("");

  lines.push("核心指标");
  lines.push("指标名称,数值");
  lines.push(`总订单数,${stats.totalOrders || 0}`);
  lines.push(`就餐人次,${stats.mealPersonTimes || 0}`);
  lines.push(`营业额(元),${(stats.revenue || 0).toFixed(2)}`);
  lines.push(`补贴发放额(元),${(stats.subsidyAmount || 0).toFixed(2)}`);
  lines.push(`自费金额(元),${(stats.selfPayAmount || 0).toFixed(2)}`);
  lines.push(`新增老人数,${stats.newElderlyCount || 0}`);
  lines.push(`活跃老人数,${stats.activeElderlyCount || 0}`);
  lines.push(`服务老人总数,${stats.totalElderlyCount || 0}`);
  lines.push(
    `补贴覆盖率,${((stats.subsidyCoverageRate || 0) * 100).toFixed(2)}%`,
  );
  if (stats.averageDailyMeals !== undefined) {
    lines.push(`日均就餐人次,${stats.averageDailyMeals.toFixed(1)}`);
  }
  lines.push("");

  lines.push("各餐段分布");
  lines.push("餐段,人次,占比");
  const totalMeals =
    (stats.mealTypeStats?.lunch || 0) + (stats.mealTypeStats?.dinner || 0);
  lines.push(
    `午餐,${stats.mealTypeStats?.lunch || 0},${totalMeals > 0 ? (((stats.mealTypeStats?.lunch || 0) / totalMeals) * 100).toFixed(2) : 0}%`,
  );
  lines.push(
    `晚餐,${stats.mealTypeStats?.dinner || 0},${totalMeals > 0 ? (((stats.mealTypeStats?.dinner || 0) / totalMeals) * 100).toFixed(2) : 0}%`,
  );
  lines.push("");

  lines.push("各助餐点运营数据");
  lines.push("助餐点名称,就餐人次,营业额(元),补贴发放额(元),自费金额(元)");
  if (stats.canteenStats && stats.canteenStats.length > 0) {
    for (const c of stats.canteenStats) {
      lines.push(
        `${c.canteenName},${c.mealCount},${c.revenue.toFixed(2)},${c.subsidyAmount.toFixed(2)},${c.selfPayAmount.toFixed(2)}`,
      );
    }
  }
  lines.push("");

  lines.push("各类别老人就餐分布");
  lines.push("类别,人次,补贴金额(元),占比");
  if (stats.subsidyCategoryStats && stats.subsidyCategoryStats.length > 0) {
    for (const cat of stats.subsidyCategoryStats) {
      lines.push(
        `${cat.categoryName},${cat.count},${cat.amount.toFixed(2)},${totalMeals > 0 ? ((cat.count / totalMeals) * 100).toFixed(2) : 0}%`,
      );
    }
  }

  return lines.join("\n");
}

function generatePrintHTML(
  stats: any,
  reportType: string,
  period: string,
): string {
  const typeNames: Record<string, string> = {
    daily: "日报",
    monthly: "月报",
    quarterly: "季报",
  };

  const totalMeals =
    (stats.mealTypeStats?.lunch || 0) + (stats.mealTypeStats?.dinner || 0);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>助餐服务运营${typeNames[reportType] || reportType} - ${period}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Microsoft YaHei", "PingFang SC", sans-serif; padding: 30px; background: #fff; color: #333; }
    .report-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #1890ff; padding-bottom: 20px; }
    .report-title { font-size: 28px; font-weight: bold; color: #1890ff; margin-bottom: 10px; }
    .report-period { font-size: 16px; color: #666; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; color: #333; margin-bottom: 15px; padding-left: 10px; border-left: 4px solid #1890ff; }
    .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; }
    .metric-card { background: #f5f9ff; border-radius: 8px; padding: 20px; text-align: center; }
    .metric-value { font-size: 28px; font-weight: bold; color: #1890ff; margin-bottom: 5px; }
    .metric-label { font-size: 14px; color: #666; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e8e8e8; padding: 12px; text-align: left; font-size: 14px; }
    th { background: #f0f7ff; color: #1890ff; font-weight: 600; }
    tr:nth-child(even) { background: #fafafa; }
    .footer { margin-top: 40px; text-align: right; color: #999; font-size: 12px; }
    @media print {
      body { padding: 20px; }
      .metric-card { break-inside: avoid; }
      .section { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="report-header">
    <div class="report-title">助餐服务运营${typeNames[reportType] || reportType}</div>
    <div class="report-period">统计周期：${period}</div>
  </div>

  <div class="section">
    <div class="section-title">核心指标</div>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-value">${stats.totalOrders || 0}</div>
        <div class="metric-label">总订单数</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${stats.mealPersonTimes || 0}</div>
        <div class="metric-label">就餐人次</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">¥${(stats.revenue || 0).toFixed(2)}</div>
        <div class="metric-label">营业额</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">¥${(stats.subsidyAmount || 0).toFixed(2)}</div>
        <div class="metric-label">补贴发放额</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">¥${(stats.selfPayAmount || 0).toFixed(2)}</div>
        <div class="metric-label">自费金额</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${stats.activeElderlyCount || 0}</div>
        <div class="metric-label">活跃老人数</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${stats.newElderlyCount || 0}</div>
        <div class="metric-label">新增老人数</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${((stats.subsidyCoverageRate || 0) * 100).toFixed(1)}%</div>
        <div class="metric-label">补贴覆盖率</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">各餐段分布</div>
    <table>
      <thead>
        <tr><th>餐段</th><th>人次</th><th>占比</th></tr>
      </thead>
      <tbody>
        <tr><td>午餐</td><td>${stats.mealTypeStats?.lunch || 0}</td><td>${totalMeals > 0 ? (((stats.mealTypeStats?.lunch || 0) / totalMeals) * 100).toFixed(2) : 0}%</td></tr>
        <tr><td>晚餐</td><td>${stats.mealTypeStats?.dinner || 0}</td><td>${totalMeals > 0 ? (((stats.mealTypeStats?.dinner || 0) / totalMeals) * 100).toFixed(2) : 0}%</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">各助餐点运营数据</div>
    <table>
      <thead>
        <tr><th>助餐点名称</th><th>就餐人次</th><th>营业额(元)</th><th>补贴发放额(元)</th><th>自费金额(元)</th></tr>
      </thead>
      <tbody>
        ${(stats.canteenStats || [])
          .map(
            (c: any) => `
          <tr>
            <td>${c.canteenName}</td>
            <td>${c.mealCount}</td>
            <td>${c.revenue.toFixed(2)}</td>
            <td>${c.subsidyAmount.toFixed(2)}</td>
            <td>${c.selfPayAmount.toFixed(2)}</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">各类别老人就餐分布</div>
    <table>
      <thead>
        <tr><th>类别</th><th>人次</th><th>补贴金额(元)</th><th>占比</th></tr>
      </thead>
      <tbody>
        ${(stats.subsidyCategoryStats || [])
          .map(
            (cat: any) => `
          <tr>
            <td>${cat.categoryName}</td>
            <td>${cat.count}</td>
            <td>${cat.amount.toFixed(2)}</td>
            <td>${totalMeals > 0 ? ((cat.count / totalMeals) * 100).toFixed(2) : 0}%</td>
          </tr>
        `,
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <div class="footer">
    报表生成时间：${new Date().toLocaleString("zh-CN")}
  </div>
</body>
</html>`;
}

export default router;
