import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import User from '../models/User.js';
import { sendNotification } from '../utils/notification.js';
import AuditLog from '../models/AuditLog.js';

// Helper to generate Invoice ID
const generateInvoiceNumber = async () => {
  const count = await Invoice.countDocuments();
  const serial = String(count + 1).padStart(3, '0');
  const year = new Date().getFullYear();
  return `INV-${year}-${serial}`;
};

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private (Admin & Manager only)
export const createInvoice = async (req, res) => {
  const { clientId, serviceName, amount, dueDate } = req.body;

  if (!clientId || !serviceName || !amount || !dueDate) {
    return res.status(400).json({ success: false, message: 'Client ID, service name, amount, and due date are required.' });
  }

  try {
    const client = await Client.findById(clientId).populate('user');
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client profile not found' });
    }

    const invoiceNumber = await generateInvoiceNumber();

    const newInvoice = await Invoice.create({
      invoiceNumber,
      client: clientId,
      serviceName,
      amount,
      dueDate: new Date(dueDate),
      outstandingBalance: amount,
      status: 'Unpaid',
    });

    // Notify client (In-App)
    await sendNotification({
      recipient: client.user._id,
      sender: req.user._id,
      title: 'New Invoice Generated',
      message: `Invoice ${invoiceNumber} for "${serviceName}" of ₹${amount} is generated. Due: ${new Date(dueDate).toLocaleDateString()}`,
      type: 'Billing',
      link: '/client-dashboard',
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Invoice Created',
      details: `Generated invoice ${invoiceNumber} for client: ${client.companyName}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.status(201).json({ success: true, data: newInvoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get invoices list
// @route   GET /api/invoices
// @access  Private (All roles)
export const getInvoices = async (req, res) => {
  const { clientId, status } = req.query;

  try {
    let query = {};

    if (req.user.role.name === 'Client') {
      const clientProfile = await Client.findOne({ user: req.user._id });
      if (!clientProfile) {
        return res.status(404).json({ success: false, message: 'Client profile not found' });
      }
      query.client = clientProfile._id;
    } else {
      if (clientId) query.client = clientId;
    }

    if (status) query.status = status;

    const invoices = await Invoice.find(query)
      .populate({
        path: 'client',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    // Calculate Summary Details
    const totalOutstanding = invoices
      .filter(inv => inv.status !== 'Paid')
      .reduce((sum, inv) => sum + inv.outstandingBalance, 0);

    const totalPaid = invoices
      .reduce((sum, inv) => {
        const paidForInv = inv.paymentHistory.reduce((s, p) => s + p.amountPaid, 0);
        return sum + paidForInv;
      }, 0);

    res.json({
      success: true,
      count: invoices.length,
      summary: {
        totalOutstanding,
        totalPaid,
      },
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record transaction payment for an invoice
// @route   POST /api/invoices/:id/payments
// @access  Private (Admin & Manager only)
export const recordPayment = async (req, res) => {
  const { amountPaid, transactionId, paymentDate } = req.body;

  if (!amountPaid) {
    return res.status(400).json({ success: false, message: 'Amount paid is required.' });
  }

  try {
    const invoice = await Invoice.findById(req.params.id).populate({
      path: 'client',
      populate: { path: 'user' }
    });

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.outstandingBalance <= 0) {
      return res.status(400).json({ success: false, message: 'Invoice is already fully paid.' });
    }

    const netPaid = Number(amountPaid);
    const newOutstanding = Math.max(0, invoice.outstandingBalance - netPaid);

    invoice.paymentHistory.push({
      amountPaid: netPaid,
      paymentDate: paymentDate || new Date(),
      transactionId: transactionId || '',
    });

    invoice.outstandingBalance = newOutstanding;
    invoice.status = newOutstanding === 0 ? 'Paid' : 'Partially Paid';
    await invoice.save();

    // Notify client (In-App)
    await sendNotification({
      recipient: invoice.client.user._id,
      sender: req.user._id,
      title: 'Payment Recorded',
      message: `Payment of ₹${netPaid} recorded for Invoice ${invoice.invoiceNumber}. Outstanding: ₹${newOutstanding}`,
      type: 'Billing',
      link: '/client-dashboard',
    });

    // Log Audit Event
    await AuditLog.create({
      user: req.user._id,
      action: 'Payment Recorded',
      details: `Recorded payment of ₹${netPaid} for invoice ${invoice.invoiceNumber}`,
      ipAddress: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    res.json({ success: true, message: 'Payment recorded successfully.', data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
