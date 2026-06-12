import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    clientName: {
      type: String,
      required: [true, 'Please provide client name'],
      trim: true,
    },
    fileNumber: {
      type: String,
      trim: true,
    },
    businessName: {
      type: String,
      trim: true,
    },
    accountantName: {
      type: String,
      trim: true,
    },
    clientType: {
      type: String,
      required: [true, 'Please provide client type'],
      trim: true,
    },
    caseType: {
      type: String,
      trim: true,
    },
    dobDof: {
      type: Date,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Please provide phone number'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    aadhaarNumber: {
      type: String,
      trim: true,
    },
    servicesOpted: [
      {
        type: String,
        trim: true,
      },
    ],
    address: {
      type: String,
      trim: true,
    },
    regularityType: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    assignedTeamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Keep user reference for backward compatibility with client portal login
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    // Keep filing trackers for dashboard compatibility
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
        filingType: { type: String, required: true },
        period: { type: String, required: true },
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
