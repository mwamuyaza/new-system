import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  Check, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Clock, 
  FileCheck, 
  CheckCircle, 
  GraduationCap
} from 'lucide-react';
import axios from 'axios';
import { Grade, Subject, Student, Class } from '../types';

interface GradesModuleProps {
  token: string | null;
  role: 'ADMIN' | 'STAFF' | 'STUDENT';
  studentId?: number; // active student id if role == STUDENT
  subjects: Subject[];
  classes: Class[];
}

export default function GradesModule({ token, role, studentId, subjects, classes }: GradesModuleProps) {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Staff entry controls
  const [activeSubjectId, setActiveSubjectId] = useState('');
  const [activeExamType, setActiveExamType] = useState<'MID_TERM' | 'FINAL_TERM' | 'QUIZ' | 'ASSIGNMENT'>('MID_TERM');
  const [marksState, setMarksState] = useState<{ [studentId: number]: { marks: string, total: string } }>({});

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (role === 'STUDENT') {
        // Fetch only active student grades
        const res = await axios.get('/api/grades', { headers });
        setGrades(res.data);
      } else {
        // Admin or Staff
        const [gRes, sRes] = await axios.all([
          axios.get('/api/grades', { headers }),
          axios.get('/api/students', { headers })
        ]);
        setGrades(gRes.data);
        setStudents(sRes.data);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to synchronize academic results.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [role]);

  // Derive letter grade from marks
  const calculateLetter = (obtained: number, total: number) => {
    const pct = (obtained / total) * 100;
    if (pct >= 95) return 'A+';
    if (pct >= 90) return 'A';
    if (pct >= 85) return 'B+';
    if (pct >= 80) return 'B';
    if (pct >= 70) return 'C';
    if (pct >= 60) return 'D';
    return 'F';
  };

  const handleMarksChange = (stdId: number, field: 'marks' | 'total', val: string) => {
    setMarksState(prev => ({
      ...prev,
      [stdId]: {
        ...prev[stdId],
        [field]: val
      }
    }));
  };

  const handlePostGrade = async (stdId: number) => {
    const state = marksState[stdId];
    if (!state || !state.marks) {
      alert("Please enter a valid marks score first");
      return;
    }

    const marks获得的 = parseFloat(state.marks);
    const marks总分 = parseFloat(state.total || '100');

    if (isNaN(marks获得的) || marks获得的 > marks总分) {
      alert("Marks obtained must be a numeric score below or equal to total marks");
      return;
    }

    const calculatedGrade = calculateLetter(marks获得的, marks总分);

    try {
      await axios.post('/api/grades', {
        studentId: stdId,
        subjectId: parseInt(activeSubjectId, 10),
        marksObtained: marks获得的,
        totalMarks: marks总分,
        grade: calculatedGrade,
        examType: activeExamType,
        academicYear: '2024'
      }, { headers });

      setSuccessMsg(`Marks updated for Student ID #${stdId}`);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchData();
    } catch (err: any) {
      setErrorMsg("Failed to submit student grade level");
    }
  };

  // Find students in class belonging to activeSubjectId
  const getSubjectCandidates = () => {
    if (!activeSubjectId) return [];
    const chosenSub = subjects.find(s => s.id === parseInt(activeSubjectId, 10));
    if (!chosenSub || !chosenSub.classId) return [];

    return students.filter(s => s.classesDetails?.some(c => c.id === chosenSub.classId));
  };

  const candidates = getSubjectCandidates();

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-700">
      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-800 text-sm font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium rounded-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          {errorMsg}
        </div>
      )}

      {/* Role specific layouts */}
      {role === 'STUDENT' ? (
        <div className="space-y-8">
          {/* Transcript card Header */}
          <div className="bg-linear-to-r from-teal-900 to-sky-950 p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div className="space-y-2 z-10">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-sky-400">Academic Scorecard</span>
              <h2 className="text-3xl font-display font-medium tracking-tight">Your Academic Results</h2>
              <p className="text-slate-300 max-w-lg text-xs leading-relaxed">
                Review your active course markings, semester grades, and examination distributions compiled by the university registrar.
              </p>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80 text-center z-10">
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase">Average GPA Score</div>
              <div className="text-3xl font-mono font-extrabold text-sky-400 mt-1">
                {grades.length > 0 
                  ? (grades.reduce((sum, g) => sum + (g.marksObtained / g.totalMarks) * 4.0, 0) / grades.length).toFixed(2) 
                  : 'N/A'}
              </div>
            </div>
            <div className="absolute right-[-100px] top-[-50px] w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
          </div>

          {/* Transcript results cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loading ? (
              <p className="text-slate-400 text-center py-12 col-span-2">Unlocking credit archives...</p>
            ) : grades.length === 0 ? (
              <div className="col-span-2 p-12 border border-dashed rounded-2xl text-slate-400 text-center">
                <Award className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-655 font-bold text-sm">No exam grades uploaded yet.</p>
                <p className="text-xs mt-1">Examinations scores are published here post grading terms.</p>
              </div>
            ) : (
              grades.map((g) => (
                <div key={g.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center relative overflow-hidden">
                  <div className="space-y-3">
                    <div>
                      <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-500 border px-1.5 py-0.5 rounded uppercase font-semibold">
                        {g.subjectDetails?.subjectCode}
                      </span>
                      <h4 className="font-bold text-slate-800 text-sm mt-1">{g.subjectDetails?.subjectName}</h4>
                      <p className="text-xs text-slate-400 tracking-wider">Credits: {g.subjectDetails?.credits} Units • Exam Term: <span className="font-semibold text-slate-600">{g.examType}</span></p>
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      Marks Obtained: <span className="font-bold text-slate-800">{g.marksObtained}</span> / {g.totalMarks} ({Math.round((g.marksObtained / g.totalMarks) * 100)}%)
                    </div>
                  </div>
                  
                  {/* Big Grade Emblem */}
                  <div className="w-16 h-16 rounded-2xl bg-sky-50 flex flex-col items-center justify-center border border-sky-100">
                    <span className="text-2xl font-mono font-black text-sky-600 leading-none">{g.grade}</span>
                    <span className="text-[9px] font-bold font-mono uppercase text-sky-400 mt-1">Grade</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* ADMIN AND STAFF INTERFACES: Search & update grade points sheet */
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
            <div>
              <h4 className="font-display font-bold text-slate-800 text-md">Faculty grading records</h4>
              <p className="text-slate-400 text-xs">Filter subjects to post mid-terms/final grades directly to student transcript portfolios.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">1. Choose Subject</label>
                <select
                  value={activeSubjectId}
                  onChange={(e) => {
                    setActiveSubjectId(e.target.value);
                    setMarksState({});
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 bg-white"
                >
                  <option value="">-- Choose Course --</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.id.toString()}>{sub.subjectCode} - {sub.subjectName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-400 font-bold mb-1.5">2. Exam Category</label>
                <select
                  value={activeExamType}
                  onChange={(e) => setActiveExamType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-600 bg-white"
                >
                  <option value="MID_TERM">Mid Term Exam</option>
                  <option value="FINAL_TERM">Final Term Exam</option>
                  <option value="QUIZ">Quiz Test</option>
                  <option value="ASSIGNMENT">Subject Assignment</option>
                </select>
              </div>
            </div>
          </div>

          {activeSubjectId ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h5 className="font-bold text-slate-800 text-sm">Pupils Roster matching Cohort</h5>
                <p className="text-xs text-slate-400">Type in numerical marks obtained and submit grade cards</p>
              </div>
              
              {candidates.length === 0 ? (
                <p className="text-slate-400 text-xs p-8 italic text-center">No students registered in the cohort assigned to this course.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                        <th className="py-4 px-6">Student Account</th>
                        <th className="py-4 px-6">Student ID</th>
                        <th className="py-4 px-6">Current Marks Grade (Exam Session)</th>
                        <th className="py-4 px-6 text-right">Commit Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {candidates.map((cand) => {
                        // Check if grade already exists for this candidate
                        const exGrade = grades.find(g => 
                          g.studentId === cand.id && 
                          g.subjectId === parseInt(activeSubjectId, 10) && 
                          g.examType === activeExamType
                        );

                        return (
                          <tr key={cand.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6">
                              <div>
                                <h5 className="font-bold text-slate-800 text-sm">{cand.firstName} {cand.lastName}</h5>
                                <span className="text-slate-430 text-[10px] font-mono">{cand.email}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 border text-slate-600 rounded">{cand.studentId}</span>
                            </td>
                            <td className="py-4 px-6">
                              {exGrade ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-slate-500 font-semibold">Marks: {exGrade.marksObtained} / {exGrade.totalMarks}</span>
                                  <span className="text-xs font-mono font-black text-sky-600 bg-sky-50 px-2 rounded-full border border-sky-100">
                                    Grade: {exGrade.grade}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    placeholder="Marks obtained"
                                    value={marksState[cand.id]?.marks || ''}
                                    onChange={(e) => handleMarksChange(cand.id, 'marks', e.target.value)}
                                    className="bg-slate-50 border rounded-lg px-2.5 py-1 text-xs w-32 bg-white"
                                  />
                                  <span className="text-slate-400">/</span>
                                  <input
                                    type="number"
                                    placeholder="100"
                                    value={marksState[cand.id]?.total || '100'}
                                    onChange={(e) => handleMarksChange(cand.id, 'total', e.target.value)}
                                    className="bg-slate-50 border rounded-lg px-2.5 py-1 text-xs w-20 bg-white"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6 text-right">
                              <button
                                onClick={() => handlePostGrade(cand.id)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold leading-none cursor-pointer ${
                                  exGrade 
                                    ? 'bg-slate-100 text-slate-400 hover:bg-slate-200 font-sans' 
                                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10'
                                }`}
                              >
                                {exGrade ? "Overwrite Grade" : "Submit Grade"}
                              </button>
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
            <p className="text-slate-400 text-xs italic py-6 text-center bg-white border rounded-2xl">Please select a syllabus course to view eligible pupils rosters.</p>
          )}
        </div>
      )}
    </div>
  );
}
