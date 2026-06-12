import mongoose from 'mongoose';
import { getCurrentFinancialYear } from '../utils/financialYear.js';

const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      unique: true,
      index: true,
    },
    taskName: {
      type: String,
      required: [true, 'Please provide a task name'],
      trim: true,
    },
    financialYear: {
      type: String,
      default: getCurrentFinancialYear,
      trim: true,
    },
    taskDescription: {
      type: String,
      trim: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Please provide a client reference'],
    },
    // Compatibility field (synced automatically)
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTeamLead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedEmployee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please assign this task to an employee'],
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide a start date'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide a due date'],
    },
    estimatedHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['To Do', 'In Progress', 'Review', 'Completed', 'On Hold', 'Cancelled'],
      default: 'To Do',
    },
    completionDate: {
      type: Date,
    },
    completionRemarks: {
      type: String,
      trim: true,
    },
    // Compatibility field (synced automatically)
    remarks: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
    },
    attachments: [
      {
        type: String,
      },
    ],
    internalNotes: {
      type: String,
      trim: true,
    },
    clientVisible: {
      type: String,
      enum: ['Yes', 'No'],
      default: 'No',
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        comment: {
          type: String,
          required: true,
          trim: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    activityLogs: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        userName: {
          type: String,
        },
        action: {
          type: String,
          required: true,
        },
        oldValue: {
          type: String,
        },
        newValue: {
          type: String,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals for title and description to support existing frontend calls
taskSchema.virtual('title')
  .get(function () {
    return this.taskName;
  })
  .set(function (val) {
    this.taskName = val;
  });

taskSchema.virtual('description')
  .get(function () {
    return this.taskDescription;
  })
  .set(function (val) {
    this.taskDescription = val;
  });

// Dynamic virtual for overdue condition
taskSchema.virtual('isOverdue')
  .get(function () {
    return this.dueDate && new Date() > this.dueDate && this.status !== 'Completed';
  });

// Pre-save hook for compatibility sync and T1001 auto-generated ID
taskSchema.pre('save', async function (next) {
  // Sync compatibility fields
  if (this.assignedEmployee) {
    this.assignedTo = this.assignedEmployee;
  }
  if (this.completionRemarks !== undefined) {
    this.remarks = this.completionRemarks;
  }

  if (this.isNew && !this.taskId) {
    try {
      const lastTask = await mongoose.model('Task').findOne({
        taskId: { $regex: /^T\d+$/ }
      }).sort({ taskId: -1 });

      let nextNum = 1001;
      if (lastTask && lastTask.taskId) {
        const lastNum = parseInt(lastTask.taskId.replace('T', ''), 10);
        if (!isNaN(lastNum) && lastNum >= 1001) {
          nextNum = lastNum + 1;
        }
      }
      this.taskId = `T${nextNum}`;
    } catch (err) {
      return next(err);
    }
  }
  next();
});

const Task = mongoose.model('Task', taskSchema);
export default Task;
