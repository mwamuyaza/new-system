import React, { useRef } from 'react';
import { 
  X, 
  Printer, 
  CheckCircle, 
  Download, 
  ShieldCheck, 
  GraduationCap 
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: any;
  payment: {
    receiptNo: string;
    paymentDate: string;
    amountPaid: number;
    paymentMethod: string;
    transactionId: string;
    remarks: string;
    academicYear: string;
  } | null;
}

export default function ReceiptModal({ isOpen, onClose, student, payment }: ReceiptModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !payment || !student) return null;

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;

    if (printContent) {
      // Basic inline printing helper for sandboxed iframes
      const windowUrl = 'about:blank';
      const uniqueName = new Date().getTime().toString();
      const printWindow = window.open(windowUrl, uniqueName, 'left=50,top=50,width=800,height=600');
      
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Tuition Receipt - ${payment.receiptNo}</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            </head>
            <body class="bg-white p-8 max-w-xl mx-auto text-gray-800">
              ${printContent}
              <script>
                setTimeout(() => {
                  window.print();
                  window.close();
                }, 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      } else {
        alert("Pop-up blocked! Please allow pop-ups or use desktop print options.");
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4 font-sans text-slate-700">
      <div className="bg-white rounded-3xl shadow-2xl border max-w-lg w-full overflow-hidden flex flex-col">
        {/* Actions bar */}
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center text-xs font-semibold">
          <span className="text-slate-400">PDF RECEIPT ENGINE</span>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-100 flex items-center gap-1 cursor-pointer font-bold"
            >
              <Printer className="w-3.5 h-3.5" /> Print Receipt
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 text-slate-500 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Receipt Page Frame details (ref printable area) */}
        <div className="p-8 space-y-6 overflow-y-auto max-h-[75vh]" ref={printRef}>
          {/* Header invoice details */}
          <div className="flex justify-between items-start border-b pb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-sky-500 flex items-center justify-center text-white font-bold text-sm">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-display font-black text-slate-900 text-base">University Hub</span>
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono leading-tight">Tuition Accounting Office • State Blvd</p>
            </div>
            
            <div className="text-right space-y-1">
              <span className="inline-block bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono">CLEARED RECEIPT</span>
              <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">{payment.receiptNo}</p>
            </div>
          </div>

          {/* Student description and billing metadata */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-mono text-[9px] uppercase font-bold text-slate-400">Billed to Pupil</span>
              <h5 className="font-bold text-slate-800 text-sm mt-0.5">{student.firstName} {student.lastName}</h5>
              <p className="text-slate-500 mt-0.5">{student.email}</p>
              <p className="text-slate-400 mt-0.5">ID Code: {student.studentId}</p>
            </div>

            <div className="text-right">
              <span className="font-mono text-[9px] uppercase font-bold text-slate-400">Billing details</span>
              <p className="text-slate-700 mt-0.5 font-medium">Date: <span className="font-mono">{payment.paymentDate}</span></p>
              <p className="text-slate-500 mt-0.5">Academic Cohort: Year {payment.academicYear}</p>
              <p className="text-slate-400 mt-0.5">Ref ID: <span className="font-mono uppercase">{payment.transactionId}</span></p>
            </div>
          </div>

          {/* Ledger description table */}
          <div className="border border-slate-150 rounded-2xl overflow-hidden text-xs">
            <div className="grid grid-cols-3 bg-slate-50 border-b p-3 font-mono text-[9px] text-slate-400 uppercase tracking-wider font-bold">
              <span className="col-span-2">Fees Classification Description</span>
              <span className="text-right">Billed cleared</span>
            </div>
            <div className="p-3.5 space-y-2.5">
              <div className="flex justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block">Semester Tuition Fee Allocation</span>
                  <span className="text-[10px] text-slate-400">Standard educational credits syllabus</span>
                </div>
                <span className="font-mono font-bold text-slate-800">{formatCurrency(payment.amountPaid)}</span>
              </div>
            </div>
          </div>

          {/* Summary values */}
          <div className="border-t pt-4 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Gross Cleared Sum</span>
              <span className="font-mono">{formatCurrency(payment.amountPaid)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Administrative Taxes</span>
              <span className="font-mono">$0.00</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t">
              <span>Total Paid Currency</span>
              <span className="font-mono text-emerald-600">{formatCurrency(payment.amountPaid)}</span>
            </div>
          </div>

          {/* Footer remarks */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-150/60 text-[10px] text-slate-400 leading-normal space-y-1">
            <div className="font-bold uppercase font-mono tracking-wider text-[8px] text-slate-500">Receipt Notes & Acknowledgements</div>
            {payment.remarks ? <p className="text-slate-550 font-medium font-sans">"{payment.remarks}"</p> : null}
            <p className="font-sans font-normal">This cleared receipt constitutes validation of educational payments cleared through university accounts. Keep this receipt file safely for active academic term certifications.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
