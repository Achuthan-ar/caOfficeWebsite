import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  BadgePercent,
  SearchCode,
  Building2,
  Calculator,
  CalendarCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

const Services = () => {
  const serviceItems = [
    {
      title: 'GST Filing',
      icon: BadgePercent,
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
      desc: 'End-to-end indirect tax services. We manage sales ledger reconciliations, invoice auditing, and file standard tax returns GSTR-1 & GSTR-3B monthly.',
      features: [
        'Monthly GSTR-1 & GSTR-3B filings',
        'Input Tax Credit (ITC) reconciliation via GSTR-2B',
        'GST refund application tracking',
        'GST registration & modifications advisory',
      ],
    },
    {
      title: 'Income Tax Filing',
      icon: FileText,
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
      desc: 'Complete personal and corporate income tax solutions. Plan deductions under standard government sections and file statutory tax returns seamlessly.',
      features: [
        'Corporate tax return filing (ITR-6)',
        'Individual & partner ITR filings (ITR-1 to 5)',
        'Advance tax estimates & planning',
        'Income Tax search & notice representations',
      ],
    },
    {
      title: 'Audit Services',
      icon: SearchCode,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
      desc: 'Qualified statutory, tax, and internal auditing. We review books, reconcile ledgers, verify compliance standards, and compile final financial reports.',
      features: [
        'Statutory company auditing (under Companies Act)',
        'Tax Audits (under Section 44AB)',
        'Internal controls review & gap checking',
        'Financial balance sheet audit statements',
      ],
    },
    {
      title: 'Company Registration',
      icon: Building2,
      color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
      desc: 'Get your business started. We handle registrations for Private Limited (Pvt Ltd), LLP, OPC, partnerships, and GSTIN code setups.',
      features: [
        'Private Limited Company formation',
        'Limited Liability Partnership (LLP) setup',
        'MCA portal registrations & DSC/DIN creation',
        'Startup India registry support',
      ],
    },
    {
      title: 'Accounting Services',
      icon: Calculator,
      color: 'text-sky-500 bg-sky-500/10 border-sky-500/20',
      desc: 'Complete outsourced ledger bookkeeping. Maintain payroll records, balance sheets, cash flows, ledger adjustments, and quarterly analytics.',
      features: [
        'Cloud-based ledger bookkeeping (Tally, Zoho)',
        'Monthly cash flow & bank statement reconciliations',
        'Outsourced payroll processing & calculations',
        'Quarterly MIS financial reporting',
      ],
    },
    {
      title: 'TDS Filing',
      icon: CalendarCheck,
      color: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
      desc: 'Secure withholding tax management. Reconcile salary and business expenses, calculate TDS values, generate challans, and file quarterly TDS returns.',
      features: [
        'Quarterly TDS Return filing (Forms 24Q, 26Q, 27Q)',
        'Form 16 & Form 16A certificate generation',
        'TDS calculations & challan verification',
        'TAN registration & compliance checks',
      ],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
          Comprehensive Compliance Services
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Outsource your company auditing, tax returns, and ledger accounting to our ICAI member firm. Certified accuracy and compliance guaranteed.
        </p>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {serviceItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-xs hover:shadow-md hover:border-indigo-500/20 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className={`p-3 rounded-xl border w-fit ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <h3 className="text-lg font-bold text-slate-805 dark:text-white font-heading">
                  {item.title}
                </h3>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>

                <div className="pt-2">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Scope of Work</h4>
                  <ul className="space-y-1.5 text-xs text-slate-650 dark:text-slate-350">
                    {item.features.map((f, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-905">
                <Link
                  to="/contact"
                  className="w-full flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-250/50 dark:border-slate-800 rounded-xl py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Book Consultation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Services;
