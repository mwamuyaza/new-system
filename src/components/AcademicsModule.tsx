import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Layers, 
  Book, 
  Calendar, 
  MapPin, 
  Clock, 
  Tv, 
  Wind, 
  X, 
  CheckCircle,
  GraduationCap
} from 'lucide-react';
import axios from 'axios';
import { Class, Subject, Classroom, ClassroomAssignment, Staff } from '../types';

interface AcademicsModuleProps {
  token: string | null;
  classes: Class[];
  subjects: Subject[];
  refreshData: () => void;
  staffList: Staff[];
}

export default function AcademicsModule({ token, classes, subjects, refreshData, staffList }: AcademicsModuleProps) {
  const [subTab, setSubTab] = useState<'classes_subjects' | 'classrooms_scheduling'>('classes_subjects');
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states - Classes
  const [isClassFormOpen, setIsClassFormOpen] = useState(false);
  const [classForm, setClassForm] = useState({
    className: '',
    section: '',
    academicYear: '2024',
    capacity: 30,
    description: ''
  });

  // Form states - Subjects
  const [isSubFormOpen, setIsSubFormOpen] = useState(false);
  const [subForm, setSubForm] = useState({
    subjectCode: '',
    subjectName: '',
    credits: 3,
    description: '',
    classId: ''
  });

  // Form states - Classrooms
  const [isRoomFormOpen, setIsRoomFormOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    building: '',
    capacity: 45,
    hasProjector: true,
    hasAc: false
  });

  // Form states - Assignments (Timetable Schedules)
  const [isSchedFormOpen, setIsSchedFormOpen] = useState(false);
  const [schedForm, setSchedForm] = useState({
    classroomId: '',
    classId: '',
    subjectId: '',
    staffId: '',
    dayOfWeek: 'MONDAY' as any,
    startTime: '09:00',
    endTime: '11:00',
    academicYear: '2024'
  });

  const headers = { Authorization: `Bearer ${token}` };

  const fetchClassroomStuff = async () => {
    setLoading(true);
    try {
      const rRes = await axios.get('/api/classrooms', { headers });
      const aRes = await axios.get('/api/classroom-assignments', { headers });
      setClassrooms(rRes.data);
      setAssignments(aRes.data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Error fetching classroom registries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClassroomStuff();
  }, [subTab]);

  // Handle Class Creation
  const handleClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.post('/api/classes', classForm, { headers });
      setSuccessMsg(`Cohort ${classForm.className} section ${classForm.section} instantiated`);
      setIsClassFormOpen(false);
      refreshData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Error compiling class index.");
    }
  };

  const handleClassDelete = async (id: number) => {
    if (!window.confirm("Proceeding will delete this Class cohort and strip subject registrations. Continue?")) return;
    try {
      await axios.delete(`/api/classes/${id}`, { headers });
      setSuccessMsg("Class cohort removed successfully");
      refreshData();
    } catch (err: any) {
      setErrorMsg("Error removing class");
    }
  };

  // Handle Subject Creation
  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.post('/api/subjects', {
        ...subForm,
        classId: subForm.classId ? parseInt(subForm.classId, 10) : null
      }, { headers });
      setSuccessMsg(`Subject ${subForm.subjectCode} - ${subForm.subjectName} registered`);
      setIsSubFormOpen(false);
      refreshData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Conflict setting subject code.");
    }
  };

  const handleSubDelete = async (id: number) => {
    if (!window.confirm("Delete this subject from the system? This removes all grade mappings.")) return;
    try {
      await axios.delete(`/api/subjects/${id}`, { headers });
      setSuccessMsg("Subject curriculum wiped");
      refreshData();
    } catch (err: any) {
      setErrorMsg("Failed to wipe subject");
    }
  };

  // Handle Classroom Creation
  const handleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.post('/api/classrooms', roomForm, { headers });
      setSuccessMsg(`Lounge/Lec-room ${roomForm.roomNumber} created`);
      setIsRoomFormOpen(false);
      fetchClassroomStuff();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Error recording room.");
    }
  };

  const handleRoomDelete = async (id: number) => {
    if (!window.confirm("Delete classroom? All planned schedules in this room will be scrubbed.")) return;
    try {
      await axios.delete(`/api/classrooms/${id}`, { headers });
      setSuccessMsg("Lec-room evicted");
      fetchClassroomStuff();
    } catch (err: any) {
      setErrorMsg("Error deleting lecture hall");
    }
  };

  // Handle Timetable Assignment
  const handleSchedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await axios.post('/api/classroom-assignments', schedForm, { headers });
      setSuccessMsg("Timetable lecture slot assigned successfully!");
      setIsSchedFormOpen(false);
      fetchClassroomStuff();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Overlapping schedule conflict detected!");
    }
  };

  const handleSchedDelete = async (id: number) => {
    if (!window.confirm("Unassign this lecture timetable code?")) return;
    try {
      await axios.delete(`/api/classroom-assignments/${id}`, { headers });
      setSuccessMsg("Timetable event removed");
      fetchClassroomStuff();
    } catch (err: any) {
      setErrorMsg("Error unlinking timetable slot");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-705">
      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium rounded-2xl flex items-center gap-2">
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

      {/* Segmented Sub Tabs Header */}
      <div className="flex border-b border-slate-200 gap-4 mb-2">
        <button
          onClick={() => setSubTab('classes_subjects')}
          className={`pb-3 text-sm font-display font-medium tracking-tight border-b-2 cursor-pointer transition-all duration-200 flex items-center gap-2 px-1 ${
            subTab === 'classes_subjects' 
              ? 'border-sky-500 text-sky-600 font-bold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers className="w-4.5 h-4.5" />
          Classes & Subject Modules
        </button>

        <button
          onClick={() => setSubTab('classrooms_scheduling')}
          className={`pb-3 text-sm font-display font-medium tracking-tight border-b-2 cursor-pointer transition-all duration-200 flex items-center gap-2 px-1 ${
            subTab === 'classrooms_scheduling' 
              ? 'border-sky-500 text-sky-600 font-bold' 
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-4.5 h-4.5" />
          Classrooms & Academic Schedules
        </button>
      </div>

      {subTab === 'classes_subjects' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* TAB 1 LEFT PANEL: Classes Roster */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-display font-black text-slate-800 text-md">Cohort Classes</h4>
                <p className="text-slate-400 text-xs text-[11px]">Academic year curriculum pathways</p>
              </div>
              <button
                onClick={() => {
                  setClassForm({ className: '', section: '', academicYear: '2024', capacity: 30, description: '' });
                  setIsClassFormOpen(true);
                }}
                className="bg-sky-50 hover:bg-sky-100/80 border border-sky-100 text-sky-600 text-[11px] font-semibold rounded-lg px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create Cohort
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {classes.length === 0 ? (
                <p className="text-slate-400 text-xs py-6 italic text-center">No cohorts instantiated.</p>
              ) : (
                classes.map((cls) => (
                  <div key={cls.id} className="py-3 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-slate-800 text-sm">{cls.className}</h5>
                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-500 border border-slate-250 px-1 rounded">
                          Sec {cls.section}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">Year: {cls.academicYear} • Max Cap: {cls.capacity} students</p>
                    </div>
                    <button
                      onClick={() => handleClassDelete(cls.id)}
                      className="p-1 hover:bg-rose-50 text-slate-350 hover:text-rose-500 rounded cursor-pointer"
                      title="Evacuate Class level"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TAB 1 RIGHT PANEL: Syllabus Subject Modules */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-display font-black text-slate-800 text-md">Course Subjects</h4>
                <p className="text-slate-400 text-xs text-[11px]">Credits units registered in core syllabus</p>
              </div>
              <button
                onClick={() => {
                  setSubForm({ subjectCode: '', subjectName: '', credits: 3, description: '', classId: classes[0]?.id?.toString() || '' });
                  setIsSubFormOpen(true);
                }}
                className="bg-sky-50 hover:bg-sky-100/80 border border-sky-100 text-sky-600 text-[11px] font-semibold rounded-lg px-3 py-1.5 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Create Course
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {subjects.length === 0 ? (
                <p className="text-slate-400 text-xs py-6 italic text-center">No course modules registered.</p>
              ) : (
                subjects.map((sub) => {
                  const correlatedClass = classes.find(c => c.id === sub.classId);
                  return (
                    <div key={sub.id} className="py-3.5 flex justify-between items-center">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                            {sub.subjectCode}
                          </span>
                          <h5 className="font-bold text-slate-800 text-sm leading-tight">{sub.subjectName}</h5>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Credits: <span className="font-bold text-slate-600 font-mono">{sub.credits} Units</span>
                          {correlatedClass && (
                            <>
                              <span className="text-slate-300 mx-1.5">|</span>
                              Cohort: <span className="font-semibold text-slate-600">{correlatedClass.className} (Sec {correlatedClass.section})</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleSubDelete(sub.id)}
                        className="p-1 hover:bg-rose-50 text-slate-350 hover:text-rose-500 rounded cursor-pointer"
                        title="Dismantle subject modules"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* TAB 2 LEFT PANEL: Placements / Lecture Room lists */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-h-[600px] overflow-y-auto">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-display font-bold text-slate-800 text-sm">Classroom Facilities</h4>
                <p className="text-slate-400 text-[10px]">Active building placements</p>
              </div>
              <button
                onClick={() => {
                  setRoomForm({ roomNumber: '', building: '', capacity: 45, hasProjector: true, hasAc: false });
                  setIsRoomFormOpen(true);
                }}
                className="text-sky-600 text-[11px] font-bold hover:underline cursor-pointer"
              >
                + Add Room
              </button>
            </div>

            <div className="space-y-3 pt-3">
              {classrooms.length === 0 ? (
                <p className="text-slate-400 text-xs py-6 italic text-center">No classrooms configured</p>
              ) : (
                classrooms.map(rm => (
                  <div key={rm.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl relative group">
                    <button
                      onClick={() => handleRoomDelete(rm.id)}
                      className="absolute right-3.5 top-3.5 p-1 rounded hover:bg-rose-50 text-slate-300 hover:text-rose-500 opacity-100 block cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                      <MapPin className="w-4.5 h-4.5 text-sky-500" />
                      <span>{rm.roomNumber}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] font-medium mt-1 uppercase font-mono">{rm.building} • Max cap: {rm.capacity} seats</p>
                    <div className="flex gap-2.5 mt-2.5">
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${
                        rm.hasProjector 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        <Tv className="w-2.5 h-2.5" /> Projector
                      </span>
                      <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${
                        rm.hasAc 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" 
                          : "bg-slate-100 text-slate-400 border-slate-200"
                      }`}>
                        <Wind className="w-2.5 h-2.5" /> A/C Cooling
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* TAB 2 RIGHT PANEL: Visual timetable calendar assignment */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-display font-black text-slate-800 text-md">Planned Course Schedules</h4>
                <p className="text-slate-400 text-xs text-[11px]">Timetables placement schedules to avoid teaching conflicts</p>
              </div>
              {classrooms.length > 0 && classes.length > 0 && subjects.length > 0 && (
                <button
                  onClick={() => {
                    setSchedForm({
                      classroomId: classrooms[0]?.id?.toString() || '',
                      classId: classes[0]?.id?.toString() || '',
                      subjectId: subjects[0]?.id?.toString() || '',
                      staffId: staffList[0]?.id?.toString() || '',
                      dayOfWeek: 'MONDAY',
                      startTime: '09:00',
                      endTime: '11:00',
                      academicYear: '2024'
                    });
                    setIsSchedFormOpen(true);
                  }}
                  className="bg-sky-50 hover:bg-sky-100/85 border border-sky-100 text-sky-600 text-[11px] font-semibold rounded-lg px-3.5 py-1.5 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Schedule Event Slot
                </button>
              )}
            </div>

            {assignments.length === 0 ? (
              <div className="p-12 border border-dashed rounded-2xl text-center text-slate-400">
                <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <h5 className="font-bold text-slate-700 text-sm">Empty Semester Schedule</h5>
                <p className="text-slate-400 text-xs mt-1">Configure classrooms and assign class schedules.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
                {assignments.map(ca => (
                  <div key={ca.id} className="p-4 bg-slate-50 border border-slate-150 rounded-xl hover:border-sky-300 hover:bg-white transition-all duration-150 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded tracking-wide">
                          {ca.roomDetails?.roomNumber || 'Room N/A'}
                        </span>
                        <h5 className="font-bold text-slate-800 text-sm">{ca.subjectDetails?.subjectName}</h5>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-semibold text-slate-700">Cohort: {ca.classDetails?.className} ({ca.classDetails?.section})</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 font-mono bg-sky-50 text-sky-700 px-1.5 rounded"><Clock className="w-3 h-3" /> {ca.dayOfWeek} {ca.startTime} - {ca.endTime}</span>
                        <span>•</span>
                        <span className="text-slate-400 italic">Lecturer: {ca.staffDetails}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSchedDelete(ca.id)}
                      className="sm:p-2 text-slate-300 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer text-sm font-semibold"
                      title="Deallocate schedule sequence"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE CLASS DIALOGUE */}
      {isClassFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl border max-w-sm w-full animate-slide-up overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-display font-medium text-slate-800 text-sm">Instantiate Course Class</h3>
              <button onClick={() => setIsClassFormOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleClassSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Class Code Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Science Undergraduate"
                  value={classForm.className}
                  onChange={(e) => setClassForm({ ...classForm, className: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Class Section</label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="e.g. A"
                    value={classForm.section}
                    onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs uppercase font-mono bg-white text-slate-705"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Academic Year</label>
                  <input
                    type="text"
                    required
                    value={classForm.academicYear}
                    onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-705"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Room capacity threshold</label>
                <input
                  type="number"
                  required
                  value={classForm.capacity}
                  onChange={(e) => setClassForm({ ...classForm, capacity: parseInt(e.target.value, 10) })}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                />
              </div>
              <div className="pt-4 border-t flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsClassFormOpen(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-600 cursor-pointer">Onboard</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE SUBJECT DIALOGUE */}
      {isSubFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl border max-w-sm w-full animate-slide-up overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-display font-medium text-slate-800 text-sm">Register Syllabus Course</h3>
              <button onClick={() => setIsSubFormOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSubSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Subject Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS103"
                    value={subForm.subjectCode}
                    onChange={(e) => setSubForm({ ...subForm, subjectCode: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs uppercase font-mono bg-white text-slate-705"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Subject Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Database Design"
                    value={subForm.subjectName}
                    onChange={(e) => setSubForm({ ...subForm, subjectName: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-705"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Syllabus Credits</label>
                  <input
                    type="number"
                    required
                    value={subForm.credits}
                    onChange={(e) => setSubForm({ ...subForm, credits: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-705"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Linked Class Cohort</label>
                  <select
                    value={subForm.classId}
                    onChange={(e) => setSubForm({ ...subForm, classId: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2 py-1.5 text-xs bg-white text-slate-500"
                  >
                    <option value="">-- No Class assignment --</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id.toString()}>{c.className} ({c.section})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsSubFormOpen(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-600 cursor-pointer">Deploy</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CLASSROOM FACILITY MODAL */}
      {isRoomFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl border max-w-sm w-full animate-slide-up overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-display font-medium text-slate-800 text-sm">Add Classroom Resource</h3>
              <button onClick={() => setIsRoomFormOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleRoomSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Room Designator</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. RM304"
                    value={roomForm.roomNumber}
                    onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs font-mono uppercase bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Max desk capacity</label>
                  <input
                    type="number"
                    required
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1 font-sans">Campus Building Block</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engineering & IT Pavilion"
                  value={roomForm.building}
                  onChange={(e) => setRoomForm({ ...roomForm, building: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs bg-white"
                />
              </div>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-655 font-sans">
                  <input
                    type="checkbox"
                    checked={roomForm.hasProjector}
                    onChange={(e) => setRoomForm({ ...roomForm, hasProjector: e.target.checked })}
                    className="w-4.5 h-4.5 accent-sky-500 rounded border-slate-300"
                  />
                  Has Digital Projector System
                </label>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-655 font-sans">
                  <input
                    type="checkbox"
                    checked={roomForm.hasAc}
                    onChange={(e) => setRoomForm({ ...roomForm, hasAc: e.target.checked })}
                    className="w-4.5 h-4.5 accent-sky-500 rounded border-slate-300"
                  />
                  Has Air Conditioning Climate checks
                </label>
              </div>
              <div className="pt-4 border-t flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsRoomFormOpen(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-600 cursor-pointer">Create Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE EVENT TIMETABLE DIALOGUE */}
      {isSchedFormOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-white rounded-3xl shadow-2xl border max-w-sm w-full animate-slide-up overflow-hidden">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50 text-slate-700">
              <h3 className="font-display font-medium text-slate-800 text-sm">Schedule Timetable Allocation</h3>
              <button onClick={() => setIsSchedFormOpen(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full w-8 h-8 flex items-center justify-center cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSchedSubmit} className="p-5 space-y-4 text-slate-700">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Target Classroom Lounge</label>
                <select
                  required
                  value={schedForm.classroomId}
                  onChange={(e) => setSchedForm({ ...schedForm, classroomId: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-slate-600 bg-white"
                >
                  <option value="">-- Choose Classroom --</option>
                  {classrooms.map(rm => (
                    <option key={rm.id} value={rm.id.toString()}>{rm.roomNumber} ({rm.building})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Select class Cohort Group</label>
                <select
                  required
                  value={schedForm.classId}
                  onChange={(e) => setSchedForm({ ...schedForm, classId: e.target.value })}
                  className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-slate-600 bg-white"
                >
                  <option value="">-- Choose Cohort --</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id.toString()}>{c.className} ({c.section})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Course Module</label>
                  <select
                    required
                    value={schedForm.subjectId}
                    onChange={(e) => setSchedForm({ ...schedForm, subjectId: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-slate-600 bg-white"
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map(sub => (
                      <option key={sub.id} value={sub.id.toString()}>{sub.subjectCode} - {sub.subjectName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Active Faculty Lecturer</label>
                  <select
                    required
                    value={schedForm.staffId}
                    onChange={(e) => setSchedForm({ ...schedForm, staffId: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-slate-600 bg-white"
                  >
                    <option value="">-- Choose Lecturer --</option>
                    {staffList.map(st => (
                      <option key={st.id} value={st.id.toString()}>{st.firstName} {st.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Day of Week</label>
                  <select
                    value={schedForm.dayOfWeek}
                    onChange={(e) => setSchedForm({ ...schedForm, dayOfWeek: e.target.value as any })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs text-slate-600 bg-white"
                  >
                    <option value="MONDAY">Monday</option>
                    <option value="TUESDAY">Tuesday</option>
                    <option value="WEDNESDAY">Wednesday</option>
                    <option value="THURSDAY">Thursday</option>
                    <option value="FRIDAY">Friday</option>
                    <option value="SATURDAY">Saturday</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Term Year</label>
                  <input
                    type="text"
                    required
                    value={schedForm.academicYear}
                    onChange={(e) => setSchedForm({ ...schedForm, academicYear: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-705"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={schedForm.startTime}
                    onChange={(e) => setSchedForm({ ...schedForm, startTime: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-705"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={schedForm.endTime}
                    onChange={(e) => setSchedForm({ ...schedForm, endTime: e.target.value })}
                    className="w-full bg-slate-50 border rounded-lg px-2.5 py-1.5 text-xs bg-white text-slate-705"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2.5">
                <button type="button" onClick={() => setIsSchedFormOpen(false)} className="px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-sky-500 text-white text-xs font-semibold rounded-lg hover:bg-sky-600 cursor-pointer">Commit Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
