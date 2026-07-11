import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  GraduationCap, 
  Briefcase, 
  Mail, 
  Phone, 
  Calendar, 
  Search, 
  UserCheck, 
  UserX,
  AlertCircle
} from 'lucide-react';
import { Student, Staff } from '../types';

interface AdmissionsModuleProps {
  token: string | null;
}

export default function AdmissionsModule({ token }: AdmissionsModuleProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'students' | 'staff'>('students');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchPendingAdmissions();
  }, []);

  const fetchPendingAdmissions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admissions/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch pending applications');
      const data = await res.json();
      setStudents(data.students || []);
      setStaff(data.staff || []);
    } catch (err: any) {
      showStatus('error', err.message || 'Error pulling admission queues');
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  const handleStudentAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      const url = `/api/students/${id}/${action}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${action} student`);
      }
      showStatus('success', `Student admission application was successfully ${action}d.`);
      fetchPendingAdmissions();
    } catch (err: any) {
      showStatus('error', err.message || 'Action failed');
    }
  };

  const handleStaffAction = async (id: number, action: 'approve' | 'reject') => {
    try {
      const url = `/api/staff/${id}/${action}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${action} faculty member`);
      }
      showStatus('success', `Faculty onboarding application was successfully ${action}d.`);
      fetchPendingAdmissions();
    } catch (err: any) {
      showStatus('error', err.message || 'Action failed');
    }
  };

  const filteredStudents = students.filter(s => 
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.studentId && s.studentId.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredStaff = staff.filter(t => 
    `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    (t.staffId && t.staffId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 id="admissions_title" className="text-2xl font-bold tracking-tight text-slate-900">Admissions & Onboarding Desk</h1>
          <p className="text-slate-500 text-xs mt-1">Review, approve, or reject pending applicant profiles for students and newly self-onboarded staff/lecturers.</p>
        </div>
        
        {/* TAB CONTROLS */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50 self-start">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'students' 
                ? 'bg-white text-slate-800 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-blue-600" />
            Students Queue ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'staff' 
                ? 'bg-white text-slate-800 shadow-xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4 text-teal-600" />
            Faculty Queue ({staff.length})
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 animate-fade-in ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200/60 text-emerald-800' 
            : 'bg-rose-50 border-rose-200/60 text-rose-800'
        }`}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-medium">{statusMessage.text}</span>
        </div>
      )}

      {/* SEARCH AND QUICK STATS ROW */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab === 'students' ? 'student applicants' : 'faculty applicants'}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-2xs placeholder:text-slate-400"
          />
        </div>
        <div className="text-[11px] text-slate-400 italic">
          Showing {activeTab === 'students' ? filteredStudents.length : filteredStaff.length} pending profiles
        </div>
      </div>

      {/* MAIN QUEUE LIST */}
      {loading ? (
        <div className="text-center py-16 bg-white border border-slate-200/60 rounded-3xl space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-500 font-medium">Analyzing admissions registry queue...</p>
        </div>
      ) : activeTab === 'students' ? (
        filteredStudents.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200/50 rounded-3xl space-y-3">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">No Pending Student Admissions</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">All registered students have been successfully evaluated. Active directories can be explored in the Students tab.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStudents.map((s) => (
              <div key={s.id} id={`pending_student_${s.id}`} className="bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200 rounded-3xl p-5 hover:shadow-md relative overflow-hidden flex flex-col justify-between">
                {/* Banner Status */}
                <div className="absolute top-0 right-0 left-0 h-1 bg-blue-500"></div>

                <div className="space-y-4">
                  {/* Avatar and Main Info */}
                  <div className="flex items-start gap-3.5">
                    <img 
                      src={s.profilePic || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`} 
                      alt="Student applicant" 
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 flex-shrink-0 border border-slate-200/80"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-slate-800 leading-snug">{s.firstName} {s.lastName}</h3>
                      <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded border inline-block">
                        {s.studentId || 'ID PENDING'}
                      </div>
                    </div>
                  </div>

                  {/* Demographic & Registration details */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-y border-slate-100 py-3.5 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{s.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{s.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Applied on: {s.enrollmentDate}</span>
                    </div>
                  </div>

                  {/* DOUBLE APPROVAL STEPS STATUSES */}
                  <div className="bg-slate-50/70 py-2.5 px-3.5 rounded-xl border border-slate-200/30 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-500">Approvals Status:</span>
                    <div className="flex gap-2">
                      <span className={`px-2 py-0.5 rounded-lg border font-bold ${
                        s.adminApproved ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-slate-100 text-slate-400 border-slate-200/30'
                      }`}>
                        Admin: {s.adminApproved ? 'Approved' : 'Pending'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg border font-bold ${
                        s.lecturerApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200/30'
                      }`}>
                        Faculty: {s.lecturerApproved ? 'Approved' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* DECISION SYSTEM BUTTONS */}
                <div className="flex gap-2.5 mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleStudentAction(s.id, 'reject')}
                    className="flex-1 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-100 hover:border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleStudentAction(s.id, 'approve')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer text-white shadow-xs hover:shadow-md ${
                      s.adminApproved
                        ? 'bg-slate-300 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-750'
                    }`}
                    disabled={!!s.adminApproved}
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    {s.adminApproved ? 'Admin Approved' : 'Admit / Approve'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        filteredStaff.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200/50 rounded-3xl space-y-3">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Briefcase className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">No Pending Faculty Approvals</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">There are no pending lecturer profiles awaiting onboarding. Recheck again or invite them to register via the signup system.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStaff.map((t) => (
              <div key={t.id} id={`pending_faculty_${t.id}`} className="bg-white border border-slate-200 hover:border-slate-300 transition-all duration-200 rounded-3xl p-5 hover:shadow-md relative overflow-hidden flex flex-col justify-between">
                {/* Banner Status */}
                <div className="absolute top-0 right-0 left-0 h-1 bg-teal-500"></div>

                <div className="space-y-4">
                  {/* Avatar and Main Info */}
                  <div className="flex items-start gap-3.5">
                    <img 
                      src={t.profilePic || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150`} 
                      alt="Faculty applicant" 
                      className="w-12 h-12 rounded-xl object-cover bg-slate-100 flex-shrink-0 border border-slate-200/80"
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1">
                      <h3 className="font-bold text-sm text-slate-800 leading-snug">{t.firstName} {t.lastName}</h3>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 font-bold bg-slate-50 px-1.5 py-0.5 rounded border">
                          {t.staffId || 'ID PENDING'}
                        </span>
                        <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100">
                          {t.position}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Qualification and department details */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs border-y border-slate-100 py-3.5 text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{t.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t.phone || 'No phone'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Department:</span> {t.department}
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Credential:</span> {t.qualification}
                    </div>
                  </div>
                </div>

                {/* DECISION SYSTEM BUTTONS */}
                <div className="flex gap-2.5 mt-5 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleStaffAction(t.id, 'reject')}
                    className="flex-1 py-2 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-100 hover:border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                    Reject/Deny
                  </button>
                  <button
                    onClick={() => handleStaffAction(t.id, 'approve')}
                    className="flex-1 py-2 bg-teal-600 hover:bg-teal-750 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    Approve Faculty
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
