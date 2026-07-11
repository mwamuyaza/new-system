import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  HelpCircle,
  FileText,
  Plus,
  Trash2,
  CalendarCheck,
  CheckCircle,
  ShieldCheck,
  Award,
  Clock3,
  ListPlus,
  Timer,
  Check,
  X,
  Sparkles,
  FileCode,
  GraduationCap
} from 'lucide-react';
import axios from 'axios';
import { ClassroomAssignment } from '../types';

interface StaffMyCoursesProps {
  token: string | null;
}

export default function StaffMyCourses({ token }: StaffMyCoursesProps) {
  const [allocations, setAllocations] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<ClassroomAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Sub-tab selector for Staff
  const [activeSubTab, setActiveSubTab] = useState<'classes' | 'notes' | 'assessments' | 'grading' | 'attendance'>('classes');

  // LECTURE NOTES STATE
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState({
    subjectId: '',
    title: '',
    description: '',
    fileUrl: 'https://example.com/lecture_guide_' + Math.floor(100+Math.random()*900) + '.pdf'
  });
  const [submittingNote, setSubmittingNote] = useState(false);

  // EVALUATIONS CREATOR STATE
  const [assessments, setAssessments] = useState<any[]>([]);
  const [newAsm, setNewAsm] = useState({
    subjectId: '',
    type: 'QUIZ', // 'QUIZ' | 'ASSIGNMENT'
    title: '',
    description: '',
    maxPoints: '10',
    durationMinutes: '10',
    deadline: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0]
  });
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  // Individual Question Draft Helper
  const [draftQuestion, setDraftQuestion] = useState({
    questionText: '',
    options: ['', '', '', ''],
    correctOptionIndex: 0
  });
  const [submittingAsm, setSubmittingAsm] = useState(false);

  // SUBMISSIONS GRADING STATE
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null);
  const [gradingScore, setGradingScore] = useState('');
  const [gradingFeedback, setGradingFeedback] = useState('');
  const [submittingGrade, setSubmittingGrade] = useState(false);

  // REGISTER ROLLBOOK (ONLINE ATTENDANCE) STATE
  const [rollSubjectId, setRollSubjectId] = useState('');
  const [rollDate, setRollDate] = useState(new Date().toISOString().split('T')[0]);
  const [rollStudents, setRollStudents] = useState<any[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<{ [studentId: number]: 'PRESENT' | 'ABSENT' }>({});
  const [loadingRoll, setLoadingRoll] = useState(false);
  const [submittingRoll, setSubmittingRoll] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchGeneralData = async () => {
    setLoading(true);
    try {
      const [aRes, sRes, notesRes, assessmentsRes, submissionsRes] = await axios.all([
        axios.get('/api/staff/my-subjects', { headers }),
        axios.get('/api/staff/my-schedules', { headers }),
        axios.get('/api/staff/notes', { headers }),
        axios.get('/api/staff/assessments', { headers }),
        axios.get('/api/staff/submissions', { headers })
      ]);
      setAllocations(aRes.data);
      setSchedules(sRes.data);
      setNotes(notesRes.data);
      setAssessments(assessmentsRes.data);
      setSubmissions(submissionsRes.data);

      // Pre-set first subject fallback for inputs
      if (aRes.data?.length > 0) {
        const firstSubId = aRes.data[0].id.toString();
        setNewNote(n => ({ ...n, subjectId: firstSubId }));
        setNewAsm(a => ({ ...a, subjectId: firstSubId }));
        setRollSubjectId(firstSubId);
      }
    } catch (e) {
      console.error("Failed to fetch staff customized matrices", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeneralData();
  }, [token]);

  // Load online rollbook register roster
  useEffect(() => {
    const loadRollbook = async () => {
      if (!rollSubjectId) return;
      setLoadingRoll(true);
      try {
        // Fetch student roster enrolled in the custom class for this subject
        const chosenSub = allocations.find(a => a.id === parseInt(rollSubjectId, 10));
        if (chosenSub) {
          const res = await axios.get('/api/students', { headers });
          // Match student class enrollment
          const list = res.data.filter((stu: any) => 
            stu.classesDetails?.some((c: any) => c.id === chosenSub.classId)
          );
          setRollStudents(list);

          // Pre-populate PRESENT as default for convenient fast register ticking
          const defaultMap: any = {};
          list.forEach((s: any) => {
            defaultMap[s.id] = 'PRESENT';
          });
          setAttendanceMap(defaultMap);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingRoll(false);
      }
    };
    loadRollbook();
  }, [rollSubjectId, rollDate, allocations]);

  // NOTES SUBMIT HANDLER
  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.subjectId || !newNote.title.trim()) {
      alert("Please choose a target syllabus and enter a resource title.");
      return;
    }
    setSubmittingNote(true);
    try {
      await axios.post('/api/staff/notes', newNote, { headers });
      setNewNote(n => ({
        ...n,
        title: '',
        description: '',
        fileUrl: 'https://example.com/lecture_guide_' + Math.floor(100+Math.random()*900) + '.pdf'
      }));
      await fetchGeneralData();
      alert("Success: Lecture materials resource updated and broadcasted to enrolled students.");
    } catch (err: any) {
      alert("Error posting lecture files.");
    } finally {
      setSubmittingNote(false);
    }
  };

  // EXTRACT DRAFT QUESTION ADDER Helper
  const handleAddQuestionToQuizDraft = () => {
    if (!draftQuestion.questionText.trim()) {
      alert("Question text is required.");
      return;
    }
    if (draftQuestion.options.some(o => !o.trim())) {
      alert("Please fill in all 4 option candidates.");
      return;
    }
    setQuizQuestions([...quizQuestions, draftQuestion]);
    setDraftQuestion({
      questionText: '',
      options: ['', '', '', ''],
      correctOptionIndex: 0
    });
  };

  // POST EVALUATIONS HANDLER (QUIZ / ASSIGNMENT)
  const handleCreateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsm.subjectId || !newAsm.title.trim()) {
      alert("Enter a target assessment title.");
      return;
    }

    if (newAsm.type === 'QUIZ' && quizQuestions.length === 0) {
      alert("Please add at least 1 trivia question draft to this Quiz unit.");
      return;
    }

    setSubmittingAsm(true);
    try {
      const payload = {
        subjectId: parseInt(newAsm.subjectId, 10),
        type: newAsm.type,
        title: newAsm.title,
        description: newAsm.description,
        maxPoints: parseFloat(newAsm.maxPoints),
        durationMinutes: newAsm.type === 'QUIZ' ? parseInt(newAsm.durationMinutes, 10) : 0,
        deadline: newAsm.deadline,
        questions: newAsm.type === 'QUIZ' ? quizQuestions : []
      };

      await axios.post('/api/staff/assessments', payload, { headers });
      
      // Clean drafts
      setNewAsm(a => ({
        ...a,
        title: '',
        description: '',
        maxPoints: '10',
        durationMinutes: '10'
      }));
      setQuizQuestions([]);
      await fetchGeneralData();
      alert("Success: Evaluation syllabus unit assigned and deadline timestamp locks established.");
    } catch (err: any) {
      alert(err.response?.data?.error || "Error compiling assessment schedule.");
    } finally {
      setSubmittingAsm(false);
    }
  };

  // SUMMIT GRADE SCORE DECISION HANDLER
  const handleSaveGradeScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmissionId) return;

    setSubmittingGrade(true);
    try {
      await axios.put(`/api/staff/submissions/${gradingSubmissionId}/grade`, {
        score: parseFloat(gradingScore),
        feedback: gradingFeedback
      }, { headers });

      setGradingSubmissionId(null);
      setGradingScore('');
      setGradingFeedback('');
      await fetchGeneralData();
      alert("Success: Marks locked into permanent academic records, with transcript indexes recompiled!");
    } catch (err: any) {
      alert("Failed to submit score ledger.");
    } finally {
      setSubmittingGrade(false);
    }
  };

  // MANUAL SINGLE-CLICK MARK REGISTER INDIVIDUAL SELECTIONS
  const handleMarkAttend = (studentId: number, status: 'PRESENT' | 'ABSENT') => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // SUBMIT ROLLBOOK REGISTER ROLL REGISTER CHRONICLES
  const handleSubmitWholeRegisterList = async () => {
    if (rollStudents.length === 0) {
      alert("No students found to lodge registers on.");
      return;
    }

    setSubmittingRoll(true);
    try {
      // Loop over and post student presence
      const promises = rollStudents.map(student => {
        return axios.post('/api/attendance', {
          studentId: student.id,
          subjectId: parseInt(rollSubjectId, 10),
          date: rollDate,
          status: attendanceMap[student.id] || 'PRESENT'
        }, { headers });
      });

      await axios.all(promises);
      alert("Success: Online register marked! Checked ledger index successfully recorded.");
    } catch (err: any) {
      alert("Attendance chronicle registration failure.");
    } finally {
      setSubmittingRoll(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-700 animate-fade-in text-left">
      
      {/* Upper overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Assigned Syllabus Modules</span>
            <span className="text-xl font-mono font-bold text-slate-800">{allocations.length} Active Courses</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Weekly timetables schedule</span>
            <span className="text-xl font-mono font-bold text-slate-800">{schedules.length} Classroom Assignments</span>
          </div>
        </div>
      </div>

      {/* Coursework tabs switcher */}
      <div className="bg-slate-100 p-1.5 rounded-2xl border flex flex-wrap gap-1">
        <button
          onClick={() => setActiveSubTab('classes')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeSubTab === 'classes' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
        >
          Classes & Schedule
        </button>
        <button
          onClick={() => setActiveSubTab('notes')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeSubTab === 'notes' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
        >
          Notes Manager ({notes.length})
        </button>
        <button
          onClick={() => setActiveSubTab('assessments')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeSubTab === 'assessments' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
        >
          Evaluations workshop ({assessments.length})
        </button>
        <button
          onClick={() => setActiveSubTab('grading')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeSubTab === 'grading' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
        >
          Grade Center ({submissions.length})
        </button>
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${activeSubTab === 'attendance' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-850'}`}
        >
          Mark Registers
        </button>
      </div>

      {loading && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <span className="text-xs text-slate-400 font-mono">Loading class registers and curriculum profiles...</span>
        </div>
      )}

      {/* CLASROOM AGENDA VIEW */}
      {!loading && activeSubTab === 'classes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h4 className="font-display font-bold text-slate-800 text-sm">Allocated Subjects Directory</h4>
              <p className="text-slate-400 text-[11px]">Core modules designated for your faculty schedule</p>
            </div>

            {allocations.length === 0 ? (
              <p className="text-slate-400 text-xs italic py-6 text-center">No allocated modules registered under your account.</p>
            ) : (
              <div className="space-y-3">
                {allocations.map((a, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border rounded-xl hover:border-sky-305 transition-colors">
                    <span className="font-mono text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
                      {a.subjectCode}
                    </span>
                    <h5 className="font-bold text-slate-800 text-xs mt-1.5">{a.subjectName}</h5>
                    <p className="text-slate-400 text-[10px] mt-0.5">Assigned Target Student Cohort: Year {a.academicYear}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div>
              <h4 className="font-display font-bold text-slate-800 text-sm">Your Class Timetables</h4>
              <p className="text-slate-400 text-[11px]">Classroom allocations and day planners</p>
            </div>

            {schedules.length === 0 ? (
              <p className="text-slate-400 text-xs italic py-6 text-center">No classroom timetables configured.</p>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto">
                {schedules.map(sc => (
                  <div key={sc.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded tracking-wide uppercase">
                          {sc.roomDetails?.roomNumber || 'Room N/A'}
                        </span>
                        <h5 className="font-bold text-slate-800 text-xs truncate max-w-xs">{sc.subjectDetails?.subjectName}</h5>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-300" />
                        <span>{sc.roomDetails?.building}</span>
                        <span>•</span>
                        <span className="font-semibold text-slate-500">Cohort: {sc.classDetails?.className} ({sc.classDetails?.section})</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-slate-800 text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded block">{sc.dayOfWeek}</span>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">{sc.startTime} - {sc.endTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOTES MANAGER VIEW */}
      {!loading && activeSubTab === 'notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Notes Broadcaster */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-1">
            <div>
              <h4 className="font-display font-bold text-slate-800 text-sm">Post Lecture Materials</h4>
              <p className="text-slate-400 text-[11px]">Upload reference papers, document files or study links</p>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-450 font-bold mb-1">Target Subject</label>
                <select
                  value={newNote.subjectId}
                  onChange={(e) => setNewNote({ ...newNote, subjectId: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-2 text-xs text-slate-655 font-medium outline-hidden"
                >
                  {allocations.map(a => (
                    <option key={a.id} value={a.id}>{a.subjectCode} - {a.subjectName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-450 font-bold mb-1">Lectures Notes Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical Properties of Composite structures"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs text-slate-700 outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-455 font-bold mb-1">Resource Description notes</label>
                <textarea
                  rows={3}
                  placeholder="Summarize course units covered, research objectives, or instructions..."
                  value={newNote.description}
                  onChange={(e) => setNewNote({ ...newNote, description: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg p-3 text-xs text-slate-705 outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-450 font-bold mb-1">Attachment File Link</label>
                <input
                  type="text"
                  value={newNote.fileUrl}
                  onChange={(e) => setNewNote({ ...newNote, fileUrl: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs font-mono text-slate-600 outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={submittingNote}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-xs transition-colors flex justify-center items-center gap-2 cursor-pointer shadow-sm mt-4"
              >
                <CheckCircle className="w-4 h-4" />
                <span>{submittingNote ? 'Uploading...' : 'Publish Lecture Notes'}</span>
              </button>
            </form>
          </div>

          {/* Broadcoast Materials List */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
            <div>
              <h4 className="font-display font-medium text-slate-400 text-[10px] uppercase font-mono">Shared Class Repository</h4>
              <p className="text-slate-500 text-xs font-bold mt-1">Materials Broadcoasted on Student feeds</p>
            </div>

            {notes.length === 0 ? (
              <p className="text-slate-400 italic text-xs py-8 text-center">No references uploaded yet. Launch your first paper above.</p>
            ) : (
              <div className="space-y-3.5 max-h-[480px] overflow-y-auto">
                {notes.map(note => (
                  <div key={note.id} className="p-4 bg-slate-50 rounded-xl border flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="font-mono text-[9px] font-bold bg-white border px-1.5 py-0.5 rounded text-slate-600 uppercase">
                        {note.subjectName}
                      </span>
                      <h5 className="font-bold text-slate-800 text-xs mt-1.5">{note.title}</h5>
                      <p className="text-slate-400 text-[10px] line-clamp-2">{note.description || 'No descriptive guide.'}</p>
                      <span className="text-[9px] text-slate-400 font-mono block mt-1">File: {note.fileUrl}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* QUIZ AND HOMEWORK BUILDER WORKSHOP */}
      {!loading && activeSubTab === 'assessments' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 space-y-4">
            <div>
              <h4 className="font-display font-bold text-slate-800 text-sm">Post evaluations Workshop</h4>
              <p className="text-slate-400 text-[11px]">Publish online quizzes or text deliverables</p>
            </div>

            <form onSubmit={handleCreateAssessment} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-450 font-bold mb-1">Target Subject Class</label>
                <select
                  value={newAsm.subjectId}
                  onChange={(e) => setNewAsm({ ...newAsm, subjectId: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-2 text-xs text-slate-655"
                >
                  {allocations.map(a => (
                    <option key={a.id} value={a.id}>{a.subjectCode} - {a.subjectName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-450 font-bold mb-1">Type</label>
                  <select
                    value={newAsm.type}
                    onChange={(e: any) => setNewAsm({ ...newAsm, type: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-2 text-xs text-slate-605"
                  >
                    <option value="QUIZ">QUIZ (Immersive)</option>
                    <option value="ASSIGNMENT">ASSIGNMENT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-455 font-bold mb-1">Points</label>
                  <input
                    type="number"
                    required
                    value={newAsm.maxPoints}
                    onChange={(e) => setNewAsm({ ...newAsm, maxPoints: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              {newAsm.type === 'QUIZ' && (
                <div className="space-y-1 bg-sky-50/50 p-2 border border-sky-100 rounded-lg">
                  <label className="block text-[10px] font-mono uppercase text-sky-700 font-bold mb-1">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    value={newAsm.durationMinutes}
                    onChange={(e) => setNewAsm({ ...newAsm, durationMinutes: e.target.value })}
                    className="w-full bg-white border border-sky-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800"
                    placeholder="Minutes limit"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-450 font-bold mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 3 Homework Assignment"
                  value={newAsm.title}
                  onChange={(e) => setNewAsm({ ...newAsm, title: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg px-3 py-2 text-xs text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-450 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Directions, questions list summary, or testing conditions..."
                  value={newAsm.description}
                  onChange={(e) => setNewAsm({ ...newAsm, description: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg p-3 text-xs text-slate-700"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-mono uppercase text-slate-450 font-bold mb-1">Deadline Cutoff</label>
                <input
                  type="date"
                  required
                  value={newAsm.deadline}
                  onChange={(e) => setNewAsm({ ...newAsm, deadline: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs"
                />
              </div>

              {/* QUIZ INTERACTIVE QUESTION BUILDER */}
              {newAsm.type === 'QUIZ' && (
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] font-bold uppercase text-slate-400 block flex items-center gap-1">
                      <ListPlus className="w-3.5 h-3.5" /> Trivia Questions ({quizQuestions.length})
                    </span>
                  </div>

                  {quizQuestions.length > 0 && (
                    <div className="space-y-1.5 max-h-[140px] overflow-y-auto bg-white p-2 rounded-lg border text-[10px] text-slate-600 font-mono">
                      {quizQuestions.map((q, qIndex) => (
                        <div key={qIndex} className="flex justify-between items-center border-b pb-1">
                          <span className="truncate max-w-[120px]">{qIndex + 1}. {q.questionText}</span>
                          <span className="bg-sky-50 text-sky-850 px-1 rounded">Ans Option index {q.correctOptionIndex}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-150 text-[11px]">
                    <h5 className="font-bold text-slate-700 uppercase text-[9px]">Add a Quiz Question</h5>
                    <input
                      type="text"
                      placeholder="e.g. Which of these is a thermoplastic?"
                      value={draftQuestion.questionText}
                      onChange={(e) => setDraftQuestion({ ...draftQuestion, questionText: e.target.value })}
                      className="w-full p-2 bg-slate-50 border rounded text-xs"
                    />
                    <div className="grid grid-cols-2 gap-1 px-1">
                      {draftQuestion.options.map((opt, oIdx) => (
                        <input
                          key={oIdx}
                          type="text"
                          placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                          value={opt}
                          onChange={(e) => {
                            const updatedOpts = [...draftQuestion.options];
                            updatedOpts[oIdx] = e.target.value;
                            setDraftQuestion({ ...draftQuestion, options: updatedOpts });
                          }}
                          className="p-1 px-2 border rounded font-mono text-[10px]"
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-1.5">
                      <label className="text-[9px] text-slate-400 uppercase font-bold font-sans">Correct Index (A-D):</label>
                      <select
                        value={draftQuestion.correctOptionIndex}
                        onChange={(e) => setDraftQuestion({ ...draftQuestion, correctOptionIndex: parseInt(e.target.value, 10) })}
                        className="bg-slate-50 border rounded p-1 text-[10px]"
                      >
                        <option value="0">A (0)</option>
                        <option value="1">B (1)</option>
                        <option value="2">C (2)</option>
                        <option value="3">D (3)</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddQuestionToQuizDraft}
                      className="w-full mt-2 py-1.5 bg-slate-900 hover:bg-black text-white font-bold rounded text-[10px] cursor-pointer"
                    >
                      + Save Question (Lock Option)
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submittingAsm}
                className="w-full bg-blue-600 hover:bg-blue-700 font-semibold py-2.5 rounded-lg text-white text-xs cursor-pointer shadow-sm mt-4 uppercase tracking-wide"
              >
                {submittingAsm ? 'Saving...' : 'Publish evaluation unit'}
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-205 shadow-sm lg:col-span-2 space-y-4">
            <div>
              <h4 className="font-display font-medium text-slate-400 text-[10px] uppercase font-mono">Published assessments Syllabus</h4>
              <p className="text-slate-500 text-xs font-bold mt-1">Evaluations Active for Students</p>
            </div>

            {assessments.length === 0 ? (
              <p className="text-slate-400 italic text-xs py-8 text-center">No assignments or quizzes established. Post one to verify student rosters.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {assessments.map(asm => (
                  <div key={asm.id} className="p-4 bg-slate-50 border rounded-xl flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold bg-white border px-1.5 py-0.5 rounded text-blue-650 uppercase">
                          {asm.subjectName}
                        </span>
                        <span className="font-mono text-[9px] font-bold bg-slate-200 border px-1.5 py-0.5 rounded uppercase">
                          {asm.type}
                        </span>
                      </div>
                      <h5 className="font-bold text-slate-800 text-xs mt-1.5">{asm.title}</h5>
                      <span className="text-[10px] text-slate-400 font-mono block">Deadline cutoff: {asm.deadline?.split('T')[0]}</span>
                    </div>

                    <div className="text-right text-xs shrink-0 bg-white border p-2.5 rounded-xl self-start font-mono leading-relaxed space-y-0.5">
                      <span className="block font-bold">Max points: {asm.maxPoints} pts</span>
                      {asm.type === 'QUIZ' && (
                        <span className="block text-[9.5px] text-cyan-600 font-medium">Timer: {asm.durationMinutes} minutes limit</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* GRADE CENTER (SUBMISSIONS REVIEW) VIEW */}
      {!loading && activeSubTab === 'grading' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs text-left text-slate-705 spacing-y-4">
          <div className="mb-4">
            <h4 className="font-display font-bold text-slate-800 text-sm">Grading Center Pipeline</h4>
            <p className="text-slate-400 text-[11px]">Score examinations, answers book submissions and text solutions</p>
          </div>

          {submissions.length === 0 ? (
            <div className="py-12 border border-dashed border-slate-200 rounded-xl text-center">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-xs italic">No student submissions returned to your evaluation folder yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Grading Pop-up Modal Panel */}
              {gradingSubmissionId && (
                <form onSubmit={handleSaveGradeScore} className="p-5 bg-sky-50 border border-sky-200 rounded-2xl space-y-3.5 mb-6">
                  <h4 className="font-bold text-sky-900 text-xs uppercase flex items-center gap-1.5">
                    <Award className="w-5 h-5 text-sky-700" /> Lodge Marks Score
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-sky-700 font-bold mb-1">Assigned Score points</label>
                      <input
                        type="number"
                        step="0.5"
                        required
                        value={gradingScore}
                        onChange={(e) => setGradingScore(e.target.value)}
                        className="w-full bg-white border border-sky-300 rounded-lg px-3 py-2 text-xs"
                        placeholder="e.g. 8.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-sky-700 font-bold mb-1">Critique Feedback</label>
                      <input
                        type="text"
                        value={gradingFeedback}
                        onChange={(e) => setGradingFeedback(e.target.value)}
                        className="w-full bg-white border border-sky-305 rounded-lg px-3 py-2 text-xs"
                        placeholder="Excellent response, well outlined structure"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => setGradingSubmissionId(null)}
                      className="px-4 py-1.5 text-xs text-sky-700 hover:text-sky-900"
                    >
                      Cancel Panel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingGrade}
                      className="px-5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg shadow-sm"
                    >
                      {submittingGrade ? 'Saving Score...' : 'Apply marks & grade'}
                    </button>
                  </div>
                </form>
              )}

              {/* Submission cards list */}
              {submissions.map(sub => (
                <div key={sub.id} className="p-4 bg-slate-50 border rounded-xl flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[9px] font-bold bg-white border px-1.5 py-0.5 rounded text-slate-600 uppercase">
                        {sub.subjectName}
                      </span>
                      <h5 className="font-bold text-slate-800 text-xs">
                        Student: {sub.studentDetails ? `${sub.studentDetails.firstName} ${sub.studentDetails.lastName}` : `Student ID: ${sub.studentId}`}
                      </h5>
                    </div>

                    <div className="text-[11px] text-slate-500 pt-1.5">
                      <span className="block font-bold">In-class task: {sub.assessmentName}</span>
                      <div className="mt-1 p-2 bg-white rounded border border-slate-150 font-serif leading-relaxed text-slate-700">
                        {sub.submittedAnswers?.length > 0 ? (
                          <span>Quiz Choices Selected: <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">{sub.submittedAnswers.join(', ')}</span></span>
                        ) : (
                          <span>Submitted text solution: "{sub.submittedText || 'No text content.'}"</span>
                        )}
                      </div>
                    </div>

                    <div className="text-[9px] text-slate-400 font-mono pt-1">
                      <span>Submitted time: {sub.submittedAt?.split('T')[0]}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {sub.status === 'GRADED' ? (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-850 p-2.5 rounded-xl font-mono text-[11px] font-bold space-y-0.5 max-w-xs">
                        <span className="block">Score: {sub.score} / {sub.maxPoints || 10}</span>
                        {sub.feedback && <span className="block font-normal text-[9.5px] italic text-slate-500">"{sub.feedback}"</span>}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setGradingSubmissionId(sub.id);
                          setGradingScore(sub.score?.toString() || '');
                          setGradingFeedback(sub.feedback || '');
                        }}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-4 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Award className="w-4 h-4 text-white" />
                        Grade Now
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* REGISTER ROLLBOOK (ONLINE ATTENDANCE CHECKLIST) VIEW */}
      {!loading && activeSubTab === 'attendance' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left">
          <div className="mb-4">
            <h4 className="font-display font-bold text-slate-800 text-sm">Mark Register rollbook</h4>
            <p className="text-slate-400 text-[11px]">Choose an allocated module, pick a date calendar, and mark active students Present/Absent</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b">
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-450 font-bold mb-1">Select Subject Classroom</label>
              <select
                value={rollSubjectId}
                onChange={(e) => setRollSubjectId(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-2.5 py-2 text-xs"
              >
                {allocations.map(a => (
                  <option key={a.id} value={a.id}>{a.subjectCode} - {a.subjectName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-slate-450 font-bold mb-1">Placement Date Calendar</label>
              <input
                type="date"
                value={rollDate}
                onChange={(e) => setRollDate(e.target.value)}
                className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-slate-700"
              />
            </div>
          </div>

          {loadingRoll ? (
            <p className="p-12 text-center text-slate-400 text-xs italic">Pulling eligible student list for course class...</p>
          ) : rollStudents.length === 0 ? (
            <p className="p-12 text-center text-slate-400 italic text-xs">No registered student cohort linked to this subject class selection.</p>
          ) : (
            <div className="pt-4 space-y-4">
              <div className="space-y-2 border rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full border-collapse text-xs text-slate-700">
                  <thead>
                    <tr className="bg-slate-50 border-b font-mono text-[9px] uppercase tracking-wider text-slate-450 text-left">
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Enrolled ID</th>
                      <th className="py-3 px-4 text-center">Mark register status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-slate-800">
                    {rollStudents.map(student => {
                      const cur = attendanceMap[student.id];

                      return (
                        <tr key={student.id} className="hover:bg-slate-50/40">
                          <td className="py-3 px-4 font-bold">
                            {student.firstName} {student.lastName}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400 bg-slate-100/50 px-2 rounded">
                            {student.studentId}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-center items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleMarkAttend(student.id, 'PRESENT')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${cur === 'PRESENT' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                              >
                                {cur === 'PRESENT' && <Check className="w-3 h-3 text-white" />} Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkAttend(student.id, 'ABSENT')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all ${cur === 'ABSENT' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                              >
                                {cur === 'ABSENT' && <X className="w-3 h-3 text-white" />} Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  disabled={submittingRoll}
                  onClick={handleSubmitWholeRegisterList}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold px-5 py-2.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>{submittingRoll ? 'Saving Register...' : 'Save Entire Attendance Rollbook'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
