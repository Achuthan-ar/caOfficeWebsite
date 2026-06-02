import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Printer, ArrowLeft, Award, ShieldCheck } from 'lucide-react';

const CertificateView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/internships/certificates/${id}`);
        if (res.data?.success) {
          setCertificate(res.data.data);
        }
      } catch (err) {
        console.error('Error loading certificate:', err);
        setError(err.response?.data?.message || 'Certificate not found or unauthorized access.');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em]"></div>
        <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-semibold">Loading certificate template...</p>
      </div>
    );
  }

  if (error || !certificate) {
    return (
      <div className="bg-red-500/10 border border-red-550/20 text-red-500 rounded-xl p-8 max-w-xl mx-auto text-center space-y-4">
        <h3 className="text-base font-bold font-heading">Error Loading Certificate</h3>
        <p className="text-xs leading-normal">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Go Back
        </button>
      </div>
    );
  }

  const { internName, duration, officeName, signature, completionStatus, issueDate, internship } = certificate;
  const issueDateFormatted = new Date(issueDate).toLocaleDateString([], { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Action Header bar - hidden during print */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-xl shadow-xs print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-650 dark:text-slate-350 hover:text-indigo-550 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Workspace
        </button>

        <button
          onClick={handlePrint}
          className="bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl py-2 px-4 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10"
        >
          <Printer className="h-4 w-4" />
          Print PDF
        </button>
      </div>

      {/* Printable Certificate Page */}
      <div className="flex items-center justify-center p-2 sm:p-6 bg-slate-50 dark:bg-slate-900 print:bg-white print:p-0 print-cert-container">
        <div className="w-full max-w-4xl border-16 border-indigo-900/10 dark:border-slate-850/50 p-1 sm:p-2 bg-white dark:bg-slate-950 rounded-2xl shadow-xl relative border-double border-indigo-800 dark:border-slate-800 print:border-none print:shadow-none print:max-w-full print:w-full print:rounded-none print-cert-card">
          {/* Inner border */}
          <div className="border-4 border-indigo-800/15 dark:border-slate-800/40 p-8 sm:p-14 space-y-8 rounded-xl border-dashed relative print:border-indigo-800/20 print:p-12 print-cert-inner">
            
            {/* Background watermark badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] dark:opacity-[0.01] print-watermark">
              <Award className="h-96 w-96 text-indigo-900" />
            </div>

            {/* Header branding */}
            <div className="text-center space-y-3">
              <div className="flex justify-center items-center gap-1 text-indigo-500 dark:text-indigo-400">
                <Award className="h-8 w-8 text-indigo-500" />
              </div>
              <h1 className="text-sm font-black tracking-widest text-slate-400 uppercase">
                {officeName}
              </h1>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-slate-100 font-heading tracking-tight mt-1 print:text-black">
                Certificate of Completion
              </div>
              <div className="w-36 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto rounded-full"></div>
            </div>

            {/* Main Text body */}
            <div className="text-center space-y-6 max-w-2xl mx-auto pt-4 leading-relaxed">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                This is proudly presented to
              </p>
              
              <h2 className="text-2xl sm:text-3xl font-black text-indigo-500 dark:text-indigo-400 font-heading border-b-2 border-indigo-500/10 pb-2 max-w-lg mx-auto print:text-indigo-650 print:border-indigo-550/20">
                {internName}
              </h2>

              <p className="text-xs sm:text-sm text-slate-555 dark:text-slate-400 print:text-slate-700">
                for successfully completing their Article Assistant / Internship training program in the department of <strong className="text-slate-800 dark:text-white font-bold print:text-black">{internship?.department?.name || 'Audit & Taxation'}</strong> at <strong className="text-slate-800 dark:text-white font-bold print:text-black">{officeName}</strong>.
              </p>

              <p className="text-xs sm:text-sm text-slate-555 dark:text-slate-400 print:text-slate-700">
                During this period of <strong className="text-indigo-500 dark:text-indigo-400 font-bold print:text-indigo-650">{duration}</strong>, their performance, operational conduct, and learning progress were evaluated as <strong className="text-slate-800 dark:text-white font-bold print:text-black">{completionStatus}</strong>.
              </p>
            </div>

            {/* Bottom signatures and seals */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-10 sm:pt-14 justify-between max-w-3xl mx-auto text-left">
              {/* Left: Issue Info */}
              <div className="space-y-1 self-end text-center sm:text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Date of Issue</span>
                <span className="text-xs font-extrabold text-slate-850 dark:text-slate-300 print:text-black">
                  {issueDateFormatted}
                </span>
                <span className="text-[9px] text-slate-400 block pt-1.5 flex items-center justify-center sm:justify-start gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Verified CA Office ERP Registry
                </span>
              </div>

              {/* Right: Signature Authority */}
              <div className="space-y-1 text-center sm:text-right border-t border-slate-200 dark:border-slate-850 pt-4 sm:border-none sm:pt-0">
                <div className="h-10 flex justify-center sm:justify-end items-end italic text-indigo-500 font-serif text-lg">
                  {/* Decorative placeholder signature text */}
                  {signature.split(' ').map(w => w.charAt(0)).join('. ')}
                </div>
                <div className="w-48 border-t border-indigo-500/25 dark:border-slate-800 ml-auto mr-auto sm:mr-0"></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block pt-1">Authorized Signatory</span>
                <span className="text-xs font-bold text-slate-850 dark:text-slate-350 block print:text-black">
                  {signature}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Print-specific layout CSS */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0;
          }
          /* Hide sidebar, topbar and main workspace containers */
          header, aside, .print\\:hidden, button {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            height: 100% !important;
            width: 100% !important;
            overflow: hidden !important;
          }
          
          /* Centering and Landscape scaling */
          .print-cert-container {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            height: 100vh !important;
            width: 100vw !important;
            padding: 2.5rem !important; /* Spacing from paper edge */
            box-sizing: border-box !important;
            background: white !important;
          }
          .print-cert-card {
            width: 100% !important;
            height: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 12px double #3730a3 !important; /* Force gorgeous double border */
            border-radius: 8px !important;
            padding: 6px !important;
            box-sizing: border-box !important;
            background: white !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
          }
          .print-cert-inner {
            border: 4px dashed rgba(55, 48, 163, 0.2) !important; /* Force dashed border */
            padding: 2.5rem !important;
            height: 100% !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            position: relative !important;
          }
          .print-watermark {
            opacity: 0.03 !important;
          }
        }
      `}</style>
    </div>

  );
};

export default CertificateView;
