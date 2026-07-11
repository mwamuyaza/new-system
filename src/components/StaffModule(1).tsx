import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  DollarSign, 
  BookOpen, 
  X, 
  Briefcase, 
  Award, 
  GraduationCap, 
  Calendar, 
  Layers, 
  UserPlus,
  ArrowRight,
  UserCheck,
  Building
} from 'lucide-react';
import axios from 'axios';
import { Staff, Subject } from '../types';

interface StaffModuleProps {
  token: string | null;
  subjects: Subject[];
}

export default function StaffModule({ token, subjects }: StaffModuleProps) {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    staffId: '',
    position: '',
    department: '',
    qualification: '',
    joiningDate: '',
    phone: '',
    address: '',
    basicSalary: 4500,
    allowances: 500,
    deductions: 200
  });

  // Payroll modal state
  const [isPayrollOpen, setIsPayrollOpen] = useState(false);
  const [selectedStaffForPayroll, setSelectedStaffForPayroll] = useState<Staff | null>(null);
  const [payrollForm, setPayrollForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    paymentMethod: 'BANK_TRANSFER' as 'BANK_TRANSFER' | 'CASH' | 'CHEQUE',
    transactionId: ''
  });

  // Allocation modal state
  const [isAllocateOpen, setIsAllocateOpen] = useState(false);
  const [selectedStaffForAllocate, setSelectedStaffForAllocate] = useState<Staff | null>(null);
  const [allocateSubjectId, setAllocateSubjectId] = useState('');
  const [allocateYear, setAllocateYear] = useState('2024');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/staff', { headers });
      setStaffList(res.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to retrieve faculty files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      staffId: `STF${Math.floor(100 + Math.random() * 900)}`,
      position: 'Lecturer',
      department: 'Computer Science',
      qualification: 'PhD in System Architecture',
      joiningDate: new Date().toISOString().split('T')[0],
      phone: '',
      address: '',
      basicSalary: 6000,
      allowances: 1000,
      deductions: 350
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to retire or delete this staff profile?")) return;
    try {
      await axios.delete(`/api/staff/${id}`, { headers });
      setSuccessMsg("Staff member terminated or retired from directory");
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to edit staff status");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (editingId) {
        await axios.put(`/api/staff/${editingId}`, formData, { headers });
        setSuccessMsg("Staff details updated successfully");
      } else {
        await axios.post('/api/staff', formData, { headers });
        setSuccessMsg(`Onboarded new faculty member ${formData.firstName} ${formData.lastName}`);
      }
      setIsFormOpen(false);
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Error compiling faculty file.");
    }
  };

  const handleDisbursePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForPayroll || !selectedStaffForPayroll.salaryStructure) return;

    setErrorMsg('');
    setSuccessMsg('');

    const netAmount = selectedStaffForPayroll.salaryStructure.basicSalary + 
                    selectedStaffForPayroll.salaryStructure.allowances - 
                    selectedStaffForPayroll.salaryStructure.deductions;

    try {
      await axios.post('/api/payments/salary', {
        staffId: selectedStaffForPayroll.id,
        amount: netAmount,
        month: payrollForm.month,
        year: payrollForm.year,
        paymentMethod: payrollForm.paymentMethod,
        transactionId: payrollForm.transactionId
      }, { headers });

      setSuccessMsg(`Salary payment of $${netAmount} processed for ${selectedStaffForPayroll.firstName}`);
      setIsPayrollOpen(false);
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to process payroll ledger.");
    }
  };

  const handleAllocateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffForAllocate || !allocateSubjectId) return;

    setErrorMsg('');
    setSuccessMsg('');

    try {
      await axios.post('/api/staff-subjects', {
        staffId: selectedStaffForAllocate.id,
        subjectId: parseInt(allocateSubjectId, 10),
        academicYear: allocateYear
      }, { headers });

      setSuccessMsg("Subject allocated to lecturer successfully");
      setIsAllocateOpen(false);
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Conflict allocating teaching load.");
    }
  };

  const handleDeallocate = async (allocationId: number) => {
    if (!window.confirm("Remove subject allocation from this lecturer?")) return;
    try {
      await axios.delete(`/api/staff-subjects/${allocationId}`, { headers });
      setSuccessMsg("Lecturer teaching assignment rescinded");
      fetchStaff();
    } catch (err: any) {
      setErrorMsg("Error cutting course link");
    }
  };

  // Filters staff by state
  const filteredStaff = staffList.filter(s => {
    const term = search.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(term) || 
                          s.staffId.toLowerCase().includes(term) || 
                          s.phone.includes(term) || 
                          s.email.toLowerCase().includes(term);

    const matchesDept = deptFilter === '' || s.department === deptFilter;

    return matchesSearch && matchesDept;
  });

  // Extract unique departments for filtering
  const departments = Array.from(new Set(staffList.map(s => s.department)));

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium rounded-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          {errorMsg}
        </div>
      )}

      {/* Control Filter Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search academic faculty by name, department, credentials, or faculty code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-700"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Departments</option>
            {departments.map((d, idx) => (
              <option key={idx} value={d}>{d}</option>
            ))}
          </select>

          <button
            onClick={handleOpenCreate}
            className="bg-sky-50 text-sky-600 border border-sky-200 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-sky-100 cursor-pointer flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard Faculty</span>
          </button>
        </div>
      </div>

      {/* Staff directory with salary breakdowns */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-slate-400 bg-white rounded-2xl border">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>Fetching faculty dossiers...</span>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="col-span-2 p-16 text-center text-slate-400 bg-white rounded-2xl border border-dashed">
            <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <h5 className="font-bold text-slate-700 text-sm">No Faculty Found</h5>
            <p className="text-slate-400 text-xs mt-1">Refine your queries or add new teachers.</p>
          </div>
        ) : (
          filteredStaff.map((st) => {
            const netSalary = st.salaryStructure
              ? st.salaryStructure.basicSalary + st.salaryStructure.allowances - st.salaryStructure.deductions
              : 0;

            return (
              <div key={st.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between gap-5 relative overflow-hidden group hover:border-sky-200 transition-all">
                {/* Upper Details */}
                <div className="flex gap-4 items-start">
                  <img 
                    src={st.profilePic || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150"} 
                    alt="Faculty Avatar" 
                    className="w-12 h-12 rounded-2xl object-cover bg-slate-50 border"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-base">{st.firstName} {st.lastName}</h4>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-200 px-1.5 py-0.5 rounded uppercase">
                        {st.staffId}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-slate-700">{st.position}</span>
                      <span className="text-slate-300">•</span>
                      <span className="flex items-center gap-0.5 text-sky-600 bg-sky-50 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                        <Building className="w-3 h-3" /> {st.department}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Allocated subjects teach list */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> Allocated Subjects
                    </span>
                    <button
                      onClick={() => {
                        setSelectedStaffForAllocate(st);
                        setAllocateSubjectId(subjects[0]?.id?.toString() || '');
                        setIsAllocateOpen(true);
                      }}
                      className="text-[10px] font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      Allocate Module <ArrowRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                  {st.subjectsAllocations && st.subjectsAllocations.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      {st.subjectsAllocations.map((sub, sIdx) => (
                        <div key={sIdx} className="bg-white p-2 border rounded-lg text-xs flex justify-between items-center">
                          <div className="overflow-hidden">
                            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-tight block">{sub.subjectCode}</span>
                            <span className="font-semibold text-slate-700 truncate block">{sub.subjectName}</span>
                          </div>
                          <button
                            onClick={() => handleDeallocate(sub.allocationId)}
                            className="text-slate-300 hover:text-rose-500 p-1 rounded hover:bg-rose-50 cursor-pointer"
                            title="Remove Course Allocation"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic py-1">No courses allocated currently.</p>
                  )}
                </div>

                {/* Salary slip & payment statistics */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Payroll Compensation</span>
                    {st.salaryStructure ? (
                      <span className="text-sm font-mono font-bold text-slate-800">
                        ${netSalary.toLocaleString()}/mo <span className="text-[10px] font-sans font-normal text-slate-400">(Basic: ${st.salaryStructure.basicSalary})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-rose-500 font-bold">Unconfigured Salary</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedStaffForPayroll(st);
                        setPayrollForm({ ...payrollForm, transactionId: `SAL${Date.now().toString().slice(-6)}` });
                        setIsPayrollOpen(true);
                      }}
                      disabled={!st.salaryStructure}
                      className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold font-sans flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Disburse Pay
                    </button>
                    <button
                      onClick={() => handleDelete(st.id)}
                      className="p-1.5 hover:bg-rose-50 border border-slate-200/50 rounded-lg text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                      title="Deactivate staff file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DISBURSE PAYROLL MODAL */}
      {isPayrollOpen && selectedStaffForPayroll && selectedStaffForPayroll.salaryStructure && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full animate-slide-up overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-display font-black text-slate-800 text-sm">Disburse Salary</h3>
                <p className="text-slate-400 text-[10px]">Generate payroll transaction ledger</p>
              </div>
              <button 
                onClick={() => setIsPayrollOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-250 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDisbursePayroll} className="p-5 space-y-4 text-slate-700">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Recipient:</span>
                  <span className="font-bold text-slate-800">{selectedStaffForPayroll.firstName} {selectedStaffForPayroll.lastName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Position:</span>
                  <span className="font-semibold text-slate-600">{selectedStaffForPayroll.position}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t text-sm font-semibold">
                  <span>Net Salary Due:</span>
                  <span className="font-mono text-emerald-600">
                    ${(selectedStaffForPayroll.salaryStructure.basicSalary + 
                       selectedStaffForPayroll.salaryStructure.allowances - 
                       selectedStaffForPayroll.salaryStructure.deductions).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Month (1-12)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    required
                    value={payrollForm.month}
                    onChange={(e) => setPayrollForm({ ...payrollForm, month: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Year</label>
                  <input
                    type="number"
                    required
                    value={payrollForm.year}
                    onChange={(e) => setPayrollForm({ ...payrollForm, year: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Payment Method</label>
                <select
                  value={payrollForm.paymentMethod}
                  onChange={(e) => setPayrollForm({ ...payrollForm, paymentMethod: e.target.value as any })}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-slate-600 bg-white"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (Direct)</option>
                  <option value="CASH">Cash Payment</option>
                  <option value="CHEQUE">Cheque Output</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Reference Transaction code</label>
                <input
                  type="text"
                  required
                  value={payrollForm.transactionId}
                  onChange={(e) => setPayrollForm({ ...payrollForm, transactionId: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs font-mono bg-white"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPayrollOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-lg hover:bg-emerald-600 cursor-pointer"
                >
                  Disburse Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHOOSE SUBJECT ALLOCATION MODAL */}
      {isAllocateOpen && selectedStaffForAllocate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full animate-slide-up overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-display font-bold text-slate-800 text-sm">Allocate Course</h3>
                <p className="text-slate-400 text-[10px]">Assign subjects for this faculty member</p>
              </div>
              <button 
                onClick={() => setIsAllocateOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-250 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAllocateSubject} className="p-5 space-y-4 text-slate-700">
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border text-xs">
                <span className="text-slate-400 font-bold block uppercase text-[9px] font-mono">Lecturer</span>
                <span className="font-bold text-slate-800">{selectedStaffForAllocate.firstName} {selectedStaffForAllocate.lastName}</span>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Select Subject</label>
                <select
                  required
                  value={allocateSubjectId}
                  onChange={(e) => setAllocateSubjectId(e.target.value)}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs text-slate-600 bg-white"
                >
                  <option value="">-- Select Subject Course --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id.toString()}>{sub.subjectName} ({sub.subjectCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Academic Year</label>
                <input
                  type="text"
                  required
                  value={allocateYear}
                  onChange={(e) => setAllocateYear(e.target.value)}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-700"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAllocateOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-600 cursor-pointer"
                >
                  Allocate load
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE OR EDIT STAFF SLIDE-OUT DIALOGUE */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-display font-black text-slate-800 text-lg">
                  Onboard Faculty Profile
                </h3>
                <p className="text-slate-400 text-xs">Create educational credentials & payroll data</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">Username (Login)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. jdoe.staff"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. jdoe@university.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-700 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">Job Position</label>
                  <input
                    type="text"
                    required
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">Academic Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs text-slate-600 bg-white"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Humanities">Humanities</option>
                    <option value="Business Administration">Business Administration</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">Qualifications</label>
                  <input
                    type="text"
                    required
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">Joining Date</label>
                  <input
                    type="date"
                    required
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">Faculty ID Code</label>
                  <input
                    type="text"
                    required
                    value={formData.staffId}
                    onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs font-mono bg-white text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1">Residence Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-xs bg-white text-slate-700"
                ></textarea>
              </div>

              {/* Payroll initial settings */}
              {!editingId && (
                <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block">Initial Compensation Configuration</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">Basic Salary ($)</label>
                      <input
                        type="number"
                        required
                        value={formData.basicSalary}
                        onChange={(e) => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) })}
                        className="w-full bg-white border rounded-lg px-2 py-1.5 text-xs text-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">Allowances ($)</label>
                      <input
                        type="number"
                        value={formData.allowances}
                        onChange={(e) => setFormData({ ...formData, allowances: parseFloat(e.target.value) })}
                        className="w-full bg-white border rounded-lg px-2 py-1.5 text-xs text-slate-700 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-500 font-medium mb-1">Deductions ($)</label>
                      <input
                        type="number"
                        value={formData.deductions}
                        onChange={(e) => setFormData({ ...formData, deductions: parseFloat(e.target.value) })}
                        className="w-full bg-white border rounded-lg px-2 py-1.5 text-xs text-slate-700 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 text-white text-xs font-semibold rounded-xl hover:bg-sky-600 cursor-pointer shadow-lg shadow-sky-500/10"
                >
                  Onboard Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
