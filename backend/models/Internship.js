import mongoose from 'mongoose';

const internshipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Terminated'],
      default: 'Active',
    },
    tasks: [
      {
        title: { type: String, required: true },
        description: { type: String },
        status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
        assignedDate: { type: Date, default: Date.now },
        completedDate: { type: Date },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Internship = mongoose.model('Internship', internshipSchema);
export default Internship;
