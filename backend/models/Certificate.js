import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema(
  {
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: true,
    },
    internName: {
      type: String,
      required: true,
    },
    duration: {
      type: String, // e.g. "3 Months (March 2026 - May 2026)"
      required: true,
    },
    officeName: {
      type: String,
      default: 'CA Office ERP & Advisory',
    },
    signature: {
      type: String,
      default: 'Senior Managing CA Partner',
    },
    completionStatus: {
      type: String,
      default: 'Successful',
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
