import { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const contactDetails = [
    { title: 'Office Address', value: '102, Elite Business Hub, Tax Square, Mumbai, MH, 400001', icon: MapPin },
    { title: 'Telephone Number', value: '+91 22 5555 1234', icon: Phone },
    { title: 'Support Email', value: 'support@caoffice.com', icon: Mail },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      
      {/* Title */}
      <section className="text-center space-y-4">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white font-heading tracking-tight">
          Connect With Our Firm
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Book a statutory ledger audit, request GST registrations, or schedule direct tax consultations. Open Monday to Saturday.
        </p>
      </section>

      {/* Grid: Contact details & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Office Details & Map */}
        <section className="space-y-6">
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-xs space-y-6">
            <h3 className="text-base font-bold text-slate-850 dark:text-white font-heading">
              Office Information
            </h3>
            
            <div className="space-y-4">
              {contactDetails.map((detail, i) => {
                const Icon = detail.icon;
                return (
                  <div key={i} className="flex gap-3">
                    <div className="bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 p-2.5 rounded-xl shrink-0 h-fit">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider">{detail.title}</h4>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-medium leading-relaxed">{detail.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <hr className="border-slate-100 dark:border-slate-900" />
            
            {/* Social Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Social Handles</h4>
              <div className="flex items-center gap-4">
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-850 text-slate-555 hover:text-indigo-500 transition-colors">
                  <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-850 text-slate-555 hover:text-indigo-500 transition-colors">
                  <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/60 dark:hover:bg-slate-900 border border-slate-200/50 dark:border-slate-850 text-slate-555 hover:text-indigo-500 transition-colors">
                  <svg className="h-4.5 w-4.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Google Maps Integration (Responsive Embedded iframe) */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-850 overflow-hidden h-72 shadow-sm bg-white dark:bg-slate-950">
            <iframe
              title="CA Office Square Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m12!1m3!1d3773.8327318721665!2d72.833502!3d18.932204!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7d1c67d8f4bc1%3A0xc078dbb4c12d2db7!2sFort%2C%20Mumbai%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </section>

        {/* Contact Form */}
        <section className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-xs space-y-6">
          <h3 className="text-base font-bold text-slate-850 dark:text-white font-heading">
            Leave a Message
          </h3>

          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <CheckCircle2 className="h-14 w-14 text-emerald-500 mx-auto animate-bounce" />
              <h4 className="text-lg font-bold text-slate-800 dark:text-white font-heading">Message Sent Successfully</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-sm mx-auto">
                Thank you for contacting us. A senior partner will review your business requirements and call you shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-xs font-semibold text-slate-705 dark:text-slate-350"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-450 uppercase tracking-wider mb-1.5">
                  Your Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="Enter name"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-750 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-450 uppercase tracking-wider mb-1.5">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    placeholder="name@company.com"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-750 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-450 uppercase tracking-wider mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    required
                    type="tel"
                    placeholder="99999 99999"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-750 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-450 uppercase tracking-wider mb-1.5">
                  Compliance Topic *
                </label>
                <select
                  required
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 px-3 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select category...</option>
                  <option value="GST">GST Registration & Filings</option>
                  <option value="ITR">Income Tax Strategy & Filing</option>
                  <option value="Audit">Statutory / Internal Audit</option>
                  <option value="Incorporation">New Pvt Ltd / LLP Setup</option>
                  <option value="Accounting">Outsourced Bookkeeping Services</option>
                  <option value="Other">General Support Query</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-450 uppercase tracking-wider mb-1.5">
                  Business Query Description *
                </label>
                <textarea
                  required
                  rows="4"
                  placeholder="Outline your company type, turnover size, or current direct/indirect taxation compliance bottleneck..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-750 dark:text-slate-250 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-bold hover:bg-indigo-600 transition-colors"
              >
                <Send className="h-4 w-4" />
                Submit Inquiry
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};

export default Contact;
