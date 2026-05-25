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
      enum: ['GST documents', 'ITR documents', 'Audit reports', 'Financial statements'],
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
      enum: ['Uploaded', 'Reviewed', 'Action Needed', 'Approved'],
      default: 'Uploaded',
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const ClientDocument = mongoose.model('ClientDocument', clientDocumentSchema);
export default ClientDocument;
