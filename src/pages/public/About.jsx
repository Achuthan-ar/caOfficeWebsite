import React from 'react';
import { Shield, Sparkles, Award, Target } from 'lucide-react';

const About = () => {
  const values = [
    { title: 'Absolute Integrity', desc: 'Operating with strict professional ethics and transparency in all audit reviews.', icon: Shield },
    { title: 'Audited Precision', desc: 'Double-checking ledgers and calculations to guarantee compliance accuracy.', icon: Sparkles },
    { title: 'On-Time Compliance', desc: 'Sticking strictly to filing calendars to ensure Zero delay penalties.', icon: Target },
    { title: 'Client Dedication', desc: 'Providing tailored advisory to support corporate and startup expansion.', icon: Award },
  ];

  const team = [
    { name: 'CA Sanjay Sharma', role: 'Senior Founding Partner', qual: 'FCA, 18+ Years Experience', spec: 'Statutory Audit & International Taxation' },
    { name: 'CA Meera Nair', role: 'Partner - Indirect Tax', qual: 'ACA, 10+ Years Experience', spec: 'GST Advisory & Refund Filings' },
    { name: 'Adv. Rohan Deshmukh', role: 'Tax Litigation Lead', qual: 'LL.B (Taxation), 12+ Years Exp', spec: 'Appellate Tribunal Representation & Appeals' },
    { name: 'CA Vineet Patel', role: 'Auditing Supervisor', qual: 'ACA, DISA, 8+ Years Experience', spec: 'System Audits & Corporate Compliance' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
      
      {/* Hero Intro */}
      <section className="text-center space-y-4">
        <h2 className="text-3xl font-extrabold text-slate-805 dark:text-white font-heading tracking-tight">
          About CA Office
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
          Founded in 2011, we are a leading ICAI-registered Chartered Accountancy firm. We represent over 500 companies in GST disputes, corporate audits, and direct tax filings.
        </p>
      </section>

      {/* Values Grid */}
      <section className="space-y-8">
        <h3 className="text-xl font-bold text-center text-slate-800 dark:text-white font-heading">
          Our Foundation Values
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((val, i) => {
            const Icon = val.icon;
            return (
              <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-xs space-y-3">
                <div className="rounded-lg bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 p-2.5 w-fit">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white font-heading">{val.title}</h4>
                <p className="text-xs text-slate-505 dark:text-slate-400 leading-normal">{val.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Corporate Team Members */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white font-heading">
            Our Senior Auditors & Advisors
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A qualified team of Chartered Accountants and legal advocates managing your ledger files.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((person, i) => (
            <div key={i} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-xs text-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg mx-auto shadow-md">
                {person.name.split(' ').pop().charAt(0)}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white font-heading">{person.name}</h4>
                <p className="text-xs text-indigo-500 font-semibold">{person.role}</p>
                <p className="text-[10px] text-slate-400 mt-1">{person.qual}</p>
              </div>
              <hr className="border-slate-100 dark:border-slate-900" />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">Specialization: {person.spec}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default About;
