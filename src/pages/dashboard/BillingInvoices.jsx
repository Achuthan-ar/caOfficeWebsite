import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import {
  Receipt,
  Download,
  Plus,
  X,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';

const BillingInvoices = () => {
  const { user } = useAuthStore();
  const isClient = user?.role?.name === 'Client';
  const isAdminOrManager = ['Admin', 'Manager'].includes(user?.role?.name);

  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [summary, setSummary] = useState({ totalOutstanding: 0, totalPaid: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals state
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState(null);

  // Add Invoice fields
  const [invClientId, setInvClientId] = useState('');
  const [invService, setInvService] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDueDate, setInvDueDate] = useState('');

  // Record Payment fields
  const [payAmount, setPayAmount] = useState('');
  const [payTransactionId, setPayTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const statusColors = {
    Paid: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
    Unpaid: 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse',
    'Partially Paid': 'bg-amber-500/10 text-amber-500 border border-amber-500/20',
    Overdue: 'bg-red-500/10 text-red-500 border border-red-500/20',
  };

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/invoices');
      if (response.data?.success) {
        setInvoices(response.data.data);
        setSummary(response.data.summary);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
      setError('Failed to fetch invoice list.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    if (!isAdminOrManager) return;
    try {
      const response = await api.get('/clients');
      if (response.data?.success) {
        setClients(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  }, [isAdminOrManager]);

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, [fetchInvoices, fetchClients]);

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    if (!invClientId || !invService || !invAmount || !invDueDate) {
      setError('Please fill in all invoice details.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post('/invoices', {
        clientId: invClientId,
        serviceName: invService,
        amount: Number(invAmount),
        dueDate: invDueDate,
      });

      if (response.data?.success) {
        setSuccess(`Invoice generated successfully.`);
        setInvService('');
        setInvAmount('');
        setInvDueDate('');
        fetchInvoices();
        setTimeout(() => {
          setIsInvoiceOpen(false);
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      console.error('Error generating invoice:', err);
      setError(err.response?.data?.message || 'Failed to generate invoice.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment || !payAmount) {
      setError('Please specify payment amount.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const response = await api.post(`/invoices/${selectedInvoiceForPayment._id}/payments`, {
        amountPaid: Number(payAmount),
        transactionId: payTransactionId,
      });

      if (response.data?.success) {
        setSuccess('Payment transaction recorded successfully.');
        setPayAmount('');
        setPayTransactionId('');
        setSelectedInvoiceForPayment(null);
        fetchInvoices();
        setTimeout(() => {
          setIsPaymentOpen(false);
          setSuccess('');
        }, 1500);
      }
    } catch (err) {
      console.error('Error recording payment:', err);
      setError(err.response?.data?.message || 'Payment recording failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadInvoice = (inv) => {
    // Generate dummy printable window / mock invoice PDF print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${inv.invoiceNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ddd; padding-bottom: 20px; }
            .details { margin: 40px 0; display: flex; justify-content: space-between; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #f2f2f2; }
            .total { text-align: right; margin-top: 30px; font-size: 1.2em; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2>D.K. NAGARAJAN</h2>
              <p>Chartered Accountant & Advisory Services</p>
            </div>
            <div>
              <h3>INVOICE</h3>
              <p><strong>Invoice #:</strong> ${inv.invoiceNumber}</p>
              <p><strong>Date:</strong> ${new Date(inv.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          <div class="details">
            <div>
              <h4>Billed To:</h4>
              <p><strong>${inv.client?.companyName}</strong></p>
              <p>Client ID: ${inv.client?.clientId || 'N/A'}</p>
            </div>
            <div>
              <h4>Payment Terms:</h4>
              <p>Due Date: ${new Date(inv.dueDate).toLocaleDateString()}</p>
              <p>Status: ${inv.status}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Description</th><th style="text-align: right;">Amount (INR)</th></tr>
            </thead>
            <tbody>
              <tr><td>${inv.serviceName}</td><td style="text-align: right;">₹${inv.amount.toLocaleString()}</td></tr>
            </tbody>
          </table>
          <div class="total">
            <p>Total Charged: ₹${inv.amount.toLocaleString()}</p>
            <p>Outstanding Balance: ₹${inv.outstandingBalance.toLocaleString()}</p>
          </div>
          <p style="margin-top: 50px; font-size: 0.8em; color: #888; text-align: center;">This is a computer-generated invoice and requires no signature.</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
            Billing & Invoices Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage corporate advisories billing accounts, payments history, and outstanding ledgers.
          </p>
        </div>
        {isAdminOrManager && (
          <button
            onClick={() => setIsInvoiceOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 text-white px-4 py-2 text-sm font-semibold hover:bg-indigo-600 transition shadow-lg shadow-indigo-500/15 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Generate Invoice
          </button>
        )}
      </div>

      {/* Alert states */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] text-emerald-500 text-sm">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.02] text-rose-500 text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Total Outstanding</span>
            <p className="text-2xl font-black text-rose-500 mt-1.5 font-heading">₹{summary?.totalOutstanding?.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Collected Revenue</span>
            <p className="text-2xl font-black text-emerald-500 mt-1.5 font-heading">₹{summary?.totalPaid?.toLocaleString()}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <ArrowDownLeft className="h-5 w-5" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm flex items-center justify-between col-span-1 sm:col-span-2 md:col-span-1">
          <div>
            <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Filing Services Billing</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-350 mt-2">Up to date on active retainer accounts.</p>
          </div>
          <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
            <Receipt className="h-5 w-5 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 dark:text-white font-heading mb-4">
          Retainer Billing Invoices
        </h3>

        {loading ? (
          <div className="text-center py-12 text-xs text-slate-450">Loading billing statements...</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Receipt className="h-8 w-8 text-slate-350 mx-auto" />
            <p className="font-bold text-slate-650 dark:text-slate-350 text-xs">No billing entries found</p>
            <p className="text-[11px] text-slate-450">All compliance logs have zero outstanding charges.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2.5 font-bold uppercase">Invoice #</th>
                  <th className="py-2.5 font-bold uppercase">Service Name</th>
                  {!isClient && <th className="py-2.5 font-bold uppercase">Client</th>}
                  <th className="py-2.5 font-bold uppercase">Due Date</th>
                  <th className="py-2.5 font-bold uppercase">Charged Amount</th>
                  <th className="py-2.5 font-bold uppercase">Balance Due</th>
                  <th className="py-2.5 font-bold uppercase">Status</th>
                  <th className="py-2.5 font-bold uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-655 dark:text-slate-350">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-3.5 font-bold text-slate-400">{inv.invoiceNumber}</td>
                    <td className="py-3.5 font-bold text-slate-750 dark:text-slate-200">{inv.serviceName}</td>
                    {!isClient && <td className="py-3.5 font-semibold text-slate-800 dark:text-slate-300">{inv.client?.companyName}</td>}
                    <td className="py-3.5">{new Date(inv.dueDate).toLocaleDateString()}</td>
                    <td className="py-3.5 font-semibold">₹{inv.amount.toLocaleString()}</td>
                    <td className="py-3.5 font-semibold text-rose-500">₹{inv.outstandingBalance.toLocaleString()}</td>
                    <td className="py-3.5">
                      <span className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusColors[inv.status]}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-right space-x-1">
                      <button
                        onClick={() => handleDownloadInvoice(inv)}
                        className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:text-indigo-500 transition cursor-pointer"
                        title="Print / Get PDF"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                      {isAdminOrManager && inv.outstandingBalance > 0 && (
                        <button
                          onClick={() => {
                            setSelectedInvoiceForPayment(inv);
                            setPayAmount(inv.outstandingBalance);
                            setIsPaymentOpen(true);
                          }}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-500 hover:text-emerald-500 transition cursor-pointer"
                          title="Record Payment"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generate Invoice Modal */}
      {isInvoiceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
              <h3 className="font-heading text-base font-black text-slate-800 dark:text-white uppercase tracking-wide">
                Generate Retainer Invoice
              </h3>
              <button
                onClick={() => setIsInvoiceOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Target Client</label>
                <select
                  value={invClientId}
                  onChange={(e) => setInvClientId(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  required
                >
                  <option value="">Select a Client</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>{c.companyName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Filing Retainer Service Description</label>
                <input
                  type="text"
                  placeholder="e.g. Audit Consulting & GST Return Filing Retainer"
                  value={invService}
                  onChange={(e) => setInvService(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Retainer Amount (INR)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Payment Due Date</label>
                  <input
                    type="date"
                    value={invDueDate}
                    onChange={(e) => setInvDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Generating Invoice...' : 'Generate Invoice'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Transaction Modal */}
      {isPaymentOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-xs">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
              <div>
                <h3 className="font-heading text-base font-black text-slate-800 dark:text-white uppercase tracking-wide">
                  Record Retainer Payment
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Invoice: {selectedInvoiceForPayment.invoiceNumber}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedInvoiceForPayment(null);
                  setIsPaymentOpen(false);
                }}
                className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-400 uppercase tracking-wider block">Filing Client</label>
                <p className="font-bold text-slate-800 dark:text-slate-250 p-2.5 border border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50 rounded-lg">
                  {selectedInvoiceForPayment.client?.companyName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Amount Paid (INR)</label>
                  <input
                    type="number"
                    max={selectedInvoiceForPayment.outstandingBalance}
                    placeholder="e.g. 5000"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-400 uppercase tracking-wider block">Transaction / Ref ID</label>
                  <input
                    type="text"
                    placeholder="e.g. TXN-89020"
                    value={payTransactionId}
                    onChange={(e) => setPayTransactionId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-transparent rounded-lg text-slate-800 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-indigo-500 text-white font-bold rounded-lg hover:bg-indigo-600 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? 'Recording Payment...' : 'Record Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingInvoices;
