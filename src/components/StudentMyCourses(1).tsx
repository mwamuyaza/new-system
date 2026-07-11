import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle, 
  ShieldAlert, 
  BadgeCheck, 
  FileText, 
  Download, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  Timer,
  AlertTriangle,
  UploadCloud,
  CheckCircle2
} from 'lucide-react';
import axios from 'axios';
import { Subject, ClassroomAssignment } from '../types';

interface StudentMyCoursesProps {
  token: string | null;
}

export default function StudentMyCourses({ token }: StudentMyCoursesProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [schedules, setSchedules] = useState<ClassroomAssignment[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active sub-tab state ('overview' | 'notes' | 'assessments')
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'notes' | 'assessments'>('overview');

  // Interactive Test State
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizTimeLeft, setQuizTimeLeft] = useState<number>(0);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Assignment Delivery State
  const [activeAssignment, setActiveAssignment] = useState<any | null>(null);
  const [assignmentText, setAssignmentText] = useState('');
  const [submittingAssignment, setSubmittingAssignment] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [subRes, schedRes, attRes, notesRes, assessmentsRes] = await axios.all([
        axios.get('/api/student/my-subjects', { headers }),
        axios.get('/api/student/my-schedules', { headers }),
        axios.get('/api/student/my-attendance', { headers }),
        axios.get('/api/student/notes', { headers }),
        axios.get('/api/student/assessments', { headers })
      ]);
      setSubjects(Array.isArray(subRes.data) ? subRes.data : []);
      setSchedules(Array.isArray(schedRes.data) ? schedRes.data : []);
      setAttendance(Array.isArray(attRes.data) ? attRes.data : []);
      setNotes(Array.isArray(notesRes.data) ? notesRes.data : []);
      setAssessments(Array.isArray(assessmentsRes.data) ? assessmentsRes.data : []);
    } catch (e) {
      console.error("Failed to render student customized dashboards", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  // Quiz Timer Engine
  useEffect(() => {
    if (!activeQuiz) return;
    if (quizTimeLeft <= 0) {
      // Auto-submit
      handleAutoSubmitQuiz();
      return;
    }

    const interval = setInterval(() => {
      setQuizTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQuiz, quizTimeLeft]);

  const handleStartQuiz = (q: any) => {
    setActiveQuiz(q);
    setSelectedAnswers(new Array(q.questions?.length || 0).fill(-1));
    // Set time in seconds
    const minutes = q.durationMinutes || 10; // Fallback to 10 if not defined
    setQuizTimeLeft(minutes * 60);
  };

  const handleSelectAnswer = (qIndex: number, aIndex: number) => {
    const updated = [...selectedAnswers];
    updated[qIndex] = aIndex;
    setSelectedAnswers(updated);
  };

  const decodeTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAutoSubmitQuiz = async () => {
    if (submittingQuiz) return;
    setSubmittingQuiz(true);
    try {
      // Replace fallback answers with 0 for unselected
      const processed = selectedAnswers.map(ans => ans === -1 ? 0 : ans);
      await axios.post('/api/student/submit-assessment', {
        assessmentId: activeQuiz.id,
        submittedAnswers: processed,
        submittedText: 'Automatic submit due to quiz timer expiry'
      }, { headers });
      
      setActiveQuiz(null);
      await fetchAllData();
      alert("Acknowledge: The quiz timer expired and your answers have been auto-submitted safely!");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleSubmitQuizManual = async () => {
    // Check if some unanswered
    const unansCount = selectedAnswers.filter(a => a === -1).length;
    if (unansCount > 0) {
      if (!window.confirm(`Warning: You have ${unansCount} uncompleted questions. Submit anyway?`)) {
        return;
      }
    }

    setSubmittingQuiz(true);
    try {
      const processed = selectedAnswers.map(ans => ans === -1 ? 0 : ans);
      await axios.post('/api/student/submit-assessment', {
        assessmentId: activeQuiz.id,
        submittedAnswers: processed,
        submittedText: 'Student completed quiz'
      }, { headers });
      
      setActiveQuiz(null);
      await fetchAllData();
      alert("Success: Your quiz answers have been saved and auto-graded immediately!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Submission encountered an error.");
    } finally {
      setSubmittingQuiz(false);
    }
  };

  const handleSubmitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentText.trim()) {
      alert("Please enter your assignment response text first.");
      return;
    }

    setSubmittingAssignment(true);
    try {
      await axios.post('/api/student/submit-assessment', {
        assessmentId: activeAssignment.id,
        submittedText: assignmentText
      }, { headers });

      setActiveAssignment(null);
      setAssignmentText('');
      await fetchAllData();
      alert("Success: Assignment files uploaded and delivered to faculty grading pipeline.");
    } catch (err: any) {
      alert(err.response?.data?.error || "Submission failure.");
    } finally {
      setSubmittingAssignment(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-700">
      
      {/* Dynamic Sub-tab Selector */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-xs flex gap-2">
        <button
          onClick={() => { setActiveSubTab('overview'); setActiveQuiz(null); setActiveAssignment(null); }}
          className={`flex-1 hover:bg-slate-50 transition-all font-semibold rounded-lg py-2.5 text-xs flex justify-center items-center gap-2 ${activeSubTab === 'overview' ? 'bg-blue-600 text-white hover:bg-blue-600 shadow-sm' : 'text-slate-600'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Modules & Timetables</span>
        </button>
        <button
          onClick={() => { setActiveSubTab('notes'); setActiveQuiz(null); setActiveAssignment(null); }}
          className={`flex-1 hover:bg-slate-50 transition-all font-semibold rounded-lg py-2.5 text-xs flex justify-center items-center gap-2 ${activeSubTab === 'notes' ? 'bg-blue-600 text-white hover:bg-blue-600 shadow-sm' : 'text-slate-600'}`}
        >
          <FileText className="w-4 h-4" />
          <span>Lecture Materials ({notes.length})</span>
        </button>
        <button
          onClick={() => { setActiveSubTab('assessments'); }}
          className={`flex-1 hover:bg-slate-50 transition-all font-semibold rounded-lg py-2.5 text-xs flex justify-center items-center gap-2 ${activeSubTab === 'assessments' ? 'bg-blue-600 text-white hover:bg-blue-600 shadow-sm' : 'text-slate-600'}`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Quizzes & Assignments ({assessments.length})</span>
        </button>
      </div>

      {loading && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-xs text-slate-400 font-mono">Synchronizing coursework repositories...</span>
        </div>
      )}

      {!loading && activeSubTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Upper overview stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Enrolled Courses</span>
                <span className="text-xl font-mono font-bold text-slate-800">{subjects.length} Modules</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Schedules/wk</span>
                <span className="text-xl font-mono font-bold text-slate-800">{schedules.length} Timetables</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Attendance Ratio</span>
                <span className="text-xl font-mono font-bold text-slate-800">
                  {Array.isArray(attendance) && attendance.length > 0 
                    ? `${Math.round((attendance.filter(a => a && a.status === 'PRESENT').length / attendance.length) * 100)}%` 
                    : '100%'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Course subjects syllabus */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-left">
              <div>
                <h4 className="font-display font-bold text-slate-800 text-sm">Active Enrolled Subjects</h4>
                <p className="text-slate-400 text-[11px]">Syllabus units assigned for your engineering major</p>
              </div>

              {subjects.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-6 text-center">You have not been assigned to any course units yet.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {subjects.map(s => (
                    <div key={s.id} className="p-4 bg-slate-50 border rounded-xl hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-mono text-[9px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded uppercase tracking-wide">
                            {s.subjectCode}
                          </span>
                          <h5 className="font-bold text-slate-800 text-xs mt-1.5">{s.subjectName}</h5>
                          <p className="text-slate-400 text-[10px] mt-0.5">Credits: {s.credits} Lecture Units</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold bg-white border px-1.5 py-0.5 rounded shadow-2xs">Term 1</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timetables schedules */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 text-left">
              <div>
                <h4 className="font-display font-bold text-slate-800 text-sm">School Placements & Timetable</h4>
                <p className="text-slate-400 text-[11px]">Weekly timetable calendar schedule</p>
              </div>

              {schedules.length === 0 ? (
                <p className="text-slate-400 text-xs italic py-6 text-center">No classroom schedules programmed.</p>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto">
                  {schedules.map(sc => (
                    <div key={sc.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[9px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded tracking-wide uppercase">
                            {sc.roomDetails?.roomNumber || 'Room N/A'}
                          </span>
                          <h5 className="font-bold text-slate-800 text-xs truncate max-w-[140px] md:max-w-xs">{sc.subjectDetails?.subjectName}</h5>
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                          <MapPin className="w-3 text-slate-300 shrink-0" />
                          <span className="truncate max-w-[100px]">{sc.roomDetails?.building}</span>
                          <span>•</span>
                          <span className="italic truncate max-w-[100px]">{sc.staffDetails}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-800 text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded block text-center">{sc.dayOfWeek}</span>
                        <span className="text-[9px] text-slate-400 font-mono block mt-1">{sc.startTime} - {sc.endTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && activeSubTab === 'notes' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left animate-fade-in spacing-y-4">
          <div className="mb-4">
            <h4 className="font-display font-bold text-slate-800 text-sm">Course Lecture Materials & Notes</h4>
            <p className="text-slate-400 text-[11px]">Download shared syllabi uploaded by your assigned Teachers</p>
          </div>

          {notes.length === 0 ? (
            <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-xs italic">No downloadable lecture notes uploaded for your courses yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {notes.map(note => (
                <div key={note.id} className="p-4 bg-slate-50 border rounded-xl hover:border-blue-300 transition-colors flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="font-mono text-[9px] font-bold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-blue-600 uppercase tracking-tight block w-max">
                      {note.subjectName}
                    </span>
                    <h5 className="font-bold text-slate-800 text-xs mt-1.5">{note.title}</h5>
                    <p className="text-slate-400 text-[10px] line-clamp-2">{note.description || 'No notes details provided.'}</p>
                    <div className="flex justify-between items-center pt-2 text-[9px] text-slate-400 font-mono">
                      <span>By: {note.uploadedBy}</span>
                      <span>{note.createdAt?.split('T')[0]}</span>
                    </div>
                  </div>
                  <a 
                    href={note.fileUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-1.5 rounded-lg bg-white border text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors shrink-0"
                    title="Download Note File"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && activeSubTab === 'assessments' && (
        <div className="space-y-6 animate-fade-in text-left">
          
          {/* THE IMMERSIVE QUIZ SHEET OVERLAY */}
          {activeQuiz && (
            <div className="bg-slate-900 text-slate-100 p-6 md:p-8 rounded-2xl shadow-xl space-y-6 relative border border-slate-700 animate-slide-up">
              
              {/* Header bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
                <div>
                  <span className="font-mono text-[10px] font-bold tracking-widest text-sky-400 uppercase bg-slate-950 px-2 py-0.5 rounded">
                    {activeQuiz.subjectName}
                  </span>
                  <h3 className="text-lg font-bold text-white mt-1.5">{activeQuiz.title}</h3>
                </div>

                <div className={`p-3 rounded-xl border flex items-center gap-2.5 shrink-0 ${quizTimeLeft < 60 ? 'bg-rose-950/40 border-rose-800 text-rose-400 animate-pulse' : 'bg-slate-950 border-slate-800 text-amber-400'}`}>
                  <Timer className="w-5 h-5 shrink-0" />
                  <div className="text-right">
                    <span className="block text-[8px] uppercase tracking-wider font-mono text-slate-400">Time Remaining</span>
                    <span className="text-lg font-mono font-bold leading-none block mt-0.5">{decodeTime(quizTimeLeft)}</span>
                  </div>
                </div>
              </div>

              {/* Quiz Alert Banner */}
              {quizTimeLeft < 60 && (
                <div className="p-3 bg-rose-900/30 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                  <span>Hurry: Less than one minute left! The quiz sheet will auto-submit when the timer expires.</span>
                </div>
              )}

              {/* Questions Render */}
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
                {(!activeQuiz.questions || activeQuiz.questions.length === 0) ? (
                  <p className="text-slate-400 italic text-sm">No structured questions found in this quiz.</p>
                ) : (
                  activeQuiz.questions.map((q: any, qIdx: number) => (
                    <div key={qIdx} className="p-5 bg-slate-950/50 border border-slate-800 rounded-xl space-y-4">
                      <div className="flex gap-2.5 items-start">
                        <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {qIdx + 1}
                        </span>
                        <h4 className="text-slate-200 font-bold text-sm leading-relaxed">{q.questionText}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pl-8">
                        {q.options?.map((opt: string, optIdx: number) => (
                          <button
                            type="button"
                            key={optIdx}
                            onClick={() => handleSelectAnswer(qIdx, optIdx)}
                            className={`p-3 rounded-lg text-left text-xs font-medium cursor-pointer transition-all border outline-hidden ${selectedAnswers[qIdx] === optIdx ? 'bg-blue-600 border-blue-500 text-white shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-350 hover:bg-slate-850'}`}
                          >
                            <span className="inline-block w-4 font-mono font-bold uppercase text-slate-400 mr-2">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer submission bar */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Abort quiz? All current response selections will be lost.")) {
                      setActiveQuiz(null);
                    }
                  }}
                  className="px-4 py-2 text-xs font-bold text-slate-440 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel & Exit
                </button>

                <button
                  type="button"
                  onClick={handleSubmitQuizManual}
                  disabled={submittingQuiz}
                  className="bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-black font-extrabold px-6 py-2.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                >
                  {submittingQuiz ? 'Saving...' : 'Submit Answers'}
                  <ArrowRight className="w-4 h-4 text-black font-bold" />
                </button>
              </div>

            </div>
          )}

          {/* THE ASSIGNMENT DELIVER OVERLAY */}
          {activeAssignment && (
            <form onSubmit={handleSubmitAssignment} className="bg-slate-50 p-6 rounded-2xl border border-slate-305 space-y-4 animate-slide-up">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <span className="text-[9px] font-mono uppercase bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                    Assignment Submission
                  </span>
                  <h3 className="font-bold text-slate-800 text-base mt-1.5">{activeAssignment.title}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">Assigned by: course faculty of {activeAssignment.subjectName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveAssignment(null)}
                  className="text-slate-440 hover:text-slate-650 font-bold text-xs p-1"
                >
                  Close
                </button>
              </div>

              <div className="p-3 bg-white border rounded-xl text-xs text-slate-600 font-serif leading-relaxed">
                <strong className="font-sans block text-slate-800 text-[10px] uppercase font-bold text-slate-400 mb-1">Homework Guidelines:</strong>
                {activeAssignment.description || 'Deliver response directly in the text sheet below.'}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Solution Text Response</label>
                <textarea
                  rows={6}
                  required
                  value={assignmentText}
                  onChange={(e) => setAssignmentText(e.target.value)}
                  className="w-full bg-white border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl p-4 text-xs focus:ring-1 focus:ring-blue-500/20 text-slate-800 focus:outline-hidden"
                  placeholder="Draft your solution notes, essays, outline lists or links to cloud documents (PDF, Doc) here..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAssignment(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssignment}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{submittingAssignment ? 'Saving Submission...' : 'Submit Assignment'}</span>
                </button>
              </div>
            </form>
          )}

          {/* MAIN LIST OF ACTIVE EVALUATIONS */}
          {!activeQuiz && !activeAssignment && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h4 className="font-display font-bold text-slate-800 text-sm">Active Evaluations syllabus</h4>
                <p className="text-slate-400 text-[11px]">In-course quizzes and homework assignments set by your instructors</p>
              </div>

              {assessments.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-150 rounded-xl text-center">
                  <HelpCircle className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                  <p className="text-slate-400 text-xs italic">No quizzes or assignments are currently assigned to your modules.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map(asm => {
                    const isPassed = asm.submissionStatus === 'GRADED' || asm.submissionStatus === 'SUBMITTED';
                    const isNewQuiz = asm.type === 'QUIZ';
                    const hasDeadlineExpired = new Date(asm.deadline) < new Date();

                    return (
                      <div 
                        key={asm.id} 
                        className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${isPassed ? 'bg-slate-50/55 border-slate-150' : 'bg-white border-slate-205 hover:border-slate-300'}`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wide">
                              {asm.subjectName}
                            </span>
                            <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${isNewQuiz ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                              {asm.type}
                            </span>
                            {isPassed ? (
                              <span className="font-mono text-[9px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded flex items-center gap-1 border border-emerald-200">
                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                {asm.submissionStatus === 'GRADED' ? 'Grades Saved' : 'Pending Review'}
                              </span>
                            ) : hasDeadlineExpired ? (
                              <span className="font-mono text-[9px] font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-205">
                                Overdue
                              </span>
                            ) : (
                              <span className="font-mono text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                                Assigned
                              </span>
                            )}
                          </div>

                          <div>
                            <h5 className="font-bold text-slate-800 text-xs mt-1.5 block">{asm.title}</h5>
                            <p className="text-slate-400 text-[10px] mt-0.5 line-clamp-1">{asm.description || 'No summary text provided.'}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-mono pt-1">
                            {isNewQuiz && (
                              <span className="flex items-center gap-1 bg-slate-50 border p-1 rounded">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {asm.durationMinutes || 10} Mins Test
                              </span>
                            )}
                            <span className="font-medium">Max Score: {asm.maxPoints} pts</span>
                            <span>•</span>
                            <span className="text-rose-600">Deadline: {asm.deadline?.split('T')[0]}</span>
                          </div>
                        </div>

                        {/* SUBMISSION / REVIEW ACTIONS */}
                        <div className="shrink-0 pt-2 md:pt-0 w-full md:w-auto text-right">
                          {isPassed ? (
                            <div className="bg-white p-3 rounded-xl border border-slate-150 text-left md:text-right space-y-1 max-w-xs ml-auto">
                              {asm.marksObtained !== null && asm.marksObtained !== undefined ? (
                                <div>
                                  <span className="text-[10px] text-slate-400 block font-mono">Academic Score</span>
                                  <span className="text-base font-mono font-extrabold text-blue-600 block leading-none">
                                    {asm.marksObtained} / {asm.maxPoints}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-amber-600 font-bold block">Awaiting Instructor Score</span>
                              )}
                              
                              {asm.feedback && (
                                <p className="text-[10px] text-slate-500 italic bg-slate-50 border p-1 rounded leading-normal max-w-[200px] mt-1 text-center md:text-left">
                                  "{asm.feedback}"
                                </p>
                              )}
                            </div>
                          ) : hasDeadlineExpired ? (
                            <button
                              type="button"
                              disabled
                              className="w-full md:w-auto bg-slate-100 text-slate-400 font-bold rounded-lg px-4 py-2 text-xs cursor-not-allowed"
                            >
                              Missed Cutoff
                            </button>
                          ) : isNewQuiz ? (
                            <button
                              type="button"
                              onClick={() => handleStartQuiz(asm)}
                              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg px-4 py-2 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                            >
                              <Timer className="w-4 h-4 shrink-0 text-white" />
                              <span>Take Quiz NOW</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActiveAssignment(asm)}
                              className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg px-4 py-2 text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-98"
                            >
                              <UploadCloud className="w-4 h-4 shrink-0 text-white" />
                              <span>Deliver Solution</span>
                            </button>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
