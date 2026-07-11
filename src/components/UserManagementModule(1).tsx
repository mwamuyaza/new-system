import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  ShieldAlert, 
  Lock, 
  Unlock, 
  Mail, 
  RefreshCw, 
  Key, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import axios from 'axios';

interface UserAccount {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'STAFF' | 'STUDENT';
  isActive: boolean;
  createdAt: string;
}

interface UserManagementModuleProps {
  token: string | null;
}

export default function UserManagementModule({ token }: UserManagementModuleProps) {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugOtp, setDebugOtp] = useState<{ username: string; code: string } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.response?.data?.error || 'Failed to fetch user accounts directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleToggleLock = async (user: UserAccount) => {
    const isLocking = user.isActive;
    setActionInProgress(user.id);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const res = await axios.post(`/api/admin/users/${user.id}/lockout`, 
        { locked: isLocking },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(res.data.message || `Account for ${user.username} successfully updated.`);
      // Update local state
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !isLocking } : u));
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.response?.data?.error || `Failed to update lock status for ${user.username}.`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleTriggerReset = async (user: UserAccount) => {
    setActionInProgress(user.id);
    setSuccessMessage(null);
    setErrorMessage(null);
    setDebugOtp(null);
    try {
      const res = await axios.post(`/api/admin/users/${user.id}/reset-email`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage(res.data.message || `Reset code dispatched for ${user.username}.`);
      if (res.data._debugCode) {
        setDebugOtp({
          username: user.username,
          code: res.data._debugCode
        });
      }
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.response?.data?.error || `Failed to dispatch reset code for ${user.username}.`);
    } finally {
      setActionInProgress(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-700">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" /> Administrative User Directory & Security Controls
        </h3>
        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
          Monitor all registered student, faculty, and administrative system accounts. Trigger remote password reset dispatches, or temporarily lock out compromised accounts in response to active security incidents.
        </p>
      </div>

      {/* Success/Error Alerts */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800 leading-relaxed">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Operation Successful:</span> {successMessage}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 leading-relaxed">
          <ShieldAlert className="w-4.5 h-4.5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Operation Aborted:</span> {errorMessage}
          </div>
        </div>
      )}

      {/* Debug OTP Box */}
      {debugOtp && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 text-xs text-blue-800">
          <div className="flex items-start gap-2.5 leading-relaxed">
            <Key className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-sm">System Passcode Dispatched</span>
              The administrative reset OTP for user <strong className="font-semibold text-blue-900">{debugOtp.username}</strong> was securely logged. Code can be used on the reset portal.
            </div>
          </div>
          <div className="bg-blue-100/80 border border-blue-300 font-mono text-center text-xl font-bold py-2 px-6 rounded-lg select-all tracking-wider text-blue-900 shrink-0">
            {debugOtp.code}
          </div>
        </div>
      )}

      {/* Control Search bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search accounts by username, email, or role tier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Reload Accounts
        </button>
      </div>

      {/* Accounts Directory Grid / Table */}
      <div className="bg-white border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 bg-slate-50 border-b flex justify-between items-center text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-2 uppercase tracking-wider">
            <Users className="w-4.5 h-4.5 text-slate-500" /> Active System Logins
          </span>
          <span className="font-mono text-[10px] bg-slate-200 text-slate-600 px-2 py-1 rounded">
            TOTAL ACCOUNTS: {filteredUsers.length}
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs font-semibold">
            Querying administrative user table...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs italic">
            No matching registered login records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider font-semibold text-[10px]">
                  <th className="p-4 pl-6">ID</th>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Authorization Tier</th>
                  <th className="p-4">Status & Health</th>
                  <th className="p-4">Registered Date</th>
                  <th className="p-4 pr-6 text-right">Security Control Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map(u => {
                  const isLocked = !u.isActive;
                  const isSelf = u.id === users.find(x => x.username === 'admin')?.id; // Simple self protection checks
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="p-4 pl-6 font-mono text-slate-400 font-semibold">{u.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 text-sm">{u.username}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">{u.email}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${
                          u.role === 'ADMIN' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                            : u.role === 'STAFF' 
                              ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                              : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md font-bold text-[10px] border border-rose-100">
                            <Lock className="w-3 h-3" /> Suspended / Locked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-[10px] border border-emerald-100">
                            <Unlock className="w-3 h-3" /> Active / Unlocked
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'System Default'}
                      </td>
                      <td className="p-4 pr-6 text-right space-x-1.5">
                        <button
                          disabled={actionInProgress !== null}
                          onClick={() => handleTriggerReset(u)}
                          className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 hover:border-slate-300 font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50"
                          title="Generate reset code and dispatch authentication warning email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>Dispatch Reset</span>
                        </button>
                        
                        <button
                          disabled={actionInProgress !== null || isSelf}
                          onClick={() => handleToggleLock(u)}
                          className={`inline-flex items-center gap-1 font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer disabled:opacity-50 ${
                            isSelf 
                              ? 'bg-slate-100 text-slate-300 border border-slate-100 cursor-not-allowed'
                              : isLocked
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                          }`}
                          title={isSelf ? "Self-lockout safety disabled" : isLocked ? "Unlock user login permission" : "Lock user and suspend active sessions"}
                        >
                          {isLocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Authorize Access</span>
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Force Lockout</span>
                            </>
                          )}
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

      {/* Security Incident response tips */}
      <div className="bg-slate-100 border border-slate-200 p-5 rounded-2xl flex gap-3 text-xs text-slate-600">
        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-slate-800 block">Incident Handling Best Practices</span>
          <p className="leading-relaxed">
            In the event of active token leakage or brute force detection, administrators should immediately trigger a <strong>Force Lockout</strong> to terminate token validations across the Express reverse proxies. Dispatched codes expire on use, and full details are recorded inside the immutable audit trail system logs.
          </p>
        </div>
      </div>
    </div>
  );
}
