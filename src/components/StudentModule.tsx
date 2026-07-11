import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  CreditCard, 
  Eye, 
  ChevronRight, 
  UserPlus, 
  Calendar,
  X,
  Smartphone,
  MapPin,
  Mail,
  MoreVertical,
  Check,
  UserCheck
} from 'lucide-react';
import axios from 'axios';
import { Student, Class } from '../types';

interface StudentModuleProps {
  token: string | null;
  classes: Class[];
  onSelectStudentFees: (studentId: number) => void;
  user?: any;
}

export default function StudentModule({ token, classes, onSelectStudentFees, user }: StudentModuleProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
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
    studentId: '',
    dateOfBirth: '',
    gender: 'MALE' as 'MALE' | 'FEMALE' | 'OTHER',
    phone: '',
    address: '',
    classId: ''
  });

  // Enrollment State
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedStudentForEnroll, setSelectedStudentForEnroll] = useState<Student | null>(null);
  const [targetClassId, setTargetClassId] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/students', { headers });
      setStudents(res.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to retrieve directory indices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      studentId: `STU${Math.floor(100 + Math.random() * 900)}`,
      dateOfBirth: '2004-01-01',
      gender: 'MALE',
      phone: '',
      address: '',
      classId: classes[0]?.id?.toString() || ''
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingId(s.id);
    setFormData({
      username: s.studentId.toLowerCase(), // derived logic
      email: s.email,
      firstName: s.firstName,
      lastName: s.lastName,
      studentId: s.studentId,
      dateOfBirth: s.dateOfBirth?.split('T')[0] || '',
      gender: s.gender,
      phone: s.phone,
      address: s.address,
      classId: '' // disabled on editing
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to suspend or delete this student file?")) return;
    try {
      await axios.delete(`/api/students/${id}`, { headers });
      setSuccessMsg("Student profile suspended or archived");
      fetchStudents();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to remove state");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (editingId) {
        // Edit student
        const { firstName, lastName, phone, address, gender, dateOfBirth, email } = formData;
        await axios.put(`/api/students/${editingId}`, {
          firstName, lastName, phone, address, gender, dateOfBirth, email
        }, { headers });
        setSuccessMsg("Student profile updated successfully");
      } else {
        // Create student
        await axios.post('/api/students', {
          ...formData,
          classId: formData.classId ? parseInt(formData.classId, 10) : undefined
        }, { headers });
        setSuccessMsg(`Created new student profile for ${formData.firstName} ${formData.lastName}`);
      }
      setIsFormOpen(false);
      fetchStudents();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to commit record.");
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForEnroll || !targetClassId) return;

    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.post('/api/enrollment', {
        studentId: selectedStudentForEnroll.id,
        classId: parseInt(targetClassId, 10)
      }, { headers });
      setSuccessMsg(`Successfully enrolled ${selectedStudentForEnroll.firstName} in class`);
      setIsEnrollModalOpen(false);
      fetchStudents();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Error registering student in course module.");
    }
  };

  const handleApproveStudent = async (studentId: number) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.put(`/api/students/${studentId}/approve`, {}, { headers });
      setSuccessMsg("Successfully approved and admitted student's enrollment registration into academic courses!");
      fetchStudents();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Error approving student record.");
    }
  };

  // Filter students based on state controls
  const filteredStudents = students.filter(s => {
    const term = search.toLowerCase();
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(term) || 
                          s.studentId.toLowerCase().includes(term) || 
                          s.phone.includes(term) || 
                          s.email.toLowerCase().includes(term);

    const matchesStatus = statusFilter === '' || s.status === statusFilter;
    const matchesGender = genderFilter === '' || s.gender === genderFilter;
    const matchesClass = classFilter === '' || s.classesDetails?.some(c => c.id.toString() === classFilter);

    return matchesSearch && matchesStatus && matchesGender && matchesClass;
  });

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

      {/* Control Filters Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student directories by name, ID, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all text-slate-700"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_APPROVAL">Pending Admission</option>
            <option value="GRADUATED">Graduated</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>

          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          >
            <option value="">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id.toString()}>{c.className} ({c.section})</option>
            ))}
          </select>

          <button
            onClick={handleOpenCreate}
            className="bg-sky-500 text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-sky-600 cursor-pointer shadow-lg shadow-sky-500/10 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Admit Student</span>
          </button>
        </div>
      </div>

      {/* Directory Table Layout */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <span>Fetching active rosters...</span>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 border border-dashed m-6 rounded-2xl">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h5 className="font-bold text-slate-700 text-sm">No Student Records Found</h5>
            <p className="text-slate-400 text-xs mt-1">Refine your search qualifiers or add an enrollment file.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-6">Ident Name</th>
                  <th className="py-4 px-6">Unique ID</th>
                  <th className="py-4 px-6">Date of Birth</th>
                  <th className="py-4 px-6">Current Cohorts</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-755 text-xs">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-all duration-150">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <img 
                          src={s.profilePic || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"} 
                          alt="Student Avatar" 
                          className="w-10 h-10 rounded-full object-cover border border-slate-200/50 bg-slate-100"
                        />
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{s.firstName} {s.lastName}</h4>
                          <span className="text-slate-400 text-[10px] flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {s.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-600 block w-max border border-slate-200/20">
                        {s.studentId}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {s.dateOfBirth ? s.dateOfBirth.split('T')[0] : 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700">
                      {s.classesDetails && s.classesDetails.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {s.classesDetails.map((c) => (
                            <span key={c.id} className="inline-block px-2 py-0.5 bg-sky-50 text-[10px] text-sky-700 font-semibold rounded-md border border-sky-100/40">
                              {c.className} ({c.section})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Not Enrolled</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1.5 font-sans">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-center border ${
                          s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-750 border-emerald-200/40' :
                          s.status === 'PENDING_APPROVAL' ? 'bg-amber-50 text-amber-750 border border-amber-200/40 animate-pulse' :
                          s.status === 'SUSPENDED' ? 'bg-rose-50 text-rose-700 border border-rose-200/40' :
                          s.status === 'GRADUATED' ? 'bg-blue-50 text-blue-700 border border-blue-200/40' :
                          'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {s.status === 'PENDING_APPROVAL' ? 'PENDING APPROVAL' : s.status}
                        </span>

                        {s.status === 'PENDING_APPROVAL' && (
                          <div className="flex gap-1.5 justify-center">
                            <span className={`text-[8.5px] px-1 py-0.5 rounded border font-semibold ${
                              s.adminApproved ? 'bg-sky-50 text-sky-700 border-sky-200/60' : 'bg-slate-100 text-slate-400 border-slate-200/50'
                            }`} title="Admissions/Admin Approval">
                              Admin: {s.adminApproved ? 'Approved' : 'Pending'}
                            </span>
                            <span className={`text-[8.5px] px-1 py-0.5 rounded border font-semibold ${
                              s.lecturerApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-100 text-slate-400 border-slate-200/50'
                            }`} title="Faculty/Lecturer Approval">
                              Lecturer: {s.lecturerApproved ? 'Approved' : 'Pending'}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        {s.status === 'PENDING_APPROVAL' && (
                          <>
                            {/* Admissions/Admin Approval Button */}
                            {user?.role === 'ADMIN' && !s.adminApproved && (
                              <button
                                onClick={() => handleApproveStudent(s.id)}
                                title="Admit & Approve (Admin)"
                                className="p-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200/50 rounded-lg text-blue-600 hover:text-blue-750 transition-all font-bold flex items-center justify-center cursor-pointer scale-105"
                              >
                                <Check className="w-4.5 h-4.5 text-blue-650 stroke-[3]" />
                                <span className="text-[10px] px-1 text-blue-700 font-sans">ADMIT/APPROVE</span>
                              </button>
                            )}

                            {/* Lecturer Approval Button */}
                            {user?.role === 'STAFF' && !s.lecturerApproved && (
                              <button
                                onClick={() => handleApproveStudent(s.id)}
                                title="Approve Applicant (Lecturer)"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/50 rounded-lg text-emerald-600 hover:text-emerald-750 transition-all font-bold flex items-center justify-center cursor-pointer scale-105"
                              >
                                <Check className="w-4.5 h-4.5 text-emerald-650 stroke-[3]" />
                                <span className="text-[10px] px-1 text-emerald-750 font-sans">LECTURER APPROVE</span>
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => {
                            setSelectedStudentForEnroll(s);
                            setTargetClassId(classes[0]?.id?.toString() || '');
                            setIsEnrollModalOpen(true);
                          }}
                          title="Enroll student in Class"
                          className="p-1.5 hover:bg-sky-50 rounded-lg text-sky-600 hover:text-sky-700 transition-colors cursor-pointer"
                        >
                          <UserCheck className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => onSelectStudentFees(s.id)}
                          title="View Ledger & Bill Fees"
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                        >
                          <CreditCard className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          title="Modify Student Card"
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4.5 h-4.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          title="Suspend/Archive file"
                          className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE OR EDIT STUDENT SLIDE-OUT DIALOGUE */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full max-h-[90vh] overflow-y-auto overflow-hidden animate-slide-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-display font-black text-slate-800 text-lg">
                  {editingId ? "Update Student Attributes" : "Register Student File"}
                </h3>
                <p className="text-slate-400 text-xs">Complete admissions parameters</p>
              </div>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-200/50 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>

              {!editingId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Username (Login)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. jsmith.tuition"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. jsmith@email.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                    />
                  </div>
                </div>
              )}

              {editingId && (
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 bg-white text-slate-600"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Student ID (Code)</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingId}
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 disabled:opacity-60 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5 font-sans">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5 text-slate-400">Postal Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                ></textarea>
              </div>

              {!editingId && classes.length > 0 && (
                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Initial Class Selection</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 bg-white text-slate-600"
                  >
                    <option value="">-- No Class assignment --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id.toString()}>{c.className} - {c.section} ({c.academicYear})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl hover:bg-slate-200/80 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 text-white text-xs font-semibold rounded-xl hover:bg-sky-600 cursor-pointer shadow-lg shadow-sky-500/10"
                >
                  {editingId ? "Save Changes" : "Confirm Student Creation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ENROLLMENT MODAL */}
      {isEnrollModalOpen && selectedStudentForEnroll && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full animate-slide-up overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-display font-bold text-slate-800 text-sm">Enroll Student</h3>
                <p className="text-slate-400 text-[10px]">Add student to an active course cohort</p>
              </div>
              <button 
                onClick={() => setIsEnrollModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-150 flex items-center justify-center text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEnrollSubmit} className="p-5 space-y-4 text-slate-700">
              <div className="space-y-1 bg-slate-50 p-3.5 rounded-xl border">
                <div className="text-[10px] font-mono text-slate-400 font-bold uppercase">Enroller</div>
                <div className="text-xs font-semibold text-slate-800">{selectedStudentForEnroll.firstName} {selectedStudentForEnroll.lastName} ({selectedStudentForEnroll.studentId})</div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Select Target Class Cohort</label>
                <select
                  required
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 bg-white text-slate-600"
                >
                  <option value="">-- Choose Class --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.className} - {c.section} ({c.academicYear})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="px-3.5 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-xl hover:bg-slate-200/80 cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4.5 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-xl hover:bg-sky-600 cursor-pointer"
                >
                  Enroll Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
