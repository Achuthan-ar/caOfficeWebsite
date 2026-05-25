import mongoose from 'mongoose';

const monthlyReportSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: String, // format: "YYYY-MM", e.g. "2026-05"
      required: true,
    },
    presentDays: {
      type: Number,
      default: 0,
    },
    absentDays: {
      type: Number,
      default: 0,
    },
    lateDays: {
      type: Number,
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    pendingTasks: {
      type: Number,
      default: 0,
    },
    performanceScore: {
      type: Number, // 0 - 100
      min: 0,
      max: 100,
      default: 0,
    },
    productivityScore: {
      type: Number, // 0 - 100
      min: 0,
      max: 100,
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Create compound index for employee and month to enforce uniqueness
monthlyReportSchema.index({ employee: 1, month: 1 }, { unique: true });

const MonthlyReport = mongoose.model('MonthlyReport', monthlyReportSchema);
export default MonthlyReport;
