import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  UserCheck, 
  Mail, 
  Database, 
  RotateCcw, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  DollarSign, 
  CalendarCheck2, 
  FileSpreadsheet,
  X,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import { getDb, saveDb, resetDb, addLog, queueOutboxMessage } from '../lib/mockDb';
import { User as UserType } from '../types';

interface SandboxControlProps {
  currentUser: UserType | null;
  onUserSwitch: (user: any, token: string, profile: any) => void;
}

export default function SandboxControl({ currentUser, onUserSwitch }: SandboxControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'switch' | 'outbox' | 'db' | 'tools'>('switch');
  const [dbState, setDbState] = useState<any>(null);
  const [simulatedEmails, setSimulatedEmails] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isServer, setIsServer] = useState(false);

  const refreshState = async () => {
    try {
      const dbRes = await axios.get('/api/dev/db-state');
      setDbState(dbRes.data);
      setIsServer(true);
      
      const emailRes = await axios.get('/api/dev/simulated-emails');
      setSimulatedEmails(emailRes.data);
    } catch (err) {
      // Fallback to local browser mock DB
      const localDb = getDb();
      setDbState(localDb);
      setIsServer(false);
      
      const localOutbox = localDb.outbox || [];
      const mapped = localOutbox.map((msg: any) => ({
        id: msg.id,
        to: msg.to,
        subject: msg.subject,
        text: msg.body,
        html: msg.body,
        timestamp: msg.sentAt
      }));
      setSimulatedEmails(mapped);
    }
  };

  useEffect(() => {
    refreshState();
    // Poll every 3 seconds to keep email inbox, audit logs, and status updates dynamically in sync
    const interval = setInterval(refreshState, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleQuickSwitch = async (role: 'ADMIN' | 'STAFF' | 'STUDENT', username: string) => {
    try {
      const res = await axios.post('/api/dev/quick-switch', { username, role });
      const { token, user, profile } = res.data;
      
      // Save to session/local storage
      sessionStorage.setItem('uni_hub_token', token);
      sessionStorage.setItem('uni_hub_user', JSON.stringify(user));
      if (profile) {
        sessionStorage.setItem('uni_hub_profile', JSON.stringify(profile));
      } else {
        sessionStorage.removeItem('uni_hub_profile');
      }

      onUserSwitch(user, token, profile);
      refreshState();
    } catch (err) {
      // Fallback to local client simulation
      const db = getDb();
      const user = db.users.find((u: any) => u.username === username);
      if (!user) return;

      let profile = null;
      if (role === 'STUDENT') {
        profile = db.students.find((s: any) => s.userId === user.id) || null;
      } else if (role === 'STAFF') {
        profile = db.staff.find((s: any) => s.userId === user.id) || null;
      }

      const token = `mock_token_${user.id}`;
      
      sessionStorage.setItem('uni_hub_token', token);
      sessionStorage.setItem('uni_hub_user', JSON.stringify(user));
      if (profile) {
        sessionStorage.setItem('uni_hub_profile', JSON.stringify(profile));
      } else {
        sessionStorage.removeItem('uni_hub_profile');
      }

      onUserSwitch(user, token, profile);
      addLog(user.id, user.username, user.role, 'SANDBOX_QUICK_SWITCH', `Developer quick-switched profile view to ${user.username} (${role})`);
      refreshState();
    }
  };

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset the database back to original defaults? All local/server modifications will be wiped.')) {
      try {
        await axios.post('/api/dev/reset-db');
        alert('Database reset successful!');
        window.location.reload();
      } catch (err) {
        const fresh = resetDb();
        setDbState(fresh);
        alert('Local DB reset successful!');
        window.location.reload();
      }
    }
  };

  const handleAutoPayFees = async () => {
    try {
      const res = await axios.post('/api/dev/auto-pay-fees');
      alert(res.data.message);
      refreshState();
    } catch (err) {
      const db = getDb();
      let count = 0;
      db.students.forEach((student: any) => {
        const enrollment = db.studentEnrollments.find((e: any) => e.studentId === student.id && e.status === 'ACTIVE');
        if (enrollment) {
          const feeStructure = db.feeStructures.find((f: any) => f.classId === enrollment.classId);
          if (feeStructure) {
            const paid = db.feePayments
              .filter((p: any) => p.studentId === student.id)
              .reduce((sum: number, p: any) => sum + p.amountPaid, 0);
            const outstanding = feeStructure.totalFees - paid;
            if (outstanding > 0) {
              db.feePayments.push({
                id: db.nextId.feePayments++,
                studentId: student.id,
                amountPaid: outstanding,
                paymentDate: new Date().toISOString().split('T')[0],
                paymentMethod: 'MPESA',
                transactionId: `TXN_SAND_${Math.floor(1000000 + Math.random() * 9000000)}`,
                receiptNo: `REC-SAND-${db.nextId.feePayments}`,
                remarks: 'Bulk auto-paid via Sandbox Simulator panel',
                academicYear: '2024'
              });
              count++;
            }
          }
        }
      });

      if (count > 0) {
        saveDb(db);
        addLog(1, 'admin', 'ADMIN', 'SANDBOX_BULK_FEE_PAYMENT', `Sandbox automated script paid remaining outstanding tuition fees for ${count} active students.`);
        alert(`Successfully automated full tuition payouts for ${count} students!`);
        refreshState();
      } else {
        alert('All students are already fully paid!');
      }
    }
  };

  const handleMarkAllAttendance = async () => {
    try {
      const res = await axios.post('/api/dev/mark-all-attendance');
      alert(res.data.message);
      refreshState();
    } catch (err) {
      const db = getDb();
      const today = new Date().toISOString().split('T')[0];
      let count = 0;

      db.studentEnrollments.forEach((enroll: any) => {
        const subs = db.subjects.filter((s: any) => s.classId === enroll.classId);
        subs.forEach((sub: any) => {
          const existing = db.attendance.find((a: any) => a.studentId === enroll.studentId && a.subjectId === sub.id && a.date === today);
          if (!existing) {
            db.attendance.push({
              id: db.nextId.attendance++,
              studentId: enroll.studentId,
              subjectId: sub.id,
              date: today,
              status: 'PRESENT'
            });
            count++;
          }
        });
      });

      if (count > 0) {
        saveDb(db);
        addLog(1, 'admin', 'ADMIN', 'SANDBOX_BULK_ATTENDANCE', `Sandbox automated script recorded PRESENT attendance for ${count} student-subject sessions today.`);
        alert(`Successfully recorded present attendance for ${count} student sessions!`);
        refreshState();
      } else {
        alert('Attendance for all student sessions today is already completed.');
      }
    }
  };

  // Map simulated emails to virtual outbox schema
  const serverOutbox = (simulatedEmails || []).map((email, idx) => {
    const otpMatch = email.text?.match(/\b\d{6}\b/) || email.html?.match(/\b\d{6}\b/);
    const code = otpMatch ? otpMatch[0] : undefined;
    return {
      id: email.id || `msg-${idx}`,
      to: email.to,
      subject: email.subject,
      body: email.text || email.html || '',
      sentAt: email.timestamp || new Date().toISOString(),
      code: code
    };
  });

  const renderDbState = dbState || { users: [], students: [], staff: [], classes: [], subjects: [], studentEnrollments: [], feePayments: [], salaryPayments: [], grades: [], attendance: [], logs: [] };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-2xl border border-slate-700 transition-transform hover:scale-105 duration-200 cursor-pointer"
        >
          <Terminal className="w-5 h-5 text-sky-400 animate-pulse" />
          <span className="text-xs font-bold tracking-tight">Open Sandbox Console</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>
      )}

      {/* Main Console Panel */}
      {isOpen && (
        <div className="w-[450px] bg-slate-900 rounded-2xl shadow-3xl border border-slate-800 flex flex-col max-h-[550px] overflow-hidden text-slate-300">
          
          {/* Header */}
          <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Simulated Sandbox Environment</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={handleReset}
                title="Wipe & Reset Mock Database"
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Nav Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/40 p-1">
            <button
              onClick={() => setActiveTab('switch')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                activeTab === 'switch' ? 'bg-slate-850 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Quick Login
            </button>
            <button
              onClick={() => setActiveTab('outbox')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-colors relative cursor-pointer ${
                activeTab === 'outbox' ? 'bg-slate-850 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SMS & Mail OTPs
              {serverOutbox.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 px-1 py-0.5 bg-sky-500 text-[8px] text-white rounded-full font-bold">
                  {serverOutbox.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('db')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                activeTab === 'db' ? 'bg-slate-850 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Database Explorer
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded transition-colors cursor-pointer ${
                activeTab === 'tools' ? 'bg-slate-850 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sim Tools
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[380px]">
            
            {/* TAB: QUICK SWITCH */}
            {activeTab === 'switch' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Bypass the security wall instantly by switching perspectives. This overrides local session state directly:
                </p>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Institutional Registrar (Admin)</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Full write access to classes, finances, and faculty accounts</p>
                    </div>
                    <button
                      onClick={() => handleQuickSwitch('ADMIN', 'admin')}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold rounded cursor-pointer"
                    >
                      Assume Role
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">John Doe (Faculty/Lecturer)</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Manages grades, attendance, and assessment submissions</p>
                    </div>
                    <button
                      onClick={() => handleQuickSwitch('STAFF', 'john.staff')}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold rounded cursor-pointer"
                    >
                      Assume Role
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">Jane Smith (Enrolled Student)</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Views results, files homework, and reviews tuition invoices</p>
                    </div>
                    <button
                      onClick={() => handleQuickSwitch('STUDENT', 'jane.student')}
                      className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold rounded cursor-pointer"
                    >
                      Assume Role
                    </button>
                  </div>
                </div>

                {currentUser && (
                  <div className="pt-2 border-t border-slate-800">
                    <p className="text-[10px] text-slate-500">Currently browsing as:</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-bold text-white">{currentUser.username}</span>
                      <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 border border-slate-700 text-slate-400 font-mono rounded">
                        {currentUser.role}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: VIRTUAL OUTBOX */}
            {activeTab === 'outbox' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  SMS and emails generated during registration or security audits are captured below. Use these codes to complete the signup steps!
                </p>

                {serverOutbox.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 border border-dashed border-slate-850 rounded-xl">
                    <Mail className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500">No outgoing logs yet. Try signing up a new user!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {serverOutbox.map((msg) => (
                      <div key={msg.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5 relative">
                        <span className="absolute top-2 right-2 text-[8px] text-slate-500 font-mono">
                          {new Date(msg.sentAt).toLocaleTimeString()}
                        </span>
                        <div>
                          <p className="text-[10px] text-sky-400 font-mono">To: {msg.to}</p>
                          <p className="text-xs font-bold text-white mt-0.5">{msg.subject}</p>
                        </div>
                        <p className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded whitespace-pre-wrap font-mono border border-slate-850">
                          {msg.body}
                        </p>
                        {msg.code && (
                          <div className="flex items-center justify-between bg-sky-950/40 p-1.5 rounded border border-sky-900/30">
                            <span className="text-[10px] text-sky-300 font-mono">Verification Code: <strong className="text-white font-bold">{msg.code}</strong></span>
                            <button
                              onClick={() => triggerCopy(msg.code!, msg.id)}
                              className="text-[9px] px-1.5 py-0.5 bg-sky-900/40 hover:bg-sky-800/40 text-sky-300 rounded flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              {copiedId === msg.id ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: DB EXPLORER */}
            {activeTab === 'db' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                  >
                    <option value="users">Users ({renderDbState.users.length})</option>
                    <option value="students">Students ({renderDbState.students.length})</option>
                    <option value="staff">Faculty ({renderDbState.staff.length})</option>
                    <option value="classes">Classes ({renderDbState.classes.length})</option>
                    <option value="subjects">Subjects ({renderDbState.subjects.length})</option>
                    <option value="studentEnrollments">Enrollments ({renderDbState.studentEnrollments.length})</option>
                    <option value="classroomAssignments">Schedules ({renderDbState.classroomAssignments?.length || 0})</option>
                    <option value="feePayments">Fee Payments ({renderDbState.feePayments.length})</option>
                    <option value="salaryPayments">Salary Payments ({renderDbState.salaryPayments.length})</option>
                    <option value="grades">Academic Grades ({renderDbState.grades.length})</option>
                    <option value="attendance">Attendance Records ({renderDbState.attendance.length})</option>
                    <option value="logs">Audit Logs ({renderDbState.logs.length})</option>
                  </select>
                </div>

                <div className="bg-slate-950 rounded-xl border border-slate-800 p-2 max-h-[220px] overflow-auto">
                  <pre className="text-[10px] text-slate-400 font-mono whitespace-pre overflow-x-auto leading-relaxed">
                    {JSON.stringify(renderDbState[selectedTable as keyof typeof renderDbState], null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* TAB: TOOLS */}
            {activeTab === 'tools' && (
              <div className="space-y-3">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Automate standard workflows to populate the dashboard metrics or complete system procedures in bulk:
                </p>

                <div className="space-y-2.5">
                  <button
                    onClick={handleAutoPayFees}
                    className="w-full flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-950 hover:border-slate-700 transition-colors rounded-xl border border-slate-800 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-emerald-950/60 rounded border border-emerald-900/40 text-emerald-400">
                        <DollarSign className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Auto-Pay Remaining Student Fees</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Clears all outstanding balances and records invoices as PAID</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleMarkAllAttendance}
                    className="w-full flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-950 hover:border-slate-700 transition-colors rounded-xl border border-slate-800 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-sky-950/60 rounded border border-sky-900/40 text-sky-400">
                        <CalendarCheck2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Record Present Attendance for Today</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Automates daily attendance roll calls for active course catalogs</p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={handleReset}
                    className="w-full flex items-center justify-between p-3 bg-rose-950/20 hover:bg-rose-950/40 hover:border-rose-900/55 transition-colors rounded-xl border border-rose-950/40 text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 bg-rose-950/50 rounded border border-rose-900/40 text-rose-400">
                        <RotateCcw className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white text-rose-300">Wipe Database & Seed Default Data</p>
                        <p className="text-[10px] text-rose-500/80 mt-0.5">Hard reset back to a clean default state</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Footer Bar */}
          <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between font-mono">
            <span>Mode: {isServer ? 'MERN Fullstack Backend' : 'Browser Local Simulation'}</span>
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <span className={`w-1.5 h-1.5 rounded-full ${isServer ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              {isServer ? 'MERN Live State' : 'Transient Mock DB'}
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
