import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  User, 
  Layers, 
  X, 
  CheckCircle, 
  Clock, 
  ArrowLeft, 
  ShieldAlert, 
  FileText,
  Badge,
  CalendarDays
} from 'lucide-react';
import axios from 'axios';
import { Class, Student, FeeStructure } from '../types';
import ReceiptModal from './ReceiptModal';

interface FinanceModuleProps {
  token: string | null;
  classes: Class[];
  activeStudentId: number | null; // redirected from student module list actions
  onClearActiveStudent: () => void;
}

export default function FinanceModule({ token, classes, activeStudentId, onClearActiveStudent }: FinanceModuleProps) {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Tab state
  const [activeTab, setActiveTab] = useState<'make_payments' | 'configure_structure'>('make_payments');

  // Directory search
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentLedger, setStudentLedger] = useState<any>(null);

  // Form State - Fee payments
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: '',
    paymentMethod: 'BANK_TRANSFER' as 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE' | 'MPESA' | 'AIRTEL_MONEY',
    transactionId: '',
    remarks: '',
    academicYear: '2024'
  });

  // Form State - Fee Configurations
  const [configForm, setConfigForm] = useState({
    classId: '',
    academicYear: '2024',
    totalFees: '12000',
    admissionFee: '1500',
    tuitionFee: '9000',
    libraryFee: '1000',
    sportsFee: '500',
    dueDate: '2024-10-31',
    lateFeePenalty: '150'
  });

  // Receipt Modal State
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<any>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchStudents = async () => {
    try {
      const res = await axios.get('/api/students', { headers });
      setStudents(res.data);
      
      // If activeStudentId was passed from router, pre-select
      if (activeStudentId) {
        setSelectedStudentId(activeStudentId.toString());
      } else if (res.data.length > 0 && !selectedStudentId) {
        setSelectedStudentId(res.data[0].id.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeStudentId]);

  // Fetch tuition ledger for selected student
  const fetchStudentLedger = async () => {
    if (!selectedStudentId) {
      setStudentLedger(null);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get(`/api/students/${selectedStudentId}/fees`, { headers });
      setStudentLedger(res.data);
      
      // Pre-populate amount paid with the due remaining amount
      if (res.data?.ledgers && res.data.ledgers.length > 0) {
        const primaryLedger = res.data.ledgers[0];
        setPaymentForm(prev => ({
          ...prev,
          amountPaid: primaryLedger.dueRemaining.toString() || '',
          transactionId: `TXN${Date.now().toString().slice(-6)}`
        }));
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Error generating billing parameters for this student.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentLedger();
  }, [selectedStudentId]);

  // Submit Tuition Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await axios.post('/api/payments/fee', {
        studentId: parseInt(selectedStudentId, 10),
        amountPaid: parseFloat(paymentForm.amountPaid),
        paymentMethod: paymentForm.paymentMethod,
        transactionId: paymentForm.transactionId,
        remarks: paymentForm.remarks,
        academicYear: paymentForm.academicYear
      }, { headers });

      setSuccessMsg(`Tuition Payment registered successfully!`);
      // Trigger receipt popup instantly
      setActiveReceiptPayment(res.data);
      setIsReceiptOpen(true);
      fetchStudentLedger();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Error recording payment ledger.");
    }
  };

  // Submit Fee Structure Configs
  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axios.post('/api/fee-structure', configForm, { headers });
      setSuccessMsg("Tuition Class Fee Structure configured successfully!");
      // Reset
      setConfigForm({
        classId: '',
        academicYear: '2024',
        totalFees: '12000',
        admissionFee: '1500',
        tuitionFee: '9000',
        libraryFee: '1000',
        sportsFee: '500',
        dueDate: '2024-10-31',
        lateFeePenalty: '150'
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Error compiling accounting structure.");
    }
  };

  const formatCurrency = (amt: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-705">
      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-sm font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-500" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-250 text-rose-800 text-sm font-medium rounded-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          {errorMsg}
        </div>
      )}

      {/* Finance Mode Back button if redirected */}
      {activeStudentId && (
        <button
          onClick={onClearActiveStudent}
          className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 hover:underline font-bold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Student Directory
        </button>
      )}

      {/* Segmented accounting sub-tabs */}
      <div className="flex border-b border-slate-200 gap-4 mb-2">
        <button
          onClick={() => setActiveTab('make_payments')}
          className={`pb-3 text-sm font-display font-medium tracking-tight border-b-2 cursor-pointer transition-all duration-200 flex items-center gap-2 px-1 ${
            activeTab === 'make_payments' 
              ? 'border-sky-500 text-sky-600 font-bold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <CreditCard className="w-4.5 h-4.5" />
          Student Tuition billing & Payments
        </button>

        <button
          onClick={() => setActiveTab('configure_structure')}
          className={`pb-3 text-sm font-display font-medium tracking-tight border-b-2 cursor-pointer transition-all duration-200 flex items-center gap-2 px-1 ${
            activeTab === 'configure_structure' 
              ? 'border-sky-500 text-sky-600 font-bold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-4.5 h-4.5" />
          Class Level Fee Structures configurations
        </button>
      </div>

      {activeTab === 'make_payments' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT BILLING SELECTOR SYSTEM */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-5 h-max">
            <div>
              <h4 className="font-display font-bold text-slate-855 text-md">1. Lock student account</h4>
              <p className="text-[11px] text-slate-400">Lock on student records to view active semester balance</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1.5">Select Pupil Record</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-655 bg-white focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">-- Choose student file --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id.toString()}>{s.firstName} {s.lastName} ({s.studentId})</option>
                  ))}
                </select>
              </div>

              {/* Rendering selected student metadata */}
              {studentLedger && studentLedger.student && (
                <div className="p-4 bg-slate-50 border rounded-xl flex gap-3 items-center">
                  <img 
                    src={studentLedger.student.profilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"} 
                    alt="Student Avatar" 
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">{studentLedger.student.firstName} {studentLedger.student.lastName}</h5>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">{studentLedger.student.studentId}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ACTIVE BALANCES DETAIL SHEET or PAYMENT FORM */}
          <div className="lg:col-span-2 space-y-6">
            {loading ? (
              <p className="p-12 text-center text-slate-400 bg-white border rounded-2xl text-xs font-semibold">Gleaning accounts profiles indices...</p>
            ) : studentLedger ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ACTIVE BILLING DETAIL SUB-PANEL */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-6">
                  <div>
                    <h4 className="font-display font-medium text-slate-400 text-[10px] uppercase font-mono mb-3">Balance outstanding</h4>
                    {studentLedger.ledgers && studentLedger.ledgers.length > 0 ? (
                      studentLedger.ledgers.map((l: any, idx: number) => {
                        const fee = l.feeStructure;
                        return (
                          <div key={idx} className="space-y-4">
                            <div className="flex justify-between items-baseline">
                              <span className="text-3xl font-display font-black text-slate-900">{formatCurrency(l.dueRemaining)}</span>
                              <span className="text-xs text-slate-400">Due Date: {l.dueDate || 'N/A'}</span>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl space-y-2 border text-xs">
                              <div className="flex justify-between text-slate-500 font-medium">
                                <span>Cohorts Tuition fee:</span>
                                <span className="font-mono text-slate-855">{formatCurrency(fee?.tuitionFee || 0)}</span>
                              </div>
                              <div className="flex justify-between text-slate-500 font-medium">
                                <span>Admission & enrollment:</span>
                                <span className="font-mono text-slate-855">{formatCurrency(fee?.admissionFee || 0)}</span>
                              </div>
                              <div className="flex justify-between text-slate-500 font-medium">
                                <span>Facilities, Library & Sports:</span>
                                <span className="font-mono text-slate-855">{formatCurrency((fee?.libraryFee || 0) + (fee?.sportsFee || 0))}</span>
                              </div>
                              <div className="flex justify-between border-t pt-2 font-bold text-slate-855 text-sm">
                                <span>Total Gross term fee:</span>
                                <span className="font-mono">{formatCurrency(fee?.totalFees || 0)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-slate-500">
                                <span>Total Cleared:</span>
                                <span className="font-mono text-emerald-600">-{formatCurrency(l.totalPaid || 0)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 bg-amber-50 rounded-xl text-amber-700 text-xs font-semibold flex items-center gap-1.5 border">
                        <ShieldAlert className="w-4.5 h-4.5" /> No active Class Cohort tuition structured.
                      </div>
                    )}
                  </div>

                  {/* Payment history summaries with receipt logs */}
                  <div className="space-y-3">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block border-b pb-1.5">Payment History Logs</span>
                    {studentLedger.ledgers && studentLedger.ledgers.some((l: any) => l.paymentsHistory?.length > 0) ? (
                      <div className="divide-y max-h-[140px] overflow-y-auto">
                        {studentLedger.ledgers.flatMap((l: any) => l.paymentsHistory).map((pay: any) => (
                          <div key={pay.id} className="py-2.5 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-slate-800">{pay.receiptNo}</span>
                              <p className="text-[10px] text-slate-400 mt-0.5">{pay.paymentDate} • <span className="uppercase font-mono text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-bold">{pay.paymentMethod}</span></p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-emerald-600">+{formatCurrency(pay.amountPaid)}</span>
                              <button
                                onClick={() => {
                                  setActiveReceiptPayment(pay);
                                  setIsReceiptOpen(true);
                                }}
                                className="text-sky-600 hover:text-sky-700 font-bold hover:underline cursor-pointer"
                                title="Download cleared receipt"
                              >
                                Receipt
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic py-2">No preceding transactions cleared.</p>
                    )}
                  </div>
                </div>

                {/* TUITION RECEIPT COLLECTOR FORM */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col gap-4">
                  <div>
                    <h4 className="font-display font-medium text-slate-400 text-[10px] uppercase font-mono">Collect payments</h4>
                    <p className="text-slate-500 text-xs mt-1">Submit cash checkout or register wire transfers</p>
                  </div>

                  <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Clearing Amount ($)</label>
                      <input
                        type="number"
                        step="any"
                        required
                        value={paymentForm.amountPaid}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                        className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-mono bg-white font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Method Type</label>
                        <select
                          value={paymentForm.paymentMethod}
                          onChange={(e) => {
                            const val = e.target.value as any;
                            let prefix = 'TXN';
                            if (val === 'MPESA') prefix = 'MPESA-';
                            else if (val === 'AIRTEL_MONEY') prefix = 'AIRT-';
                            else if (val === 'CHEQUE') prefix = 'CHQ-';
                            else if (val === 'BANK_TRANSFER') prefix = 'SLIP-';
                            setPaymentForm({ 
                              ...paymentForm, 
                              paymentMethod: val, 
                              transactionId: `${prefix}${Math.floor(100000 + Math.random() * 900000)}` 
                            });
                          }}
                          className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-slate-655 bg-white font-medium"
                        >
                          <option value="BANK_TRANSFER">Bank wire / Slip</option>
                          <option value="MPESA">Lipa Na M-Pesa</option>
                          <option value="AIRTEL_MONEY">Airtel Money</option>
                          <option value="CHEQUE">Bank Cheque</option>
                          <option value="CARD">Debit/Credit Card</option>
                          <option value="CASH">Cash Drawer</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Reference Code</label>
                        <input
                          type="text"
                          required
                          value={paymentForm.transactionId}
                          onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
                          className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-white text-slate-705 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Billing Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. Paid first semester tuition fee in full"
                        value={paymentForm.remarks}
                        onChange={(e) => setPaymentForm({ ...paymentForm, remarks: e.target.value })}
                        className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-705"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!studentLedger.ledgers || studentLedger.ledgers.length === 0}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl px-4 py-2 text-xs flex justify-center items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/10"
                    >
                      <DollarSign className="w-4 h-4" /> Clear tuition fees balance
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div className="bg-white p-12 border rounded-2xl text-slate-400 text-xs italic text-center font-medium">Please lock a student credential from the sidebar directory selector.</div>
            )}
          </div>
        </div>
      ) : (
        /* CONFIGURE CLASS-LEVEL TUITION MATRICULATION RULES */
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs max-w-lg">
          <div className="mb-6">
            <h4 className="font-display font-medium text-slate-400 text-[10px] uppercase font-mono"> matriculation billing rule</h4>
            <p className="text-xs text-slate-500 mt-1">Define baseline admission & course tuition values per Class Level</p>
          </div>

          <form onSubmit={handleConfigSubmit} className="space-y-4 text-slate-700">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Class Cohort Team</label>
                <select
                  required
                  value={configForm.classId}
                  onChange={(e) => setConfigForm({ ...configForm, classId: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs text-slate-600 bg-white"
                >
                  <option value="">-- Choose Class LEVEL --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.className} ({c.section})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Academic Cohort Term</label>
                <input
                  type="text"
                  required
                  value={configForm.academicYear}
                  onChange={(e) => setConfigForm({ ...configForm, academicYear: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-705"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Course tuition ($)</label>
                <input
                  type="number"
                  required
                  value={configForm.tuitionFee}
                  onChange={(e) => {
                    const t = parseFloat(e.target.value || '0');
                    const a = parseFloat(configForm.admissionFee || '0');
                    const l = parseFloat(configForm.libraryFee || '0');
                    const s = parseFloat(configForm.sportsFee || '0');
                    setConfigForm({ 
                      ...configForm, 
                      tuitionFee: e.target.value,
                      totalFees: (t + a + l + s).toString()
                    });
                  }}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-705 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Admission Fee ($)</label>
                <input
                  type="number"
                  required
                  value={configForm.admissionFee}
                  onChange={(e) => {
                    const t = parseFloat(configForm.tuitionFee || '0');
                    const a = parseFloat(e.target.value || '0');
                    const l = parseFloat(configForm.libraryFee || '0');
                    const s = parseFloat(configForm.sportsFee || '0');
                    setConfigForm({ 
                      ...configForm, 
                      admissionFee: e.target.value,
                      totalFees: (t + a + l + s).toString()
                    });
                  }}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-705 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Library charge ($)</label>
                <input
                  type="number"
                  required
                  value={configForm.libraryFee}
                  onChange={(e) => {
                    const t = parseFloat(configForm.tuitionFee || '0');
                    const a = parseFloat(configForm.admissionFee || '0');
                    const l = parseFloat(e.target.value || '0');
                    const s = parseFloat(configForm.sportsFee || '0');
                    setConfigForm({ 
                      ...configForm, 
                      libraryFee: e.target.value,
                      totalFees: (t + a + l + s).toString()
                    });
                  }}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-705 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Sports amenities ($)</label>
                <input
                  type="number"
                  required
                  value={configForm.sportsFee}
                  onChange={(e) => {
                    const t = parseFloat(configForm.tuitionFee || '0');
                    const a = parseFloat(configForm.admissionFee || '0');
                    const l = parseFloat(configForm.libraryFee || '0');
                    const s = parseFloat(e.target.value || '0');
                    setConfigForm({ 
                      ...configForm, 
                      sportsFee: e.target.value,
                      totalFees: (t + a + l + s).toString()
                    });
                  }}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-705 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Late penalty ($/day)</label>
                <input
                  type="number"
                  required
                  value={configForm.lateFeePenalty}
                  onChange={(e) => setConfigForm({ ...configForm, lateFeePenalty: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-705 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5 text-sky-600">Calculated Grand Total ($)</label>
                <input
                  type="text"
                  disabled
                  value={configForm.totalFees}
                  className="w-full bg-sky-50 border border-sky-200 rounded-xl px-3 py-2 text-xs text-sky-700 font-bold font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Default Due Date</label>
                <input
                  type="date"
                  required
                  value={configForm.dueDate}
                  onChange={(e) => setConfigForm({ ...configForm, dueDate: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-705"
                />
              </div>
            </div>

            <div className="pt-4 border-t flex justify-end gap-2.5">
              <button
                type="submit"
                className="px-5 py-2.5 bg-sky-500 text-white text-xs font-semibold rounded-xl hover:bg-sky-600 cursor-pointer shadow-lg shadow-sky-500/10"
              >
                Apply Term billing configurations
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PRINTABLE RECEIPT ENGINE POPUP */}
      {isReceiptOpen && studentLedger && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          student={studentLedger.student}
          payment={activeReceiptPayment}
        />
      )}
    </div>
  );
}
