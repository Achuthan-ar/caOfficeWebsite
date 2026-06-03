import mongoose from 'mongoose';

const clientDocumentSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide document name'],
      trim: true,
    },
    documentType: {
      type: String,
      enum: ['GST', 'Income Tax', 'Audit', 'ROC', 'Payroll', 'KYC', 'Compliance', 'Others'],
      required: [true, 'Please specify document type'],
    },
    fileUrl: {
      type: String,
      required: [true, 'Please provide file download URL link'],
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['Uploaded', 'Under Review', 'Approved', 'Rejected', 'Re-upload Required'],
      default: 'Uploaded',
    },
    remarks: {
      type: String,
      trim: true,
    },
    versions: [
      {
        versionNumber: {
          type: Number,
          required: true,
        },
        fileUrl: {
          type: String,
          required: true,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const ClientDocument = mongoose.model('ClientDocument', clientDocumentSchema);
export default ClientDocument;
