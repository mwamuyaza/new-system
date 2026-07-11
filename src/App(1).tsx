import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Lock, 
  User, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  AlertCircle,
  UserPlus,
  Key,
  ArrowLeft,
  BookOpen,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';
import axios from 'axios';
import { User as UserType, Class, Subject, Staff } from './types';
import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import StudentModule from './components/StudentModule';
import StaffModule from './components/StaffModule';
import AcademicsModule from './components/AcademicsModule';
import GradesModule from './components/GradesModule';
import AttendanceModule from './components/AttendanceModule';
import FinanceModule from './components/FinanceModule';
import LogsModule from './components/LogsModule';
import ReportsModule from './components/ReportsModule';
import UserManagementModule from './components/UserManagementModule';
import StudentMyCourses from './components/StudentMyCourses';
import StaffMyCourses from './components/StaffMyCourses';
import StaffSettings from './components/StaffSettings';
import AdmissionsModule from './components/AdmissionsModule';
import EmailTemplateEditorModule from './components/EmailTemplateEditorModule';
import StudentFeesPortal from './components/StudentFeesPortal';

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Finance module helper
  const [financeActiveStudent, setFinanceActiveStudent] = useState<number | null>(null);

  // Authentication Fields
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loginError, setLoginError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Authentication mode ('login' | 'signup' | 'forgot' | 'verify')
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'verify'>('login');

  // Email verification screen states
  const [verificationUsername, setVerificationUsername] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [debugOtpCode, setDebugOtpCode] = useState(''); // useful for mock/sandbox testing in web UI
  const [verificationMessage, setVerificationMessage] = useState('');

  // Registration Fields
  const [signUpRole, setSignUpRole] = useState<'STUDENT' | 'STAFF'>('STUDENT');
  const [regUsername, setRegUsername] = useState('');
  const [regStudentId, setRegStudentId] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regClassId, setRegClassId] = useState('1'); // default selection is 1 (Computer Science)
  const [regDob, setRegDob] = useState('2004-05-14');
  const [regGender, setRegGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [regPhone, setRegPhone] = useState('');
  const [regAddress, setRegAddress] = useState('');

  // Lecturer-specific signup states
  const [regPosition, setRegPosition] = useState('Lecturer');
  const [regDepartment, setRegDepartment] = useState('Computer Science');
  const [regQualification, setRegQualification] = useState('M.Sc.');

  // Password Reset fields
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  
  // Dynamic OTP Code verification steps
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [sentCode, setSentCode] = useState('');
  const [userInputCode, setUserInputCode] = useState('');

  // Password visibility states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);

  // Associated user/student profile linking
  const [profile, setProfile] = useState<any>(null);
  const [showTermsModal, setShowTermsModal] = useState<'none' | 'terms' | 'privacy' | 'directives'>('none');

  // Synchronise token on mount with robust safety validation
  useEffect(() => {
    const cachedToken = localStorage.getItem('uni_hub_token') || sessionStorage.getItem('uni_hub_token');
    const cachedUser = localStorage.getItem('uni_hub_user') || sessionStorage.getItem('uni_hub_user');
    const cachedProfile = localStorage.getItem('uni_hub_profile') || sessionStorage.getItem('uni_hub_profile');
    if (cachedToken && cachedUser) {
      try {
        const parsed = JSON.parse(cachedUser);
        // Ensure the restored user object is fully structural and valid
        if (parsed && typeof parsed === 'object' && parsed.role && parsed.username) {
          setToken(cachedToken);
          setUser(parsed);
          if (cachedProfile) {
            setProfile(JSON.parse(cachedProfile));
          }
          setActiveTab(parsed.role === 'STUDENT' ? 'classes' : 'dashboard');
        } else {
          // If the cached item is from a different app or is invalid, wipe it
          localStorage.removeItem('uni_hub_token');
          localStorage.removeItem('uni_hub_user');
          localStorage.removeItem('uni_hub_profile');
          sessionStorage.removeItem('uni_hub_token');
          sessionStorage.removeItem('uni_hub_user');
          sessionStorage.removeItem('uni_hub_profile');
        }
      } catch (err) {
        // Safe fallback in case of JSON parse errors
        localStorage.removeItem('uni_hub_token');
        localStorage.removeItem('uni_hub_user');
        localStorage.removeItem('uni_hub_profile');
        sessionStorage.removeItem('uni_hub_token');
        sessionStorage.removeItem('uni_hub_user');
        sessionStorage.removeItem('uni_hub_profile');
      }
    }
    setCheckingAuth(false);
  }, []);

  // Globally intercept 401 Unauthorized errors (e.g. session expired due to inactivity)
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('uni_hub_token');
          localStorage.removeItem('uni_hub_user');
          localStorage.removeItem('uni_hub_profile');
          sessionStorage.removeItem('uni_hub_token');
          sessionStorage.removeItem('uni_hub_user');
          sessionStorage.removeItem('uni_hub_profile');
          setToken(null);
          setUser(null);
          setProfile(null);
          setLoginError(error.response.data?.error || "Your session has expired. Please login again.");
        }
        return Promise.reject(error);
      }
    );
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await axios.post('/api/auth/login', { username, password, rememberMe });
      const { token: userToken, user: userData, profile: userProfile } = res.data;
      
      const storage = rememberMe ? localStorage : sessionStorage;
      const otherStorage = rememberMe ? sessionStorage : localStorage;
      
      otherStorage.removeItem('uni_hub_token');
      otherStorage.removeItem('uni_hub_user');
      otherStorage.removeItem('uni_hub_profile');

      storage.setItem('uni_hub_token', userToken);
      storage.setItem('uni_hub_user', JSON.stringify(userData));
      if (userProfile) {
        storage.setItem('uni_hub_profile', JSON.stringify(userProfile));
        setProfile(userProfile);
      } else {
        storage.removeItem('uni_hub_profile');
        setProfile(null);
      }
      
      setToken(userToken);
      setUser(userData);
      
      // Navigate to correct base tab
      if (userData.role === 'STUDENT') {
        setActiveTab('classes');
      } else {
        setActiveTab('dashboard');
      }
    } catch (err: any) {
      if (err.response?.data?.error === "ACCOUNT_UNVERIFIED") {
        setVerificationUsername(err.response.data.username || username);
        setVerificationEmail(err.response.data.email || '');
        if (err.response.data._debugCode) {
          setDebugOtpCode(err.response.data._debugCode);
        }
        setAuthMode('verify');
        setLoginError("Your email is not verified yet. Please enter the physical/simulated code sent to your inbox to activate your profile.");
        return;
      }
      setLoginError(err.response?.data?.error || "Invalid username or password credentials");
    }
  };

  const handleQuickLogin = (uname: string, pword: string) => {
    setUsername(uname);
    setPassword(pword);
    setTimeout(async () => {
      setLoginError('');
      try {
        const res = await axios.post('/api/auth/login', { username: uname, password: pword });
        const { token: userToken, user: userData, profile: userProfile } = res.data;
        
        localStorage.setItem('uni_hub_token', userToken);
        localStorage.setItem('uni_hub_user', JSON.stringify(userData));
        if (userProfile) {
          localStorage.setItem('uni_hub_profile', JSON.stringify(userProfile));
          setProfile(userProfile);
        } else {
          localStorage.removeItem('uni_hub_profile');
          setProfile(null);
        }
        
        setToken(userToken);
        setUser(userData);
        setActiveTab(userData.role === 'STUDENT' ? 'classes' : 'dashboard');
        setLoginError('');
      } catch (err: any) {
        setLoginError(err.response?.data?.error || "Quick login failed.");
      }
    }, 100);
  };

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 10) {
      return "Security Policy Violation: Password must be at least 10 characters long.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Security Policy Violation: Password must contain at least one uppercase letter (A-Z).";
    }
    if (!/[0-9]/.test(pwd)) {
      return "Security Policy Violation: Password must contain at least one digit (0-9).";
    }
    if (!/[^A-Za-z0-9]/.test(pwd)) {
      return "Security Policy Violation: Password must contain at least one special character (e.g. @, #, $, %, etc.).";
    }
    return null;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (signUpRole === 'STUDENT') {
      const pwdError = validatePassword(regPassword);
      if (pwdError) {
        setLoginError(pwdError);
        return;
      }
    }

    try {
      if (signUpRole === 'STAFF') {
        const res = await axios.post('/api/auth/signup-staff', {
          email: regEmail,
          firstName: regFirstName,
          lastName: regLastName,
          position: regPosition,
          department: regDepartment,
          qualification: regQualification,
          phone: regPhone,
          address: regAddress
        });

        if (res.data.needsVerification) {
          setVerificationUsername(res.data.username);
          setVerificationEmail(res.data.email);
          if (res.data._debugCode) {
            setDebugOtpCode(res.data._debugCode);
          }
          setAuthMode('verify');
          setForgotSuccess(`🚀 Registration successful! Enter the 6-digit verification code sent to ${res.data.email} to verify your profile.`);
          return;
        }

        const { token: userToken, user: userData, profile: staffProfile } = res.data;
        localStorage.setItem('uni_hub_token', userToken);
        localStorage.setItem('uni_hub_user', JSON.stringify(userData));
        if (staffProfile) {
          localStorage.setItem('uni_hub_profile', JSON.stringify(staffProfile));
          setProfile(staffProfile);
        }

        setToken(userToken);
        setUser(userData);
        setActiveTab('dashboard');
        setAuthMode('login'); // Reset mode state
      } else {
        const res = await axios.post('/api/auth/signup', {
          studentId: regStudentId,
          password: regPassword,
          email: regEmail
        });

        if (res.data.needsVerification) {
          setVerificationUsername(res.data.username);
          setVerificationEmail(res.data.email);
          if (res.data._debugCode) {
            setDebugOtpCode(res.data._debugCode);
          }
          setAuthMode('verify');
          setForgotSuccess(`🚀 Onboarding verification initiated! Please enter the 6-digit verification code sent to your registered email ${res.data.email} to unlock access.`);
          return;
        }

        const { token: userToken, user: userData, profile: studentProfile } = res.data;
        localStorage.setItem('uni_hub_token', userToken);
        localStorage.setItem('uni_hub_user', JSON.stringify(userData));
        if (studentProfile) {
          localStorage.setItem('uni_hub_profile', JSON.stringify(studentProfile));
          setProfile(studentProfile);
        }

        setToken(userToken);
        setUser(userData);
        setActiveTab('classes');
        setAuthMode('login'); // Reset mode state
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.error || "Registration failed. Ensure all values are correctly completed.");
    }
  };

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setForgotSuccess('');
    try {
      const res = await axios.post('/api/auth/verify', {
        username: verificationUsername,
        code: verificationCode
      });
      const { token: userToken, user: userData, profile: userProfile } = res.data;
      
      localStorage.setItem('uni_hub_token', userToken);
      localStorage.setItem('uni_hub_user', JSON.stringify(userData));
      if (userProfile) {
        localStorage.setItem('uni_hub_profile', JSON.stringify(userProfile));
        setProfile(userProfile);
      } else {
        localStorage.removeItem('uni_hub_profile');
        setProfile(null);
      }
      
      setToken(userToken);
      setUser(userData);
      
      // Navigate to correct base tab
      if (userData.role === 'STUDENT') {
        setActiveTab('classes');
      } else {
        setActiveTab('dashboard');
      }
      setVerificationCode('');
      setDebugOtpCode('');
      setAuthMode('login'); // Reset authMode
    } catch (err: any) {
      setLoginError(err.response?.data?.error || "Invalid verification code. Please try again.");
    }
  };

  const handleResendCode = async () => {
    setLoginError('');
    setForgotSuccess('');
    try {
      const res = await axios.post('/api/auth/resend-code', {
        username: verificationUsername
      });
      setForgotSuccess("📬 A fresh verification code has been dispatched to your email address!");
      if (res.data._debugCode) {
        setDebugOtpCode(res.data._debugCode);
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.error || "Failed to resend code.");
    }
  };

  const handleSendRecoveryCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setForgotSuccess('');

    if (!forgotEmail) {
      setLoginError("Please provide your registered email address.");
      return;
    }

    try {
      const res = await axios.post('/api/auth/forgot-password-request', {
        email: forgotEmail
      });
      // Prefill recovered username in the background
      if (res.data.username) {
        setForgotUsername(res.data.username);
      }
      // Set OTP locally under sentCode if returned for debug preview fallback
      setSentCode(res.data._debugCode || 'SERVER_VERIFIED');
      setResetStep('verify');
      setForgotSuccess(`📬 Real verification code sent to ${forgotEmail}. Please check your email inbox!`);
    } catch (err: any) {
      setLoginError(err.response?.data?.error || "Failed to dispatch recovery request.");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setForgotSuccess('');

    const pwdError = validatePassword(forgotNewPassword);
    if (pwdError) {
      setLoginError(pwdError);
      return;
    }

    try {
      const res = await axios.post('/api/auth/forgot-password', {
        username: forgotUsername,
        email: forgotEmail,
        code: userInputCode,
        newPassword: forgotNewPassword
      });
      setForgotSuccess("Your passcode has been successfully recalibrated! Redirecting you to login...");
      setTimeout(() => {
        setAuthMode('login');
        setUsername(forgotUsername);
        setPassword(forgotNewPassword);
        setForgotSuccess('');
        setResetStep('request');
        setUserInputCode('');
        setSentCode('');
      }, 3000);
    } catch (err: any) {
      setLoginError(err.response?.data?.error || "Failed to update security credentials.");
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await axios.post('/api/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (e) {
        console.warn("Failed to notify backend of logout", e);
      }
    }
    localStorage.removeItem('uni_hub_token');
    localStorage.removeItem('uni_hub_user');
    localStorage.removeItem('uni_hub_profile');
    sessionStorage.removeItem('uni_hub_token');
    sessionStorage.removeItem('sessionStorage_user'); // just in case
    sessionStorage.removeItem('uni_hub_user');
    sessionStorage.removeItem('uni_hub_profile');
    setToken(null);
    setUser(null);
    setProfile(null);
    setActiveTab('dashboard');
  };

  const handleSandboxUserSwitch = (newUser: any, newToken: string, newProfile: any) => {
    setToken(newToken);
    setUser(newUser);
    setProfile(newProfile);
    setActiveTab(newUser.role === 'STUDENT' ? 'classes' : 'dashboard');
    setLoginError('');
  };

  // Synchronise dashboard stats
  const fetchDashboardStats = async () => {
    if (!token) return;
    if (user?.role === 'STUDENT') {
      setDashboardStats(null);
      return;
    }
    setStatsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      let url = '/api/dashboard/stats';
      const params: string[] = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const res = await axios.get(url, { headers });
      setDashboardStats(res.data);
    } catch (e) {
      console.error("Failed to load metrics", e);
    } finally {
      setStatsLoading(false);
    }
  };

  // Synchronize student status and profiles
  const fetchProfileStatus = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get('/api/auth/me', { headers });
      if (res.data?.profile) {
        setProfile(res.data.profile);
        localStorage.setItem('uni_hub_profile', JSON.stringify(res.data.profile));
      }
    } catch (e) {
      console.error("Failed to fetch profile status sync", e);
    }
  };

  // Synchronize general academic cohorts info
  const fetchAcadData = async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (user?.role === 'STUDENT') {
        const [cRes, sRes] = await axios.all([
          axios.get('/api/classes', { headers }),
          axios.get('/api/subjects', { headers })
        ]);
        setClasses(cRes.data);
        setSubjects(sRes.data);
        setStaffList([]);
      } else {
        const [cRes, sRes, fRes] = await axios.all([
          axios.get('/api/classes', { headers }),
          axios.get('/api/subjects', { headers }),
          axios.get('/api/staff', { headers })
        ]);
        setClasses(cRes.data);
        setSubjects(sRes.data);
        setStaffList(fRes.data);
      }
    } catch (e) {
      console.error("Failed to fetch general system variables", e);
    }
  };

  useEffect(() => {
    if (token) {
      fetchAcadData();
      fetchDashboardStats();
      fetchProfileStatus();
    }
  }, [token, activeTab, startDate, endDate, user]);

  // Handler to route student from directory to ledger bills directly
  const handleSelectStudentFeesForBilling = (studentId: number) => {
    setFinanceActiveStudent(studentId);
    setActiveTab('fees');
  };

  const renderPasswordCriteria = (pwd: string) => {
    if (!pwd) return null;
    const isMinLen = pwd.length >= 10;
    const hasUpper = /[A-Z]/.test(pwd);
    const hasDigit = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);

    const itemClass = (satisfied: boolean) => 
      `flex items-center gap-1.5 text-[10px] font-medium transition-colors ${
        satisfied ? 'text-emerald-600 font-bold' : 'text-slate-400'
      }`;

    return (
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 transition-all">
        <div className={itemClass(isMinLen)}>
          <span className="text-xs">{isMinLen ? '✓' : '•'}</span>
          <span>Min 10 Characters</span>
        </div>
        <div className={itemClass(hasUpper)}>
          <span className="text-xs">{hasUpper ? '✓' : '•'}</span>
          <span>1 Uppercase (A-Z)</span>
        </div>
        <div className={itemClass(hasDigit)}>
          <span className="text-xs">{hasDigit ? '✓' : '•'}</span>
          <span>1 Number (0-9)</span>
        </div>
        <div className={itemClass(hasSpecial)}>
          <span className="text-xs">{hasSpecial ? '✓' : '•'}</span>
          <span>1 Special Char</span>
        </div>
      </div>
    );
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs text-slate-500 mt-3 font-medium">Authorizing system indices...</span>
      </div>
    );
  }

  // LOGIN SCREEN
  if (!token || !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans antialiased text-slate-800">
        <div className={`w-full bg-white rounded-xl border border-slate-200 shadow-md p-8 relative overflow-hidden transition-all duration-300 ${authMode === 'signup' ? 'max-w-2xl' : 'max-w-md'}`}>
          
          {/* Header */}
          <div className="text-center space-y-2 z-10 relative mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">University Hub</h2>
              <span className="text-[10px] font-mono text-blue-600 font-bold tracking-widest uppercase block mt-1">Management Portal</span>
            </div>
          </div>

          {/* MODE SELECTOR */}
          <div className="flex border-b border-slate-200 mb-6">
            <button 
              onClick={() => { setAuthMode('login'); setLoginError(''); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${authMode === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => { setAuthMode('signup'); setLoginError(''); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${authMode === 'signup' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Sign Up / Onboard
            </button>
            <button 
              onClick={() => { setAuthMode('forgot'); setLoginError(''); }}
              className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${authMode === 'forgot' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
            >
              Recover Key
            </button>
          </div>

          {loginError && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {forgotSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{forgotSuccess}</span>
            </div>
          )}

          {/* VIEW RENDERINGS */}

          {authMode === 'login' && (
            <div className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500/20 text-slate-800 transition-all"
                      placeholder="e.g. admin or john.staff"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-10 py-2.5 text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500/20 text-slate-800 transition-all font-medium"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden rounded cursor-pointer transition-colors"
                      title={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center py-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="remember-me-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500/20 focus:outline-hidden cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-600 hover:text-slate-800">Remember Me</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 text-xs flex justify-center items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enter University Hub</span>
                </button>
              </form>

              {/* Quick-Test Access Portal Card */}
              <div className="pt-5 border-t border-slate-100 space-y-3">
                <div className="text-center">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/50 inline-block">
                    Quick-Test Access Portal
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1.5 font-medium leading-relaxed">
                    Click any card below to instantly sign in with seeded default credentials
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin', 'admin')}
                    className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-blue-50/40 border border-slate-200 hover:border-blue-500 rounded-xl text-center transition-all group cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Admin</span>
                    <span className="text-[8px] font-mono text-slate-400 mt-1.5 font-bold">U: admin</span>
                    <span className="text-[8px] font-mono text-slate-400">P: admin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('john.staff', 'password')}
                    className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-emerald-50/40 border border-slate-200 hover:border-emerald-500 rounded-xl text-center transition-all group cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-slate-700 group-hover:text-emerald-600 transition-colors">Faculty</span>
                    <span className="text-[8px] font-mono text-slate-400 mt-1.5 font-bold">U: john.staff</span>
                    <span className="text-[8px] font-mono text-slate-400">P: password</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('jane.student', 'password')}
                    className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-500 rounded-xl text-center transition-all group cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-slate-700 group-hover:text-amber-600 transition-colors">Student</span>
                    <span className="text-[8px] font-mono text-slate-400 mt-1.5 font-bold">U: jane.student</span>
                    <span className="text-[8px] font-mono text-slate-400">P: password</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4 text-left">
              {/* Role Segment Toggle */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-lg max-w-xs">
                <button
                  type="button"
                  onClick={() => { setSignUpRole('STUDENT'); setLoginError(''); }}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${signUpRole === 'STUDENT' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Student Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => { setSignUpRole('STAFF'); setLoginError(''); }}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all cursor-pointer ${signUpRole === 'STAFF' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Lecturer Sign Up
                </button>
              </div>

              {signUpRole === 'STUDENT' ? (
                <>
                  <div className="bg-blue-50 text-blue-800 text-[11px] p-3 rounded-lg flex items-start gap-2 leading-relaxed">
                    <BookOpen className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                    <div>
                      <strong className="font-bold">Official Registry Verification:</strong> Only pre-registered students admitted by the School Admissions Board can onboard into the student portal. Please enter your registered Email and Student ID Number.
                    </div>
                  </div>

                  <div className="space-y-3 max-w-md mx-auto bg-white p-4 border border-slate-100 rounded-xl shadow-xs">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Registered Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 font-medium"
                          placeholder="e.g. jane@university.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Student ID / ID Number</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={regStudentId}
                          onChange={(e) => setRegStudentId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 font-medium"
                          placeholder="e.g. STU001"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Create Portal Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-10 py-2 text-xs text-slate-800 font-medium"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden rounded cursor-pointer transition-colors"
                          title={showRegPassword ? "Hide password" : "Show password"}
                        >
                          {showRegPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 leading-tight">Must be at least 10 characters, with 1 uppercase letter, 1 digit, & 1 special character.</p>
                      {renderPasswordCriteria(regPassword)}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-emerald-50 text-emerald-800 text-[11px] p-3 rounded-lg flex items-start gap-2 leading-relaxed">
                    <BookOpen className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <strong className="font-bold">Faculty Automatic Credentials:</strong> To ensure secure standardization, staff login usernames are set to your <strong className="font-semibold">Surname (Last Name)</strong> and secure passwords are generated automatically. Credentials will be securely emailed to you.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">Academic Profile</h3>
                      
                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">First Name</label>
                        <input
                          type="text"
                          required
                          value={regFirstName}
                          onChange={(e) => setRegFirstName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-medium"
                          placeholder="First Name"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Surname (Last Name / Staff Username)</label>
                        <input
                          type="text"
                          required
                          value={regLastName}
                          onChange={(e) => setRegLastName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-medium"
                          placeholder="e.g. Smith"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Official Email Address</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 font-medium"
                            placeholder="e.g. smith@university.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Academic Degree Qualification</label>
                        <input
                          type="text"
                          required
                          value={regQualification}
                          onChange={(e) => setRegQualification(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-3 py-2 text-xs text-slate-800 font-medium"
                          placeholder="e.g. Ph.D. in Computer Science"
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b pb-1">Biodata & Placement</h3>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Position</label>
                          <select
                            value={regPosition}
                            onChange={(e) => setRegPosition(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-2 py-2 text-[10px] text-slate-800 focus:outline-hidden font-medium"
                          >
                            <option value="Lecturer">Lecturer</option>
                            <option value="Senior Lecturer">Senior Lecturer</option>
                            <option value="Assistant Professor">Assistant Professor</option>
                            <option value="Professor">Professor</option>
                            <option value="Instructor">Instructor</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Department</label>
                          <select
                            value={regDepartment}
                            onChange={(e) => setRegDepartment(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg px-2 py-2 text-[10px] text-slate-800 focus:outline-hidden font-medium"
                          >
                            <option value="Computer Science">Computer Science</option>
                            <option value="Mechanical Engineering">Mechanical Engineering</option>
                            <option value="Electrical Engineering">Electrical Engineering</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="General Education">General Education</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Contact Phone</label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 font-medium"
                            placeholder="+254 712345678"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Office / Home Address</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={regAddress}
                            onChange={(e) => setRegAddress(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800 font-medium"
                            placeholder="e.g. Science Block, Room 402"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg py-3 text-xs flex justify-center items-center gap-2 transition-all cursor-pointer shadow-md mt-6 animate-pulse"
              >
                <UserPlus className="w-4 h-4" />
                <span>Onboard and Sign Up Now</span>
              </button>
            </form>
          )}

          {authMode === 'forgot' && (
            <div className="space-y-4">
              {resetStep === 'request' ? (
                <form onSubmit={handleSendRecoveryCode} className="space-y-4 text-left">
                  <div className="bg-amber-50 text-amber-800 text-[11px] p-3 rounded-lg flex items-center gap-2">
                    <Key className="w-4 h-4 shrink-0 text-amber-600" />
                    <span>Enter your registered email. We will retrieve your login username and dispatch a verification OTP.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Associated Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-800 font-medium"
                        placeholder="e.g. mosesmwamuye97@gmail.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3 text-xs flex justify-center items-center gap-2 transition-all cursor-pointer shadow-md mt-6"
                  >
                    <span>Request OTP Security Code</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4 text-left animate-fade-in">
                  <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 font-bold text-[11px] text-blue-800 uppercase tracking-wide">
                      <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>Security OTP Dispatched</span>
                    </div>
                    <p className="text-[11px] text-slate-600 flex flex-wrap items-center gap-1">
                      <span>A secure verification request has been transmitted successfully to</span>
                      <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        <strong className="font-semibold text-slate-800">{forgotEmail}</strong>
                        {forgotEmail && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(forgotEmail);
                              setCopiedEmail(true);
                              setTimeout(() => setCopiedEmail(false), 2000);
                            }}
                            className="p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                            title="Copy email to clipboard"
                          >
                            {copiedEmail ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        )}
                      </span>
                      <span>. Please check your email inbox.</span>
                    </p>
                  </div>

                  {forgotUsername && (
                    <div className="bg-emerald-50 border border-emerald-200/60 p-3 rounded-lg text-emerald-800 text-[11px] flex items-center gap-2">
                      <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 animate-pulse" />
                      <div>
                        Recovered Username: <strong className="font-bold text-emerald-950 font-mono select-all text-xs">{forgotUsername}</strong>
                      </div>
                    </div>
                  )}

                  {sentCode && (
                    <div className="bg-sky-50 border border-sky-200/60 p-3 rounded-lg text-sky-800 text-[11px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          Simulated Reset OTP: <strong className="font-bold text-sky-950 font-mono select-all text-xs">{sentCode}</strong>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUserInputCode(sentCode)}
                        className="text-[10px] bg-sky-200 hover:bg-sky-300 text-sky-900 px-2 py-1 rounded font-bold transition-all cursor-pointer"
                      >
                        Auto-fill
                      </button>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Enter Verification OTP</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={userInputCode}
                        onChange={(e) => setUserInputCode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-800 font-bold tracking-widest"
                        placeholder="Type the 6-digit OTP code"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">New Password Selection</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-10 py-2.5 text-xs text-slate-800 font-medium"
                        placeholder="Enter new private password here"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-hidden rounded cursor-pointer transition-colors"
                        title={showForgotNewPassword ? "Hide password" : "Show password"}
                      >
                        {showForgotNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400 leading-tight">Must be at least 10 characters, with 1 uppercase, 1 digit, & 1 special character.</p>
                    {renderPasswordCriteria(forgotNewPassword)}
                  </div>

                  <div className="flex gap-2.5 pt-4">
                    <button
                      type="button"
                      onClick={() => { setResetStep('request'); setUserInputCode(''); }}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg py-3 text-xs transition-all cursor-pointer text-center"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3 text-xs flex justify-center items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <span>Verify & Reset Passcode</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {authMode === 'verify' && (
            <form onSubmit={handleVerification} className="space-y-4 text-left animate-fade-in">
              <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-[11px] text-blue-800 uppercase tracking-wide">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Email Verification Panel</span>
                </div>
                <p className="text-[11px] text-slate-600 flex flex-wrap items-center gap-1">
                  <span>We sent a 6-digit verification code to</span>
                  <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    <strong className="font-semibold text-slate-800">{verificationEmail || 'your email'}</strong>
                    {verificationEmail && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(verificationEmail);
                          setCopiedEmail(true);
                          setTimeout(() => setCopiedEmail(false), 2000);
                        }}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Copy email to clipboard"
                      >
                        {copiedEmail ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </span>
                  <span>(Username:</span>
                  <span className="inline-flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    <strong className="font-semibold text-slate-800">{verificationUsername}</strong>
                    {verificationUsername && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(verificationUsername);
                          setCopiedUsername(true);
                          setTimeout(() => setCopiedUsername(false), 2000);
                        }}
                        className="p-0.5 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                        title="Copy username to clipboard"
                      >
                        {copiedUsername ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    )}
                  </span>
                  <span>).</span>
                </p>
              </div>

              {debugOtpCode && (
                <div className="bg-sky-50 border border-sky-200/60 p-3 rounded-lg text-sky-800 text-[11px] flex items-center justify-between gap-2 animate-fade-in mb-2">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-sky-600 shrink-0" />
                    <div>
                      Simulated Activation OTP: <strong className="font-bold text-sky-950 font-mono select-all text-xs">{debugOtpCode}</strong>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(debugOtpCode)}
                    className="text-[10px] bg-sky-200 hover:bg-sky-300 text-sky-900 px-2 py-1 rounded font-bold transition-all cursor-pointer"
                  >
                    Auto-fill
                  </button>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Enter 6-Digit Code</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-800 font-bold tracking-widest"
                    placeholder="Type the 6-digit verification code"
                  />
                </div>
              </div>

              <div className="flex gap-2.5 pt-4">
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-lg py-3 text-xs transition-colors cursor-pointer text-center"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-3 text-xs flex justify-center items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify and Activate</span>
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold hover:underline bg-transparent border-0 cursor-pointer"
                >
                  Didn't receive code? Resend Email
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Terms, Policies, & School Board Directives Footer */}
        <div className="w-full max-w-md mt-6 text-center space-y-3 px-4">
          <div className="flex justify-center items-center gap-4 text-xs text-slate-500 font-semibold">
            <button 
              type="button"
              onClick={() => setShowTermsModal('terms')} 
              className="hover:text-slate-800 transition-colors cursor-pointer hover:underline bg-transparent border-0"
            >
              Terms of Use
            </button>
            <span className="text-slate-300">•</span>
            <button 
              type="button"
              onClick={() => setShowTermsModal('privacy')} 
              className="hover:text-slate-800 transition-colors cursor-pointer hover:underline bg-transparent border-0"
            >
              Privacy Policy
            </button>
            <span className="text-slate-300">•</span>
            <button 
              type="button"
              onClick={() => setShowTermsModal('directives')} 
              className="hover:text-slate-800 transition-colors cursor-pointer hover:underline bg-transparent border-0"
            >
              School Directives
            </button>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            © {new Date().getFullYear()} University Academic Registrar and Admissions Board.
            All Rights Reserved. Authorized access only.
          </p>
        </div>

        {/* Custom Premium Modal for Policies & Terms to support iFrames perfectly without blocking alerts */}
        {showTermsModal !== 'none' && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-slate-100 overflow-hidden text-left flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  {showTermsModal === 'terms' && 'System Terms & Use Policy'}
                  {showTermsModal === 'privacy' && 'Information Privacy Policy'}
                  {showTermsModal === 'directives' && 'Academic Board Registrar Directives'}
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowTermsModal('none')}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg bg-transparent border-0 cursor-pointer"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 text-xs text-slate-600 space-y-3 leading-relaxed overflow-y-auto max-h-[350px]">
                {showTermsModal === 'terms' && (
                  <>
                    <p className="font-semibold text-slate-800 text-[13px]">1. Scope & Portal Compliance</p>
                    <p>All activities on the University Hub Management Portal, including class enrollment, grade book entries, financial transactions, and log submissions, are subject to the official Student Code of Conduct and Faculty Academic Charter.</p>
                    
                    <p className="font-semibold text-slate-800 text-[13px]">2. Standardized Faculty Security</p>
                    <p>Faculty member accounts utilize strict standardized login usernames corresponding to their Surname (Last Name). Credentials are automatically created and emailed to faculty upon verification.</p>

                    <p className="font-semibold text-slate-800 text-[13px]">3. Audit Logging</p>
                    <p>Every authentication event, grade update, syllabus change, and log ledger modification is permanently stamped with user roles, IP, and UTC timestamps for regular security auditing.</p>
                  </>
                )}
                {showTermsModal === 'privacy' && (
                  <>
                    <p className="font-semibold text-slate-800 text-[13px]">1. Confidentiality of Student Transcripts</p>
                    <p>All student grades, course enrollments, attendance percentages, and financial billing ledger statements are classified under Registrar's Seal privacy rules.</p>
                    
                    <p className="font-semibold text-slate-800 text-[13px]">2. OTP Security Protocols</p>
                    <p>One-Time Verification OTP codes are generated securely and dispatched via configured secure SMTP servers directly to the student or staff member's pre-registered email inbox.</p>

                    <p className="font-semibold text-slate-800 text-[13px]">3. Session State Protection</p>
                    <p>Active session records are stored locally with encrypted standard JWT security tokens. All state parameters and tokens are immediately destroyed upon pressing the logout control.</p>
                  </>
                )}
                {showTermsModal === 'directives' && (
                  <>
                    <p className="font-semibold text-slate-800 text-[13px]">1. Mandatory Registrar Pre-Admission</p>
                    <p className="text-red-700 font-medium bg-red-50 p-2 rounded-md border border-red-100">
                      Admissions Board Mandate: No student is allowed to create an active portal account unless they are already registered in the official university records. Self-creation of new students is strictly forbidden.
                    </p>
                    
                    <p className="font-semibold text-slate-800 text-[13px]">2. Student Account Onboarding</p>
                    <p>Onboarding requires the matching of both the registered Email address and official Student ID. If a student is not registered, the Registrar Board must be contacted first.</p>

                    <p className="font-semibold text-slate-800 text-[13px]">3. Verification and Account Integrity</p>
                    <p>Unverified user profiles are temporarily locked. Verification codes are sent directly via secure, automated email to the registered institutional inbox.</p>
                  </>
                )}
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowTermsModal('none')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg text-xs cursor-pointer"
                >
                  Acknowledge and Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // DYNAMIC PANEL ROUTING BY NAVIGATION CLICKS & ROLE SCHEMES
  const renderTabContent = () => {
    switch (user.role) {
      case 'ADMIN':
        switch (activeTab) {
          case 'dashboard':
            return (
              <DashboardStats 
                stats={dashboardStats} 
                loading={statsLoading} 
                username={user.username} 
                role={user.role} 
                startDate={startDate}
                endDate={endDate}
                onDateRangeChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
              />
            );
          case 'students':
            return <StudentModule token={token} classes={classes} onSelectStudentFees={handleSelectStudentFeesForBilling} user={user} />;
          case 'staff':
            return <StaffModule token={token} subjects={subjects} />;
          case 'classes':
            return <AcademicsModule token={token} classes={classes} subjects={subjects} refreshData={fetchAcadData} staffList={staffList} />;
          case 'classrooms':
            return <AcademicsModule token={token} classes={classes} subjects={subjects} refreshData={fetchAcadData} staffList={staffList} />;
          case 'fees':
            return (
              <FinanceModule 
                token={token} 
                classes={classes} 
                activeStudentId={financeActiveStudent} 
                onClearActiveStudent={() => { setFinanceActiveStudent(null); setActiveTab('students'); }}
              />
            );
          case 'grades':
            return <GradesModule token={token} role="ADMIN" subjects={subjects} classes={classes} />;
          case 'reports':
            return (
              <ReportsModule 
                token={token} 
                startDate={startDate}
                endDate={endDate}
                onDateRangeChange={(start, end) => {
                  setStartDate(start);
                  setEndDate(end);
                }}
              />
            );
          case 'logs':
            return <LogsModule token={token} />;
          case 'user-management':
            return <UserManagementModule token={token} />;
          case 'admissions':
            return <AdmissionsModule token={token} />;
          case 'email-templates':
            return <EmailTemplateEditorModule token={token} />;
          default:
            return <DashboardStats stats={dashboardStats} loading={statsLoading} username={user.username} role={user.role} />;
        }

      case 'STAFF':
        switch (activeTab) {
          case 'students':
            return <StudentModule token={token} classes={classes} onSelectStudentFees={handleSelectStudentFeesForBilling} user={user} />;
          case 'dashboard':
            return (
              <div className="space-y-6 animate-fade-in font-sans">
                <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="text-xl font-bold text-slate-800">Welcome back, {user.username}!</h3>
                  <p className="text-slate-400 text-xs mt-1">Manage class rosters, record course grades and attendance registers.</p>
                </div>
                <StaffMyCourses token={token} />
              </div>
            );
          case 'classes':
            return <StaffMyCourses token={token} />;
          case 'grades':
            return <GradesModule token={token} role="STAFF" subjects={subjects} classes={classes} />;
          case 'attendance':
            return <AttendanceModule token={token} subjects={subjects} />;
          case 'salary':
            return (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-sm">
                <h4 className="font-display font-bold text-slate-800 text-sm">Salary Slips Directory</h4>
                <p className="text-slate-400 text-xs mt-1 leading-normal">Your payroll balances are cleared electronically by university accountants. Review logs in active payment summaries.</p>
                <div className="mt-4 p-4 border rounded-xl bg-slate-50 text-xs space-y-2">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block border-b pb-1">Compensation Tier</span>
                  <div className="flex justify-between font-semibold">
                    <span>Base monthly basic pay:</span>
                    <span className="font-mono">$5,500.00</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Active term allowances:</span>
                    <span className="font-mono">+$800.00</span>
                  </div>
                  <div className="flex justify-between text-slate-550 border-t pt-2 font-bold text-slate-900">
                    <span>Net disbursed:</span>
                    <span className="font-mono text-emerald-600">$6,300.00/mo</span>
                  </div>
                </div>
              </div>
            );
          case 'profile':
              return (
                <StaffSettings 
                  token={token!} 
                  profile={profile} 
                  onProfileUpdate={(updated) => {
                    setProfile(updated);
                    localStorage.setItem('uni_hub_profile', JSON.stringify(updated));
                  }}
                />
              );
            default:
              return <StaffMyCourses token={token} />;
        }

      case 'STUDENT':
        switch (activeTab) {
          case 'classes':
            return <StudentMyCourses token={token} />;
          case 'grades':
            return <GradesModule token={token} role="STUDENT" subjects={subjects} classes={classes} />;
          case 'fees':
            return <StudentFeesPortal token={token} user={user} />;
          case 'profile':
            return (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs max-w-md space-y-4">
                <h4 className="font-display font-medium text-slate-450 text-[10px] uppercase font-mono">My Tuition Profile</h4>
                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sky-500 text-sm">
                      {user.username.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-800 text-sm">University Student Profile</h5>
                      <span className="text-slate-400 text-[10px] font-mono tracking-wider">{user.role} CODE: STU091</span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2.5">
                    <div className="flex items-center gap-2.5 text-slate-655">
                      <Mail className="w-4 h-4 text-slate-450" />
                      <span>{user.username}@university.com</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-655">
                      <Phone className="w-4 h-4 text-slate-450" />
                      <span>+1 (405) 555-0811</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-slate-655">
                      <MapPin className="w-4 h-4 text-slate-450" />
                      <span>Lincoln Dorm Room 204</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          default:
            return <StudentMyCourses token={token} />;
        }

      default:
        return <div>Role mismatch error. Contact portal administrators.</div>;
    }
  };

  // SECURE ROLE-BASED ROUTE ACCESS & ADMISSION VERIFIER
  interface ProtectedRouteProps {
    allowedRoles: ('ADMIN' | 'STAFF' | 'STUDENT')[];
    children: React.ReactNode;
  }

  const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
    if (!user) return null;

    if (!allowedRoles.includes(user.role)) {
      return (
        <div className="p-8 bg-rose-50 border border-rose-100 rounded-2xl text-rose-800 space-y-2 max-w-lg mx-auto mt-10 shadow-xs font-sans">
          <h3 className="font-bold text-sm">Security Restriction — Unauthorized Node</h3>
          <p className="text-xs">Your credential role of {user.role} does not possess permissions authorized to access the requested system tab.</p>
        </div>
      );
    }

    // Role STUDENT and STAFF must be actively approved
    if ((user.role === 'STUDENT' || user.role === 'STAFF') && profile?.status === 'PENDING_APPROVAL') {
      return (
        <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-amber-200/60 shadow-xl rounded-3xl text-center space-y-6 animate-fade-in font-sans">
          <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 mx-auto animate-pulse">
            <Key className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">{user.role === 'STUDENT' ? 'Enrollment' : 'Faculty Access'} Pending Admission</h2>
            <p className="text-slate-550 text-xs leading-relaxed max-w-md mx-auto">
              Welcome to the University Hub, <strong className="text-slate-800 font-semibold">{profile?.firstName || user.username} {profile?.lastName || ''}</strong>! Your registration has been submitted successfully and is currently awaiting approval from the administration.
            </p>
            <p className="text-slate-400 text-[11px] leading-relaxed max-w-sm mx-auto">
              {user.role === 'STUDENT' 
                ? 'Once approved by staff, your course dashboards, assignments, grades log, and tuition balance will automatically materialize here.'
                : 'Once verified by the administrative team, you will receive full access to class scheduling, student attendance logs, payroll summaries, and course notes publication.'
              }
            </p>
          </div>
          <div className="pt-4 border-t flex flex-col gap-2.5 max-w-xs mx-auto">
            <div className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 py-2 rounded-xl border border-amber-200/50 uppercase tracking-widest animate-pulse">
              STATUS: AWAITING BOARD CONFIRMATION
            </div>
            <button 
              type="button"
              onClick={fetchProfileStatus} 
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer hover:shadow-md uppercase tracking-wider text-center"
            >
              Recheck Admission Status
            </button>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800 selection:bg-blue-600 selection:text-white">
      {/* SIDEBAR NAVIGATION COLUMN */}
      <Sidebar 
        user={user} 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          // If clearing from direct routing active billing
          if (tab !== 'fees') {
            setFinanceActiveStudent(null);
          }
          setActiveTab(tab);
        }} 
        onLogout={handleLogout} 
      />

      {/* PRIMARY MODULE CONTENT WORKSPACE RAIL */}
      <main className="flex-1 overflow-y-auto max-h-screen p-8 relative">
        <div className="max-w-7xl mx-auto space-y-6">
          <ProtectedRoute allowedRoles={['ADMIN', 'STAFF', 'STUDENT']}>
            {renderTabContent()}
          </ProtectedRoute>
        </div>
      </main>
    </div>
  );
}
