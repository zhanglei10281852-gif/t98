import request from "@/utils/request";

export type SubmissionStatus = "draft" | "confirmed" | "submitted";

export interface SubmissionField {
  key: string;
  label: string;
}

export interface SubmissionRecord {
  _id: string;
  reportId: string;
  reportType: string;
  period: string;
  status: SubmissionStatus;
  submissionNo: string;
  data: Record<string, any>;
  validationErrors: string[];
  submittedBy?: string;
  submittedAt?: string;
  confirmedBy?: string;
  confirmedAt?: string;
  remark: string;
  createdAt: string;
  updatedAt: string;
}

export function getSubmissionFields() {
  return request.get<any, SubmissionField[]>("/submissions/fields");
}

export function generateSubmission(reportType: string, period: string) {
  return request.post<any, SubmissionRecord>("/submissions/generate", {
    reportType,
    period,
  });
}

export function getSubmission(id: string) {
  return request.get<any, SubmissionRecord>(`/submissions/${id}`);
}

export function getSubmissionList(params?: {
  reportType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return request.get<
    any,
    { list: SubmissionRecord[]; total: number; page: number; pageSize: number }
  >("/submissions", {
    params,
  });
}

export function confirmSubmission(id: string) {
  return request.put<any, SubmissionRecord>(`/submissions/${id}/confirm`);
}

export function submitSubmission(id: string) {
  return request.put<any, SubmissionRecord>(`/submissions/${id}/submit`);
}

export function validateSubmission(reportType: string, period: string) {
  return request.post<
    any,
    { valid: boolean; errors: string[]; data: Record<string, any> }
  >("/submissions/validate", {
    reportType,
    period,
  });
}
