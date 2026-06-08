import request from "@/utils/request";
import axios from "axios";
import { useUserStore } from "@/stores/user";

export type ReportType = "daily" | "monthly" | "quarterly";

export interface CanteenMealStats {
  canteenId: string;
  canteenName: string;
  mealCount: number;
  revenue: number;
  subsidyAmount: number;
  selfPayAmount: number;
}

export interface MealTypeStats {
  lunch: number;
  dinner: number;
}

export interface SubsidyCategoryStats {
  category: string;
  categoryName: string;
  count: number;
  amount: number;
}

export interface ReportData {
  _id: string;
  reportType: ReportType;
  period: string;
  startDate: string;
  endDate: string;
  status: "draft" | "confirmed" | "locked";
  totalOrders: number;
  mealPersonTimes: number;
  revenue: number;
  subsidyAmount: number;
  selfPayAmount: number;
  newElderlyCount: number;
  activeElderlyCount: number;
  totalElderlyCount: number;
  subsidyCoverageRate: number;
  averageDailyMeals?: number;
  canteenStats: CanteenMealStats[];
  mealTypeStats: MealTypeStats;
  subsidyCategoryStats: SubsidyCategoryStats[];
  compareData?: {
    mom: Record<string, number | null>;
    yoy: Record<string, number | null>;
    abnormalMetrics: string[];
  };
  adjustments: Record<string, number>;
  confirmedBy?: string;
  confirmedAt?: string;
  generatedAt: string;
}

export function getReport(type: ReportType, period?: string) {
  return request.get<any, ReportData>(`/reports/${type}`, {
    params: { period },
  });
}

export function generateReport(type: ReportType, period: string) {
  return request.post<any, ReportData>(`/reports/${type}/generate`, { period });
}

export function adjustReport(id: string, adjustments: Record<string, number>) {
  return request.put<any, ReportData>(`/reports/${id}/adjust`, { adjustments });
}

export function confirmReport(id: string) {
  return request.put<any, ReportData>(`/reports/${id}/confirm`);
}

export function lockReport(id: string) {
  return request.put<any, ReportData>(`/reports/${id}/lock`);
}

export function getReportList(type: ReportType, page = 1, pageSize = 20) {
  return request.get<
    any,
    { list: ReportData[]; total: number; page: number; pageSize: number }
  >(`/reports/list/${type}`, {
    params: { page, pageSize },
  });
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportReportCSV(type: ReportType, period: string) {
  const userStore = useUserStore();
  const response = await axios.get(`/api/export/${type}/${period}/csv`, {
    headers: {
      Authorization: `Bearer ${userStore.token}`,
    },
    responseType: "blob",
  });
  const filename = `报表_${period}.csv`;
  downloadFile(response.data, filename);
}

export async function exportReportHTML(type: ReportType, period: string) {
  const userStore = useUserStore();
  const response = await axios.get(`/api/export/${type}/${period}/html`, {
    headers: {
      Authorization: `Bearer ${userStore.token}`,
    },
    responseType: "blob",
  });
  const url = URL.createObjectURL(response.data);
  window.open(url, "_blank");
}
