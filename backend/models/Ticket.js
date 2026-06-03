import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      unique: true,
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['GST', 'Income Tax', 'Audit', 'ROC', 'Registration', 'General Support'],
      required: [true, 'Please specify support category'],
    },
    title: {
      type: String,
      required: [true, 'Please enter a ticket title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please enter a description'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Assigned', 'In Progress', 'Waiting for Client', 'Resolved', 'Closed'],
      default: 'Open',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        userName: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          required: true,
        },
        comment: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        name: String,
        fileUrl: String,
      },
    ],
    activityTimeline: [
      {
        action: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
