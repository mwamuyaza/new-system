import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  CheckCircle, 
  FileText, 
  Loader2, 
  TrendingUp, 
  ArrowRight, 
  Sparkles, 
  Lock, 
  User, 
  Phone, 
  Calendar, 
  Building, 
  Upload, 
  Image as ImageIcon,
  Check, 
  X, 
  Download, 
  Printer, 
  ChevronRight, 
  ArrowLeft,
  Copy
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';

interface StudentFeesPortalProps {
  token: string | null;
  user: any;
}

export default function StudentFeesPortal({ token, user }: StudentFeesPortalProps) {
  const [loading, setLoading] = useState(true);
  const [ledger, setLedger] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Payments Panel State
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'options' | 'details' | 'stk_simulate' | 'success'>('options');
  const [selectedMethod, setSelectedMethod] = useState<'MPESA' | 'AIRTEL_MONEY' | 'BANK_TRANSFER' | 'CHEQUE' | null>(null);
  
  // Receipt State
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // Form inputs
  const [payAmount, setPayAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [remarks, setRemarks] = useState('');
  
  // Kenyan Bank details
  const [selectedBank, setSelectedBank] = useState('KCB');
  const [bankSlipRef, setBankSlipRef] = useState('');
  const [bankSlipPreview, setBankSlipPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Cheque details
  const [chequeNo, setChequeNo] = useState('');
  const [chequeBank, setChequeBank] = useState('KCB');
  const [chequeDrawer, setChequeDrawer] = useState('');
  const [chequeDate, setChequeDate] = useState('');

  // Interactive PIN Simulation State
  const [mpesaPin, setMpesaPin] = useState('');
  const [isProcessingStk, setIsProcessingStk] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);

  const EXCHANGE_RATE = 130; // 1 USD = 130 KES
  const headers = { Authorization: `Bearer ${token}` };

  const fetchLedger = async () => {
    setLoading(true);
    try {
      // Find the database Student ID
      const studentDbId = user.studentId;
      const res = await axios.get(`/api/students/${studentDbId}/fees`, { headers });
      setLedger(res.data);
      
      // Auto pre-fill values
      if (res.data?.student) {
        setPhoneNumber(res.data.student.phone || '0712345678');
        setStudentIdInput(res.data.student.studentId || '');
        setChequeDrawer(`${res.data.student.firstName} ${res.data.student.lastName}`);
      }
      
      if (res.data?.ledgers && res.data.ledgers.length > 0) {
        setPayAmount(res.data.ledgers[0].dueRemaining.toString());
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to retrieve your tuition ledger details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.studentId) {
      fetchLedger();
    }
  }, [user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleMethodSelect = (method: 'MPESA' | 'AIRTEL_MONEY' | 'BANK_TRANSFER' | 'CHEQUE') => {
    setSelectedMethod(method);
    setPaymentStep('details');
  };

  // Drag and drop mock file handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate drop slip image
    setBankSlipPreview("https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3");
    if (!bankSlipRef) {
      setBankSlipRef(`DEP-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  };

  const triggerMockSlipSelect = () => {
    setBankSlipPreview("https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3");
    if (!bankSlipRef) {
      setBankSlipRef(`DEP-${Math.floor(100000 + Math.random() * 900000)}`);
    }
  };

  // Submit payment initiation
  const handleInitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    if (selectedMethod === 'MPESA') {
      try {
        setIsProcessingStk(true);
        setErrorMsg('');
        
        // Initiate real backend STK push which validates phone and student registry
        const res = await axios.post('/api/payments/mpesa/stkpush', {
          phoneNumber: phoneNumber,
          schoolId: studentIdInput || String(user.studentId),
          amount: parseFloat(payAmount),
          remarks: remarks || `Tuition Payment via Lipa Na M-Pesa STK`
        }, { headers });

        setCheckoutRequestId(res.data.CheckoutRequestID);
        setMpesaPin('');
        setPaymentStep('stk_simulate');
      } catch (err: any) {
        console.error("STK push error:", err);
        setErrorMsg(err.response?.data?.error || "Failed to trigger M-Pesa STK push. Make sure student ID and phone number are correct.");
      } finally {
        setIsProcessingStk(false);
      }
    } else if (selectedMethod === 'AIRTEL_MONEY') {
      // Go to interactive mobile simulator screen for Airtel money (uses mock fallback)
      setMpesaPin('');
      setPaymentStep('stk_simulate');
    } else {
      // Direct submission for bank options
      submitPaymentToBackend();
    }
  };

  const submitPaymentToBackend = async (simulatedTxId?: string) => {
    try {
      setIsProcessingStk(true);
      setErrorMsg('');

      let txId = simulatedTxId;
      let finalRemarks = remarks;

      if (selectedMethod === 'MPESA') {
        txId = txId || `MPESA-${Date.now().toString().slice(-6).toUpperCase()}`;
        finalRemarks = remarks || `Lipa Na M-Pesa STK push for school fees. Paid via ${phoneNumber}`;
      } else if (selectedMethod === 'AIRTEL_MONEY') {
        txId = txId || `AIRT-${Date.now().toString().slice(-6).toUpperCase()}`;
        finalRemarks = remarks || `Airtel Money payment for school fees. Paid via ${phoneNumber}`;
      } else if (selectedMethod === 'BANK_TRANSFER') {
        txId = bankSlipRef || `SLIP-${Date.now().toString().slice(-6).toUpperCase()}`;
        finalRemarks = remarks || `Bank Deposit to ${selectedBank} Account. Slip Ref: ${txId}`;
      } else if (selectedMethod === 'CHEQUE') {
        txId = `CHQ-${chequeNo || Date.now().toString().slice(-6)}`;
        finalRemarks = remarks || `Bank Cheque from ${chequeBank}. No: ${chequeNo}, Drawer: ${chequeDrawer}`;
      }

      const postData = {
        studentId: user.studentId,
        amountPaid: parseFloat(payAmount),
        paymentMethod: selectedMethod,
        transactionId: txId,
        remarks: finalRemarks,
        academicYear: ledger?.ledgers?.[0]?.classDetail?.academicYear || "2024"
      };

      const res = await axios.post('/api/payments/fee', postData, { headers });
      
      setSuccessMsg("Payment successfully processed and reflected directly in your account!");
      setSelectedReceipt(res.data);
      setPaymentStep('success');
      fetchLedger();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || "Failed to process security payment handshake.");
      setPaymentStep('details');
    } finally {
      setIsProcessingStk(false);
    }
  };

  // Simulate keypad clicks on the smartphone
  const handleKeypadClick = (num: string) => {
    if (mpesaPin.length < 4) {
      setMpesaPin(prev => prev + num);
    }
  };

  const handleKeypadDelete = () => {
    setMpesaPin(prev => prev.slice(0, -1));
  };

  const handlePinSubmit = async () => {
    if (mpesaPin.length !== 4) return;
    setIsProcessingStk(true);
    setErrorMsg('');

    if (selectedMethod === 'MPESA' && checkoutRequestId) {
      // Polling function for real M-Pesa callback status confirmation
      let pollCount = 0;
      const maxPolls = 15; // 15 seconds max
      
      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          const res = await axios.get(`/api/payments/mpesa/status/${checkoutRequestId}`, { headers });
          
          if (res.data.status === 'SUCCESS') {
            clearInterval(pollInterval);
            setIsProcessingStk(false);
            setSuccessMsg("Lipa Na M-Pesa payment confirmed successfully by callback handler!");
            setPaymentStep('success');
            fetchLedger();
          } else if (res.data.status === 'FAILED') {
            clearInterval(pollInterval);
            setIsProcessingStk(false);
            setErrorMsg("STK push payment was cancelled or rejected by the user.");
            setPaymentStep('details');
          } else if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setIsProcessingStk(false);
            setErrorMsg("Transaction confirmation timed out. Please check transaction history soon.");
            setPaymentStep('details');
          }
        } catch (err) {
          console.error("Polling error:", err);
          clearInterval(pollInterval);
          setIsProcessingStk(false);
          setErrorMsg("Error while validating transaction callback confirmation.");
          setPaymentStep('details');
        }
      }, 1000);
    } else {
      // Airtel Money fallback (simulated local response)
      setTimeout(() => {
        const safaricomCodes = ["SJA87GDF4D", "SKL29DJH83", "SMN39FKS92", "SBT48DKD81"];
        const generatedCode = safaricomCodes[Math.floor(Math.random() * safaricomCodes.length)];
        submitPaymentToBackend(generatedCode);
      }, 2500);
    }
  };

  const formatUsd = (amt: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amt);
  };

  const formatKes = (amtUsd: number) => {
    const kes = amtUsd * EXCHANGE_RATE;
    return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES' }).format(kes);
  };

  const openReceipt = (payment: any) => {
    setSelectedReceipt(payment);
    setIsReceiptOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
        <span className="text-xs text-slate-500 font-mono">Reconciling tuition accounts ledger...</span>
      </div>
    );
  }

  const primaryLedger = ledger?.ledgers?.[0];
  const outstandingUsd = primaryLedger ? primaryLedger.dueRemaining : 0;
  const totalPaidUsd = primaryLedger ? primaryLedger.totalPaid : 0;
  const grossFeeUsd = primaryLedger?.feeStructure?.totalFees || 0;

  return (
    <div className="space-y-6 font-sans text-slate-705 max-w-5xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase bg-sky-50 text-sky-600 px-2 py-0.5 rounded-md font-bold tracking-wider border border-sky-100">Kenyan Payment Integrated</span>
          <h1 className="text-xl font-bold font-display text-slate-900 mt-1.5">Tuition Ledger & Checkout</h1>
          <p className="text-xs text-slate-500">View real-time fee balances and clear outstanding tuition instantly via integrated M-Pesa STK Push or Local Banks.</p>
        </div>
        
        {outstandingUsd > 0 && (
          <button
            onClick={() => {
              setPaymentStep('options');
              setSelectedMethod(null);
              setIsPayModalOpen(true);
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-600/10 cursor-pointer transition-all hover:-translate-y-0.5"
          >
            <CreditCard className="w-4 h-4" />
            Pay School Fees Online
          </button>
        )}
      </div>

      {/* DASHBOARD LEDGER KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Outstanding Balance */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden shadow-xl shadow-slate-900/10">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <span className="text-[10px] font-mono uppercase text-sky-400 font-semibold tracking-wider">Outstanding Balance Due</span>
          <h2 className="text-3xl font-display font-black mt-2">{formatUsd(outstandingUsd)}</h2>
          <p className="text-[11px] font-mono text-slate-300 mt-1 flex items-center gap-1">
            <span>≈ {formatKes(outstandingUsd)} KES</span>
            <span className="text-[9px] bg-white/10 px-1 py-0.5 rounded">@ 130</span>
          </p>
          {outstandingUsd > 0 ? (
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
              <span>Please clear balance by the term due date.</span>
            </div>
          ) : (
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>All balances fully cleared for this term!</span>
            </div>
          )}
        </div>

        {/* Total Term Paid */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 relative">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Total Fees Cleared</span>
          <h2 className="text-3xl font-display font-bold text-slate-900 mt-2">{formatUsd(totalPaidUsd)}</h2>
          <p className="text-[11px] font-mono text-slate-400 mt-1">≈ {formatKes(totalPaidUsd)} KES</p>
          
          <div className="mt-4 flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span>Matriculation rate:</span>
            <span className="font-mono text-slate-800 font-bold">
              {grossFeeUsd > 0 ? `${Math.round((totalPaidUsd / grossFeeUsd) * 100)}% Complete` : '0%'}
            </span>
          </div>
        </div>

        {/* Dynamic Class Tuition Rule */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Active Enrollment Block</span>
          <h3 className="font-display font-semibold text-slate-800 text-sm mt-2.5">
            {primaryLedger?.classDetail?.className || 'No Active Program'} - {primaryLedger?.classDetail?.section || ''}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Cohort Academic Period: {primaryLedger?.classDetail?.academicYear || 'N/A'}</p>
          
          <div className="mt-3.5 grid grid-cols-2 gap-2 text-[10px] bg-slate-50 p-2 rounded-xl border border-slate-100 text-slate-500">
            <div>
              <span>Admission fee:</span>
              <p className="font-mono text-slate-800 font-semibold">{formatUsd(primaryLedger?.feeStructure?.admissionFee || 0)}</p>
            </div>
            <div>
              <span>Term Tuition:</span>
              <p className="font-mono text-slate-800 font-semibold">{formatUsd(primaryLedger?.feeStructure?.tuitionFee || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED FEE STRUCTURE SUMMARY AND TRANSACTION ARCHIVE TABS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ledger Breakdown Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-max">
          <div className="flex items-center gap-2 border-b pb-3 mb-4">
            <FileText className="w-4 h-4 text-sky-500" />
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide font-mono">Invoice Allocation</h4>
          </div>

          {primaryLedger?.feeStructure ? (
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Base Tuition Class:</span>
                <span className="font-mono font-bold text-slate-800">{formatUsd(primaryLedger.feeStructure.tuitionFee)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Admission Fee:</span>
                <span className="font-mono font-bold text-slate-800">{formatUsd(primaryLedger.feeStructure.admissionFee)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Library & Research:</span>
                <span className="font-mono font-bold text-slate-800">{formatUsd(primaryLedger.feeStructure.libraryFee)}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Sports & Amenities:</span>
                <span className="font-mono font-bold text-slate-800">{formatUsd(primaryLedger.feeStructure.sportsFee)}</span>
              </div>
              {primaryLedger.feeStructure.lateFeePenalty > 0 && (
                <div className="flex justify-between items-center py-1 text-rose-600 bg-rose-50 px-2 py-1 rounded">
                  <span>Late Submission Penalty:</span>
                  <span className="font-mono font-bold">{formatUsd(primaryLedger.feeStructure.lateFeePenalty)}</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t pt-3 font-bold text-slate-900 text-sm">
                <span>Total Term Invoice:</span>
                <span className="font-mono text-sky-600">{formatUsd(primaryLedger.feeStructure.totalFees)}</span>
              </div>

              <div className="mt-4 pt-2 border-t text-[11px] text-slate-400">
                <p>Invoice issued: {primaryLedger.classDetail.createdAt?.split('T')[0] || 'Term Opening'}</p>
                <p className="font-semibold text-slate-500 mt-1">Due deadline: {primaryLedger.feeStructure.dueDate}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic text-center py-6">No structured billing configurations found for this cohort class.</p>
          )}
        </div>

        {/* Transaction History / Receipts */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center border-b pb-3 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide font-mono">Payment History & Receipts</h4>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">
              {primaryLedger?.paymentsHistory?.length || 0} Transactions
            </span>
          </div>

          {primaryLedger?.paymentsHistory && primaryLedger.paymentsHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b text-slate-400 font-mono text-[10px] uppercase font-bold">
                    <th className="pb-3">Receipt No.</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Reference/TXID</th>
                    <th className="pb-3 text-right">Amount Paid</th>
                    <th className="pb-3 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {primaryLedger.paymentsHistory.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 font-bold text-slate-800">{p.receiptNo}</td>
                      <td className="py-3.5 text-slate-500">{p.paymentDate}</td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider ${
                          p.paymentMethod === 'MPESA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          p.paymentMethod === 'AIRTEL_MONEY' ? 'bg-red-50 text-red-700 border border-red-100' :
                          p.paymentMethod === 'BANK_TRANSFER' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          'bg-slate-50 text-slate-600 border border-slate-150'
                        }`}>
                          {p.paymentMethod === 'MPESA' ? 'M-PESA' : 
                           p.paymentMethod === 'AIRTEL_MONEY' ? 'AIRTEL' : 
                           p.paymentMethod === 'BANK_TRANSFER' ? 'BANK DEP.' : p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 font-mono text-[11px]">
                        <div className="flex items-center gap-1">
                          <span className="truncate max-w-[120px]">{p.transactionId}</span>
                          <button 
                            onClick={() => copyToClipboard(p.transactionId)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copy transaction ref"
                          >
                            {copiedText === p.transactionId ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-mono font-bold text-slate-900">{formatUsd(p.amountPaid)}</td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => openReceipt(p)}
                          className="text-sky-600 hover:text-sky-700 hover:underline font-bold font-mono text-[10px] flex items-center gap-1 justify-center mx-auto cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 italic">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2.5" />
              <p>No fee payments registered yet. All tuition dues are outstanding.</p>
            </div>
          )}
        </div>
      </div>

      {/* DYNAMIC SECURE ONLINE CHECKOUT MODAL */}
      <AnimatePresence>
        {isPayModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-6 relative flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-mono uppercase text-sky-400 font-bold tracking-wider">Secure Integrated Billing</span>
                  <h3 className="text-md font-bold font-display mt-1">Clear School Fees & Tuition</h3>
                </div>
                <button 
                  onClick={() => setIsPayModalOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-all cursor-pointer text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* STEP 1: OPTIONS SELECTOR */}
                {paymentStep === 'options' && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-xs text-slate-500">Choose your preferred mode of payment in Kenya. STK Push will initiate a prompt directly to your phone.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* M-PESA */}
                      <button
                        onClick={() => handleMethodSelect('MPESA')}
                        className="p-4 border rounded-2xl text-left hover:border-emerald-500 hover:bg-emerald-50/20 transition-all group cursor-pointer flex flex-col justify-between h-28"
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                            M
                          </span>
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded font-bold font-mono">STK PUSH</span>
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs group-hover:text-emerald-700 transition-colors">Lipa Na M-Pesa</h5>
                          <p className="text-[10px] text-slate-400">Mobile Money STK Push</p>
                        </div>
                      </button>

                      {/* AIRTEL MONEY */}
                      <button
                        onClick={() => handleMethodSelect('AIRTEL_MONEY')}
                        className="p-4 border rounded-2xl text-left hover:border-red-500 hover:bg-red-50/20 transition-all group cursor-pointer flex flex-col justify-between h-28"
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 font-bold text-xs">
                            A
                          </span>
                          <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold font-mono">EXPRESS</span>
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs group-hover:text-red-700 transition-colors">Airtel Money</h5>
                          <p className="text-[10px] text-slate-400">Airtel Express Transfer</p>
                        </div>
                      </button>

                      {/* BANK DEPOSIT / WIRE */}
                      <button
                        onClick={() => handleMethodSelect('BANK_TRANSFER')}
                        className="p-4 border rounded-2xl text-left hover:border-blue-500 hover:bg-blue-50/20 transition-all group cursor-pointer flex flex-col justify-between h-28"
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            <Building className="w-4 h-4" />
                          </span>
                          <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-bold font-mono">SLIP UPLOAD</span>
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs group-hover:text-blue-700 transition-colors">Bank Deposit / Slip</h5>
                          <p className="text-[10px] text-slate-400">KCB, Equity, Co-op Bank</p>
                        </div>
                      </button>

                      {/* BANK CHEQUE */}
                      <button
                        onClick={() => handleMethodSelect('CHEQUE')}
                        className="p-4 border rounded-2xl text-left hover:border-slate-500 hover:bg-slate-50 transition-all group cursor-pointer flex flex-col justify-between h-28"
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                            <FileText className="w-4 h-4" />
                          </span>
                          <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-bold font-mono">CHEQUE</span>
                        </div>
                        <div>
                          <h5 className="font-bold text-slate-800 text-xs group-hover:text-slate-800 transition-colors">Bank Cheque</h5>
                          <p className="text-[10px] text-slate-400">Register Cheque Details</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: FILL DETAILS PER MODE */}
                {paymentStep === 'details' && (
                  <form onSubmit={handleInitPayment} className="space-y-4">
                    {/* Selected Indicator */}
                    <div className="flex items-center justify-between bg-slate-50 border p-3 rounded-xl text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-sky-600">
                          {selectedMethod === 'MPESA' && 'Lipa Na M-Pesa'}
                          {selectedMethod === 'AIRTEL_MONEY' && 'Airtel Money'}
                          {selectedMethod === 'BANK_TRANSFER' && 'Bank Deposit Slip'}
                          {selectedMethod === 'CHEQUE' && 'Bank Cheque'}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setPaymentStep('options')} 
                        className="text-[10px] text-slate-400 hover:text-slate-600 hover:underline cursor-pointer flex items-center gap-1 font-bold"
                      >
                        <ArrowLeft className="w-3 h-3" /> Change Mode
                      </button>
                    </div>

                    {/* Shared: Amount to Pay */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Amount to pay ($ USD)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="number"
                          step="any"
                          required
                          value={payAmount}
                          onChange={(e) => setPayAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-800 font-mono font-bold"
                        />
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        ≈ {formatKes(parseFloat(payAmount) || 0)} KES (Current Central Bank rate of 1 USD = 130 KES)
                      </p>
                    </div>

                    {/* MPESA OR AIRTEL: MOBILE INPUTS */}
                    {(selectedMethod === 'MPESA' || selectedMethod === 'AIRTEL_MONEY') && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">M-Pesa / Airtel Mobile Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              placeholder="e.g. 0712345678"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-800"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Student School ID</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              required
                              value={studentIdInput}
                              onChange={(e) => setStudentIdInput(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-slate-850 font-bold bg-slate-100/50"
                              disabled
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* BANK DEPOSIT / SLIP */}
                    {selectedMethod === 'BANK_TRANSFER' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Deposit Institution</label>
                            <select
                              value={selectedBank}
                              onChange={(e) => setSelectedBank(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium"
                            >
                              <option value="KCB">Kenya Commercial Bank (KCB)</option>
                              <option value="EQUITY">Equity Bank Kenya</option>
                              <option value="COOP">Co-operative Bank of Kenya</option>
                              <option value="NCBA">NCBA Bank Kenya</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Deposit Slip / Ref Code</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. DEP-91283"
                              value={bankSlipRef}
                              onChange={(e) => setBankSlipRef(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono"
                            />
                          </div>
                        </div>

                        {/* Interactive drag-and-drop box */}
                        <div className="space-y-1">
                          <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Upload Slip Image / Copy</label>
                          <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={triggerMockSlipSelect}
                            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                              isDragging ? 'border-sky-500 bg-sky-50/30 scale-95' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/50'
                            }`}
                          >
                            {bankSlipPreview ? (
                              <div className="space-y-2">
                                <img src={bankSlipPreview} alt="Receipt Slip Preview" className="w-16 h-16 rounded-lg object-cover mx-auto border" />
                                <span className="text-[10px] font-mono text-emerald-600 font-bold flex items-center justify-center gap-1">
                                  <Check className="w-3.5 h-3.5" /> slip_deposit_proof.jpg uploaded!
                                </span>
                              </div>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-slate-400" />
                                <p className="text-xs font-bold text-slate-700">Drag & drop paper slip here or click to select</p>
                                <span className="text-[10px] text-slate-400 italic font-mono">Supports PDF, PNG, JPG</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CHEQUE INPUTS */}
                    {selectedMethod === 'CHEQUE' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Cheque Bank Origin</label>
                            <select
                              value={chequeBank}
                              onChange={(e) => setChequeBank(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium"
                            >
                              <option value="KCB">KCB Bank</option>
                              <option value="EQUITY">Equity Bank</option>
                              <option value="COOP">Co-operative Bank</option>
                              <option value="ABSA">ABSA Bank Kenya</option>
                              <option value="STANBIC">Stanbic Bank Kenya</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Cheque Number (6 digits)</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 002134"
                              maxLength={6}
                              value={chequeNo}
                              onChange={(e) => setChequeNo(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Cheque Drawer / A/C Name</label>
                            <input
                              type="text"
                              required
                              value={chequeDrawer}
                              onChange={(e) => setChequeDrawer(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Cheque Issue Date</label>
                            <input
                              type="date"
                              required
                              value={chequeDate}
                              onChange={(e) => setChequeDate(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shared Billing Remarks */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold">Billing Memo / Remarks</label>
                      <input
                        type="text"
                        placeholder="e.g. Clear tuition fees in full"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessingStk}
                      className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-2xl py-3 text-xs flex justify-center items-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      {isProcessingStk ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Preparing Payment gateway...
                        </>
                      ) : (
                        <>
                          <span>Initiate Security Checkout</span> <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 3: M-PESA STK PUSH INTERACTIVE SMARTPHONE SIMULATOR */}
                {paymentStep === 'stk_simulate' && (
                  <div className="flex flex-col items-center justify-center py-4 space-y-6">
                    <div className="text-center">
                      <h4 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-wider">Lipa Na M-Pesa STK Push Prompt Simulator</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Safaricom is dispatching a secured PIN pop-up to {phoneNumber}. Please use the smartphone interface below to confirm payment.</p>
                    </div>

                    {/* Interactive Mobile Device Mockup */}
                    <div className="w-72 bg-slate-900 rounded-[40px] p-4.5 border-[6px] border-slate-800 shadow-2xl relative">
                      {/* Notch */}
                      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-950 rounded-full flex items-center justify-center gap-1.5 z-10">
                        <span className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                        <span className="w-8 h-1 bg-slate-800 rounded" />
                      </div>

                      {/* Screen Container */}
                      <div className="bg-slate-950 text-white h-[420px] rounded-[32px] overflow-hidden flex flex-col justify-between p-4 font-sans relative">
                        {/* Notification Status bar */}
                        <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 px-1 mt-1">
                          <span>Safaricom LTE</span>
                          <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>

                        {/* Interactive Lipa Na Mpesa Box Overlay */}
                        <div className="bg-slate-900 border border-slate-750 p-4 rounded-2xl my-auto space-y-4 animate-fade-in text-slate-200">
                          <div className="text-center border-b border-slate-750 pb-2">
                            <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-widest">LIPA NA M-PESA</span>
                          </div>

                          <div className="space-y-1 text-center">
                            <p className="text-[11px] text-slate-300">Do you want to pay KSh {Math.round(parseFloat(payAmount) * EXCHANGE_RATE)} to Paybill 890890 (University Hub)?</p>
                          </div>

                          {/* PIN Display Circle Bullets */}
                          <div className="flex justify-center gap-3 py-1.5">
                            {[0, 1, 2, 3].map((idx) => (
                              <div 
                                key={idx} 
                                className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                                  mpesaPin.length > idx 
                                    ? 'bg-emerald-400 border-emerald-400 scale-110' 
                                    : 'border-slate-500 bg-transparent'
                                }`} 
                              />
                            ))}
                          </div>

                          <p className="text-[9px] text-slate-400 italic text-center">Security Warning: Never share your M-Pesa PIN.</p>
                        </div>

                        {/* Keypad Panel */}
                        <div className="space-y-1">
                          <div className="grid grid-cols-3 gap-1.5 text-center">
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                              <button
                                key={digit}
                                type="button"
                                onClick={() => handleKeypadClick(digit)}
                                className="bg-slate-850 hover:bg-slate-800 text-white rounded-full py-2.5 font-bold text-xs cursor-pointer active:scale-90 transition-transform"
                              >
                                {digit}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={handleKeypadDelete}
                              className="bg-slate-850 hover:bg-slate-800 text-white rounded-full py-2.5 font-bold text-[10px] text-red-400 cursor-pointer"
                            >
                              DEL
                            </button>
                            <button
                              type="button"
                              onClick={() => handleKeypadClick('0')}
                              className="bg-slate-850 hover:bg-slate-800 text-white rounded-full py-2.5 font-bold text-xs cursor-pointer"
                            >
                              0
                            </button>
                            <button
                              type="button"
                              onClick={handlePinSubmit}
                              disabled={mpesaPin.length !== 4 || isProcessingStk}
                              className={`rounded-full py-2.5 font-bold text-[10px] cursor-pointer flex items-center justify-center ${
                                mpesaPin.length === 4 
                                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 animate-pulse' 
                                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              }`}
                            >
                              {isProcessingStk ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'SEND'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPaymentStep('details')}
                      className="text-xs text-slate-400 hover:text-slate-600 hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Cancel transaction request
                    </button>
                  </div>
                )}

                {/* STEP 4: SUCCESS DISPLAY */}
                {paymentStep === 'success' && (
                  <div className="text-center py-6 space-y-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                      <CheckCircle className="w-8 h-8" />
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="text-slate-900 font-bold font-display text-md">Transaction Cleared Successfully!</h4>
                      <p className="text-xs text-slate-500 px-6">Your payment of <strong className="text-slate-800">{formatUsd(parseFloat(payAmount))}</strong> has been successfully credited directly to your university student account profile.</p>
                    </div>

                    {selectedReceipt && (
                      <div className="bg-slate-50 border rounded-2xl p-4 text-left max-w-sm mx-auto text-xs font-mono space-y-1 text-slate-600">
                        <div className="flex justify-between border-b pb-1 mb-1 font-bold text-slate-800">
                          <span>Invoice Receipt:</span>
                          <span>{selectedReceipt.receiptNo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Clearing Amount:</span>
                          <span className="font-bold text-emerald-600">{formatUsd(selectedReceipt.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Exchange KES:</span>
                          <span>≈ {formatKes(selectedReceipt.amountPaid)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Receipt Date:</span>
                          <span>{selectedReceipt.paymentDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Lipa Reference No:</span>
                          <span className="font-bold text-slate-800">{selectedReceipt.transactionId}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-3 justify-center pt-2">
                      <button
                        onClick={() => {
                          setIsPayModalOpen(false);
                          if (selectedReceipt) {
                            openReceipt(selectedReceipt);
                          }
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" /> View Receipt PDF
                      </button>
                      <button
                        onClick={() => setIsPayModalOpen(false)}
                        className="border border-slate-200 hover:bg-slate-50 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer text-slate-600"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED PRINTABLE RECEIPT MODAL */}
      <AnimatePresence>
        {isReceiptOpen && selectedReceipt && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-auto"
            >
              {/* Receipt Body */}
              <div id="printable-receipt" className="p-8 space-y-6 text-slate-700 bg-white">
                {/* School Header Logo area */}
                <div className="flex justify-between items-start border-b pb-4 border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">University Hub Academic</span>
                    <h2 className="text-md font-black font-display text-slate-900">OFFICIAL TUITION RECEIPT</h2>
                    <p className="text-[10px] text-slate-400">IT & Finance Administration Office • Nairobi, Kenya</p>
                  </div>
                  <div className="text-right space-y-1 text-xs">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Receipt No</span>
                    <p className="font-mono font-bold text-slate-900">{selectedReceipt.receiptNo}</p>
                    <p className="text-[10px] text-slate-400">{selectedReceipt.paymentDate}</p>
                  </div>
                </div>

                {/* Student details box */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Billed Student</span>
                    <p className="font-bold text-slate-800">{ledger?.student?.firstName} {ledger?.student?.lastName}</p>
                    <p className="font-mono text-slate-500">{ledger?.student?.studentId}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">Course / Cohort</span>
                    <p className="font-bold text-slate-855">{primaryLedger?.classDetail?.className || 'N/A'}</p>
                    <p className="text-slate-500 font-mono text-[10px]">Academic Year: {selectedReceipt.academicYear}</p>
                  </div>
                </div>

                {/* Amount Table */}
                <div className="space-y-3">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-bold block">Ledger Settlement Breakdown</span>
                  <div className="border rounded-xl overflow-hidden text-xs">
                    <div className="grid grid-cols-3 bg-slate-50 p-2.5 font-mono text-[9px] uppercase font-bold text-slate-400 border-b">
                      <span className="col-span-2">Settlement Account Items</span>
                      <span className="text-right">Settled Amount (USD)</span>
                    </div>
                    <div className="grid grid-cols-3 p-3 border-b">
                      <span className="col-span-2 font-medium text-slate-700">Tuition & Enrollment Matriculation Clearance</span>
                      <span className="text-right font-mono font-bold text-slate-800">{formatUsd(selectedReceipt.amountPaid)}</span>
                    </div>
                    <div className="grid grid-cols-3 bg-sky-50/20 p-3 font-bold text-slate-900">
                      <span className="col-span-2 text-sky-700">Total Settlement:</span>
                      <span className="text-right font-mono text-sky-700">{formatUsd(selectedReceipt.amountPaid)}</span>
                    </div>
                  </div>
                </div>

                {/* Gateway Metadata */}
                <div className="grid grid-cols-2 gap-4 text-[11px] border-t pt-4 border-slate-100 text-slate-500 font-mono">
                  <div className="space-y-1">
                    <span>Payment Channel:</span>
                    <p className="font-bold text-slate-800">
                      {selectedReceipt.paymentMethod === 'MPESA' ? 'Lipa Na M-Pesa' : 
                       selectedReceipt.paymentMethod === 'AIRTEL_MONEY' ? 'Airtel Money Express' : 
                       selectedReceipt.paymentMethod === 'BANK_TRANSFER' ? 'Bank Deposit Slip' : selectedReceipt.paymentMethod}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span>Handshake Reference TXID:</span>
                    <p className="font-bold text-slate-800 break-all">{selectedReceipt.transactionId}</p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic text-center pt-3 border-t">This is a system generated official receipt for tuition clearance. Any tampering renders this receipt null and void.</p>
              </div>

              {/* Action Buttons */}
              <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-150">
                <button
                  onClick={() => {
                    const printContents = document.getElementById('printable-receipt')?.innerHTML;
                    const originalContents = document.body.innerHTML;
                    if (printContents) {
                      window.print();
                    }
                  }}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
                <button
                  onClick={() => setIsReceiptOpen(false)}
                  className="bg-slate-900 hover:bg-slate-850 text-white font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
