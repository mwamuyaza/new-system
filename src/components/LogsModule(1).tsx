import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Search, 
  Shield, 
  Clock, 
  Terminal, 
  RefreshCw 
} from 'lucide-react';
import axios from 'axios';
import { SystemLog } from '../types';

interface LogsModuleProps {
  token: string | null;
}

export default function LogsModule({ token }: LogsModuleProps) {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionStyle = (action: string) => {
    if (action.includes('CREATE') || action.includes('ENROLL')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (action.includes('DELETE') || action.includes('SUSPEND') || action.includes('REVOKE')) return 'bg-rose-50 text-rose-700 border-rose-100';
    if (action.includes('AUTH')) return 'bg-sky-50 text-sky-700 border-sky-100';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.username.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in font-sans text-slate-700">
      {/* Control Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by administrator username, action trigger, or description details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:bg-white text-slate-705"
          />
        </div>
        <button
          onClick={fetchLogs}
          className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-bold font-sans flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
        >
          <RefreshCw className="w-4 h-4" /> Reload trail
        </button>
      </div>

      {/* Log list */}
      <div className="bg-white border rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 bg-slate-50 border-b flex justify-between items-center text-xs font-semibold text-slate-400">
          <span className="flex items-center gap-2"><Terminal className="w-4.5 h-4.5 text-slate-500" /> SYSTEM CONSOLE TIMELINE (NEWEST FIRST)</span>
          <span className="font-mono uppercase">ADMIN PRIVILEGE CONTROL</span>
        </div>

        {loading ? (
          <p className="p-12 text-center text-slate-400 text-xs font-semibold">Tuning telemetry registers...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="p-12 text-center text-slate-400 text-xs italic">No matching telemetry logs collected.</p>
        ) : (
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {filteredLogs.map(l => (
              <div key={l.id} className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex gap-3 items-start md:items-center">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-xs">{l.username}</span>
                      <span className="text-[10px] font-mono bg-slate-150 text-slate-450 px-1 py-0.5 rounded uppercase font-semibold">
                        {l.role}
                      </span>
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${getActionStyle(l.action)}`}>
                        {l.action}
                      </span>
                    </div>
                    <p className="text-slate-600 font-sans text-xs mt-1">{l.details}</p>
                  </div>
                </div>

                <div className="text-[10px] font-mono font-semibold text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-300" />
                  {new Date(l.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
