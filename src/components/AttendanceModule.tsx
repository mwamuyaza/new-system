import React, { useState, useEffect } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Calendar, 
  BookOpen, 
  Users, 
  CheckCircle 
} from 'lucide-react';
import axios from 'axios';
import { Subject, Student } from '../types';

interface AttendanceModuleProps {
  token: string | null;
  subjects: Subject[];
}

export default function AttendanceModule({ token, subjects }: AttendanceModuleProps) {
  const [candidates, setCandidates] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: number]: 'PRESENT' | 'ABSENT' | 'LATE' }>({});
  const [activeSubjectId, setActiveSubjectId] = useState('');
  const [activeDate, setActiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const headers = { Authorization: `Bearer ${token}` };

  const loadCandidatesAndRecords = async () => {
    if (!activeSubjectId) return;
    setLoading(true);
    try {
      const chosenSub = subjects.find(s => s.id === parseInt(activeSubjectId, 10));
      if (chosenSub && chosenSub.classId) {
        // Find students in class
        const sRes = await axios.get('/api/students', { headers });
        const enrolled = sRes.data.filter((s: Student) => s.classesDetails?.some(c => c.id === chosenSub.classId));
        setCandidates(enrolled);

        // Fetch existing attendance records matching date and subject
        const aRes = await axios.get(`/api/attendance?subjectId=${activeSubjectId}&date=${activeDate}`, { headers });
        const matchedMap: any = {};
        aRes.data.forEach((rec: any) => {
          matchedMap[rec.studentId] = rec.status;
        });
        setAttendanceRecords(matchedMap);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidatesAndRecords();
  }, [activeSubjectId, activeDate]);

  const handleMarkStatus = async (studentId: number, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    try {
      await axios.post('/api/attendance', {
        studentId,
        subjectId: parseInt(activeSubjectId, 10),
        date: activeDate,
        status
      }, { headers });

      setAttendanceRecords(prev => ({
        ...prev,
        [studentId]: status
      }));

      setSuccessMsg("Attendance recorded successfully");
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-705">
      {/* Success banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-sm font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          {successMsg}
        </div>
      )}

      {/* Form header choices */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
        <div>
          <h4 className="font-display font-bold text-slate-800 text-md">Mark Daily Registers</h4>
          <p className="text-slate-400 text-xs">Verify students presence matching assigned academic calendars.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Select Course Subject</label>
            <select
              value={activeSubjectId}
              onChange={(e) => {
                setActiveSubjectId(e.target.value);
                setCandidates([]);
                setAttendanceRecords({});
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-655 bg-white"
            >
              <option value="">-- Choose Subject Module --</option>
              {subjects.map(sub => (
                <option key={sub.id} value={sub.id.toString()}>{sub.subjectCode} - {sub.subjectName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">Register Date</label>
            <input
              type="date"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs bg-white text-slate-705"
            />
          </div>
        </div>
      </div>

      {/* Roster table */}
      {activeSubjectId ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div>
              <h5 className="font-bold text-slate-800 text-sm">Classroom Registry Roll</h5>
              <p className="text-xs text-slate-400">Mark PRESENT, ABSENT or LATE for selected date</p>
            </div>
            <div className="text-xs bg-slate-200/50 text-slate-600 px-2.5 py-1 rounded font-mono font-bold flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {activeDate}
            </div>
          </div>

          {loading ? (
            <p className="p-12 text-center text-slate-400 text-xs font-semibold">Tuning register records...</p>
          ) : candidates.length === 0 ? (
            <p className="p-12 text-center text-slate-400 italic text-xs">No registered student cohort linked to this course.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 font-mono text-[9px] text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Student ID</th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6 text-center">Mark Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {candidates.map((cand) => {
                    const status = attendanceRecords[cand.id];
                    return (
                      <tr key={cand.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 border text-slate-600 rounded">{cand.studentId}</span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-800">
                          {cand.firstName} {cand.lastName}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleMarkStatus(cand.id, 'PRESENT')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                status === 'PRESENT' 
                                  ? 'bg-emerald-550 border border-emerald-555 text-white shadow-md shadow-emerald-500/10' 
                                  : 'bg-slate-50 border text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" /> Present
                            </button>

                            <button
                              onClick={() => handleMarkStatus(cand.id, 'ABSENT')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                status === 'ABSENT' 
                                  ? 'bg-rose-500 border border-rose-550 text-white shadow-md shadow-rose-500/10' 
                                  : 'bg-slate-50 border text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" /> Absent
                            </button>

                            <button
                              onClick={() => handleMarkStatus(cand.id, 'LATE')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                status === 'LATE' 
                                  ? 'bg-amber-450 border border-amber-500 text-white shadow-md shadow-amber-500/10' 
                                  : 'bg-slate-50 border text-slate-500 hover:bg-slate-100'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" /> Late
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p className="text-slate-400 text-xs italic py-6 text-center bg-white border rounded-2xl">Please select an allotted subject course to lock on eligibility registers.</p>
      )}
    </div>
  );
}
