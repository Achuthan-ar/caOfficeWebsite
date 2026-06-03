import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
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
    serviceName: {
      type: String,
      required: [true, 'Please provide the service name'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Please provide the invoice amount'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Please provide the payment due date'],
    },
    status: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Partially Paid', 'Overdue'],
      default: 'Unpaid',
    },
    paymentHistory: [
      {
        amountPaid: {
          type: Number,
          required: true,
        },
        paymentDate: {
          type: Date,
          default: Date.now,
        },
        transactionId: {
          type: String,
          trim: true,
        },
      },
    ],
    outstandingBalance: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Invoice = mongoose.model('Invoice', invoiceSchema);
export default Invoice;
