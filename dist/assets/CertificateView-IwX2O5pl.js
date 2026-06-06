import{t as e}from"./arrow-left-C8ezzb_q.js";import{t}from"./award-BvlsKslN.js";import{t as n}from"./printer-CarvT_P2.js";import{F as r,I as i,N as a,P as o,n as s,r as c,s as l}from"./index-BD-SSVgu.js";var u=i(r(),1),d=c(),f=()=>{let{id:r}=o(),i=a(),[c,f]=(0,u.useState)(null),[p,m]=(0,u.useState)(!0),[h,g]=(0,u.useState)(``);(0,u.useEffect)(()=>{(async()=>{try{m(!0);let e=await s.get(`/internships/certificates/${r}`);e.data?.success&&f(e.data.data)}catch(e){console.error(`Error loading certificate:`,e),g(e.response?.data?.message||`Certificate not found or unauthorized access.`)}finally{m(!1)}})()},[r]);let _=()=>{window.print()};if(p)return(0,d.jsxs)(`div`,{className:`text-center py-20 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-850 shadow-xs`,children:[(0,d.jsx)(`div`,{className:`inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em]`}),(0,d.jsx)(`p`,{className:`mt-4 text-slate-500 dark:text-slate-400 text-xs font-semibold`,children:`Loading certificate template...`})]});if(h||!c)return(0,d.jsxs)(`div`,{className:`bg-red-500/10 border border-red-550/20 text-red-500 rounded-xl p-8 max-w-xl mx-auto text-center space-y-4`,children:[(0,d.jsx)(`h3`,{className:`text-base font-bold font-heading`,children:`Error Loading Certificate`}),(0,d.jsx)(`p`,{className:`text-xs leading-normal`,children:h}),(0,d.jsx)(`button`,{onClick:()=>i(-1),className:`bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300`,children:`Go Back`})]});let{internName:v,duration:y,officeName:b,signature:x,completionStatus:S,issueDate:C,internship:w}=c,T=new Date(C).toLocaleDateString([],{day:`numeric`,month:`long`,year:`numeric`});return(0,d.jsxs)(`div`,{className:`space-y-6`,children:[(0,d.jsxs)(`div`,{className:`flex justify-between items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-xl shadow-xs print:hidden`,children:[(0,d.jsxs)(`button`,{onClick:()=>i(-1),className:`flex items-center gap-1.5 text-xs font-semibold text-slate-650 dark:text-slate-350 hover:text-indigo-550 transition cursor-pointer`,children:[(0,d.jsx)(e,{className:`h-4 w-4`}),`Back to Workspace`]}),(0,d.jsxs)(`button`,{onClick:_,className:`bg-indigo-500 hover:bg-indigo-650 text-white rounded-xl py-2 px-4 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/10`,children:[(0,d.jsx)(n,{className:`h-4 w-4`}),`Print PDF`]})]}),(0,d.jsx)(`div`,{className:`flex items-center justify-center p-2 sm:p-6 bg-slate-50 dark:bg-slate-900 print:bg-white print:p-0 print-cert-container`,children:(0,d.jsx)(`div`,{className:`w-full max-w-4xl border-16 border-indigo-900/10 dark:border-slate-850/50 p-1 sm:p-2 bg-white dark:bg-slate-950 rounded-2xl shadow-xl relative border-double border-indigo-800 dark:border-slate-800 print:border-none print:shadow-none print:max-w-full print:w-full print:rounded-none print-cert-card`,children:(0,d.jsxs)(`div`,{className:`border-4 border-indigo-800/15 dark:border-slate-800/40 p-8 sm:p-14 space-y-8 rounded-xl border-dashed relative print:border-indigo-800/20 print:p-12 print-cert-inner`,children:[(0,d.jsx)(`div`,{className:`absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02] dark:opacity-[0.01] print-watermark`,children:(0,d.jsx)(t,{className:`h-96 w-96 text-indigo-900`})}),(0,d.jsxs)(`div`,{className:`text-center space-y-3`,children:[(0,d.jsx)(`div`,{className:`flex justify-center items-center gap-1 text-indigo-500 dark:text-indigo-400`,children:(0,d.jsx)(t,{className:`h-8 w-8 text-indigo-500`})}),(0,d.jsx)(`h1`,{className:`text-sm font-black tracking-widest text-slate-400 uppercase`,children:b}),(0,d.jsx)(`div`,{className:`text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-slate-100 font-heading tracking-tight mt-1 print:text-black`,children:`Certificate of Completion`}),(0,d.jsx)(`div`,{className:`w-36 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent mx-auto rounded-full`})]}),(0,d.jsxs)(`div`,{className:`text-center space-y-6 max-w-2xl mx-auto pt-4 leading-relaxed`,children:[(0,d.jsx)(`p`,{className:`text-xs uppercase tracking-wider font-semibold text-slate-400`,children:`This is proudly presented to`}),(0,d.jsx)(`h2`,{className:`text-2xl sm:text-3xl font-black text-indigo-500 dark:text-indigo-400 font-heading border-b-2 border-indigo-500/10 pb-2 max-w-lg mx-auto print:text-indigo-650 print:border-indigo-550/20`,children:v}),(0,d.jsxs)(`p`,{className:`text-xs sm:text-sm text-slate-555 dark:text-slate-400 print:text-slate-700`,children:[`for successfully completing their Article Assistant / Internship training program in the department of `,(0,d.jsx)(`strong`,{className:`text-slate-800 dark:text-white font-bold print:text-black`,children:w?.department?.name||`Audit & Taxation`}),` at `,(0,d.jsx)(`strong`,{className:`text-slate-800 dark:text-white font-bold print:text-black`,children:b}),`.`]}),(0,d.jsxs)(`p`,{className:`text-xs sm:text-sm text-slate-555 dark:text-slate-400 print:text-slate-700`,children:[`During this period of `,(0,d.jsx)(`strong`,{className:`text-indigo-500 dark:text-indigo-400 font-bold print:text-indigo-650`,children:y}),`, their performance, operational conduct, and learning progress were evaluated as `,(0,d.jsx)(`strong`,{className:`text-slate-800 dark:text-white font-bold print:text-black`,children:S}),`.`]})]}),(0,d.jsxs)(`div`,{className:`grid grid-cols-1 sm:grid-cols-2 gap-8 pt-10 sm:pt-14 justify-between max-w-3xl mx-auto text-left`,children:[(0,d.jsxs)(`div`,{className:`space-y-1 self-end text-center sm:text-left`,children:[(0,d.jsx)(`span`,{className:`text-[10px] text-slate-400 font-bold uppercase tracking-wider block`,children:`Date of Issue`}),(0,d.jsx)(`span`,{className:`text-xs font-extrabold text-slate-850 dark:text-slate-300 print:text-black`,children:T}),(0,d.jsxs)(`span`,{className:`text-[9px] text-slate-400 block pt-1.5 flex items-center justify-center sm:justify-start gap-1`,children:[(0,d.jsx)(l,{className:`h-3.5 w-3.5 text-emerald-500`}),`Verified CA Office ERP Registry`]})]}),(0,d.jsxs)(`div`,{className:`space-y-1 text-center sm:text-right border-t border-slate-200 dark:border-slate-850 pt-4 sm:border-none sm:pt-0`,children:[(0,d.jsx)(`div`,{className:`h-10 flex justify-center sm:justify-end items-end italic text-indigo-500 font-serif text-lg`,children:x.split(` `).map(e=>e.charAt(0)).join(`. `)}),(0,d.jsx)(`div`,{className:`w-48 border-t border-indigo-500/25 dark:border-slate-800 ml-auto mr-auto sm:mr-0`}),(0,d.jsx)(`span`,{className:`text-[10px] text-slate-400 font-bold uppercase tracking-wider block pt-1`,children:`Authorized Signatory`}),(0,d.jsx)(`span`,{className:`text-xs font-bold text-slate-850 dark:text-slate-350 block print:text-black`,children:x})]})]})]})})}),(0,d.jsx)(`style`,{children:`
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
      `})]})};export{f as default};