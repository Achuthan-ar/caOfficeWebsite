import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, 'Please provide business name'],
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    filingStatus: {
      gstStatus: {
        type: String,
        enum: ['Not Started', 'Pending Documents', 'In Progress', 'Filed', 'Delayed'],
        default: 'Not Started',
      },
      itrStatus: {
        type: String,
        enum: ['Not Started', 'Pending Documents', 'In Progress', 'Filed', 'Delayed'],
        default: 'Not Started',
      },
      auditStatus: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed', 'Delayed'],
        default: 'Not Started',
      },
    },
    pendingWorks: [
      {
        type: String,
        trim: true,
      },
    ],
    completedFilings: [
      {
        filingType: { type: String, required: true }, // e.g. "GSTR-3B", "ITR-6", "Statutory Audit"
        period: { type: String, required: true }, // e.g. "April 2026", "FY 2025-26"
        filedDate: { type: Date, default: Date.now },
        acknowledgmentNumber: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Client = mongoose.model('Client', clientSchema);
export default Client;
