import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    checkIn: {
      type: Date,
    },
    checkOut: {
      type: Date,
    },
    breakStart: {
      type: Date,
    },
    breakEnd: {
      type: Date,
    },
    breakDuration: {
      type: Number, // In minutes
      default: 0,
    },
    status: {
      type: String,
      enum: ['Present', 'Absent', 'Half-Day', 'Late'],
      default: 'Present',
    },
    workHours: {
      type: Number, // Stored in decimal hours
      default: 0,
    },
    lateTime: {
      type: Number, // Stored in minutes late past 09:45 AM
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one attendance entry per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
