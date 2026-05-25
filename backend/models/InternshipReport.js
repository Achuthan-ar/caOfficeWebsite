import mongoose from 'mongoose';

const internshipReportSchema = new mongoose.Schema(
  {
    internship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Internship',
      required: true,
    },
    reportType: {
      type: String,
      enum: ['Weekly', 'Final'],
      required: true,
    },
    weekNumber: {
      type: Number,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String, // PDF or report document link
    },
    feedback: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number, // Mentor rating (1-5)
      min: 1,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

const InternshipReport = mongoose.model('InternshipReport', internshipReportSchema);
export default InternshipReport;
