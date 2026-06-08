import mongoose from "mongoose";

export type SubmissionStatus = "draft" | "confirmed" | "submitted";

export interface ISubmissionRecord extends mongoose.Document {
  reportId: mongoose.Types.ObjectId;
  reportType: string;
  period: string;
  status: SubmissionStatus;
  submissionNo: string;
  data: Record<string, any>;
  validationErrors: string[];
  submittedBy?: mongoose.Types.ObjectId;
  submittedAt?: Date;
  confirmedBy?: mongoose.Types.ObjectId;
  confirmedAt?: Date;
  remark: string;
}

const submissionRecordSchema = new mongoose.Schema<ISubmissionRecord>(
  {
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
    },
    reportType: { type: String, required: true, index: true },
    period: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "confirmed", "submitted"],
      default: "draft",
      index: true,
    },
    submissionNo: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    validationErrors: { type: [String], default: [] },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    submittedAt: Date,
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    confirmedAt: Date,
    remark: { type: String, default: "" },
  },
  { timestamps: true },
);

submissionRecordSchema.index({ reportType: 1, period: 1 });

export const SubmissionRecord = mongoose.model<ISubmissionRecord>(
  "SubmissionRecord",
  submissionRecordSchema,
);
