import mongoose from 'mongoose';

const documentRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      unique: true,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    requestedByRole: {
      type: String,
      required: true,
    },
    documentName: {
      type: String,
      required: [true, 'Please provide the requested document name'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['GST', 'Income Tax', 'Audit', 'ROC', 'Payroll', 'KYC', 'Compliance', 'Others'],
      required: [true, 'Please specify the category'],
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    requestDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide the due date'],
    },
    status: {
      type: String,
      enum: ['Requested', 'Uploaded', 'Under Review', 'Approved', 'Rejected', 'Re-upload Required', 'Overdue', 'Escalated'],
      default: 'Requested',
    },
    uploadedDocument: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClientDocument',
    },
    reminderCount: {
      type: Number,
      default: 0,
    },
    lastReminderSent: {
      type: Date,
    },
    nextReminderDue: {
      type: Date,
    },
    approvalHistory: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        userName: {
          type: String,
        },
        role: {
          type: String,
        },
        date: {
          type: Date,
          default: Date.now,
        },
        actionTaken: {
          type: String,
          enum: ['Approve', 'Reject', 'Request Re-upload'],
        },
        comments: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const DocumentRequest = mongoose.model('DocumentRequest', documentRequestSchema);
export default DocumentRequest;
