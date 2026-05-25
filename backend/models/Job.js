import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a job/internship title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a job description'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Full-time', 'Internship', 'Part-time'],
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      type: String,
      default: 'Mumbai',
      trim: true,
    },
    salaryRange: {
      type: String,
      trim: true,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Job = mongoose.model('Job', jobSchema);
export default Job;
