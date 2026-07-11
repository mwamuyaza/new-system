import React from 'react';
import { 
  Gauge, 
  Users, 
  User, 
  BookOpen, 
  GraduationCap, 
  Calendar, 
  DollarSign, 
  FileText, 
  Activity, 
  LogOut,
  Award,
  Clock,
  Briefcase,
  ChevronRight,
  ClipboardCheck,
  Mail
} from 'lucide-react';
import { User as UserType } from '../types';

interface SidebarProps {
  user: UserType | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ user, activeTab, setActiveTab, onLogout }: SidebarProps) {
  if (!user || !user.role || !user.username) return null;

  const role = user.role;

  // Define sidebar navigation links per user role
  const getNavItems = () => {
    switch (role) {
      case 'ADMIN':
        return [
          { id: 'dashboard', name: 'Dashboard', icon: Gauge },
          { id: 'admissions', name: 'Admissions Desk', icon: ClipboardCheck },
          { id: 'user-management', name: 'User Management', icon: Users },
          { id: 'students', name: 'Students Directory', icon: GraduationCap },
          { id: 'staff', name: 'Faculty & Payroll', icon: Briefcase },
          { id: 'classes', name: 'Classes & Subjects', icon: BookOpen },
          { id: 'classrooms', name: 'Classrooms & Scheduling', icon: Calendar },
          { id: 'fees', name: 'Fee Collections', icon: DollarSign },
          { id: 'grades', name: 'Academic Marks', icon: Award },
          { id: 'reports', name: 'Reports Center', icon: FileText },
          { id: 'email-templates', name: 'Email Templates', icon: Mail },
          { id: 'logs', name: 'System Audits', icon: Activity },
        ];
      case 'STAFF':
        return [
          { id: 'dashboard', name: 'My Dashboard', icon: Gauge },
          { id: 'students', name: 'Student Admissions', icon: GraduationCap },
          { id: 'classes', name: 'Assigned Classes', icon: BookOpen },
          { id: 'grades', name: 'Student Grades', icon: Award },
          { id: 'attendance', name: 'Mark Attendance', icon: Clock },
          { id: 'salary', name: 'Salary Slips', icon: DollarSign },
          { id: 'profile', name: 'My Profile', icon: User },
        ];
      case 'STUDENT':
        return [
          { id: 'profile', name: 'My Profile', icon: User },
          { id: 'classes', name: 'My Classes & Subjects', icon: BookOpen },
          { id: 'grades', name: 'My Results', icon: Award },
          { id: 'fees', name: 'My Fees Ledger', icon: DollarSign },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shadow-xl relative z-10 font-sans">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center font-bold text-lg text-white">
          U
        </div>
        <h1 className="text-lg font-semibold tracking-tight text-white">University Hub</h1>
      </div>

      {/* User Badge Info */}
      <div className="p-4 border-b border-slate-800/60 bg-slate-950/20">
        <div className="flex items-center gap-3 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800/40">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-blue-400 text-xs shrink-0">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-200 truncate">{user.username}</p>
            <span className="inline-block text-[9px] font-mono font-semibold text-blue-400 uppercase tracking-wider">
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Space */}
      <nav className="flex-1 p-4 overflow-y-auto space-y-1">
        <div className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2 tracking-wider">
          Main Console
        </div>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left cursor-pointer group ${
                isActive 
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <IconComponent className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`} />
                <span>{item.name}</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'
              }`} />
            </button>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/30">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-slate-800 rounded-lg transition-colors text-left text-xs font-medium cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Exit Account</span>
        </button>
      </div>
    </div>
  );
}
