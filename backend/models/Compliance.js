import mongoose from 'mongoose';

const complianceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide compliance title'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['GSTR-1', 'GSTR-3B', 'TDS Returns', 'Income Tax Filing', 'ROC Filing', 'Audit Deadlines'],
      required: [true, 'Please specify category'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide compliance due date'],
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Completed', 'Overdue'],
      default: 'Pending',
    },
    colorCode: {
      type: String,
      default: '#6366f1',
    },
  },
  {
    timestamps: true,
  }
);

const Compliance = mongoose.model('Compliance', complianceSchema);
export default Compliance;
