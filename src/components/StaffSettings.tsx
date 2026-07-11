import React, { useState } from 'react';
import axios from 'axios';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Award, 
  Calendar, 
  Image as ImageIcon, 
  Save, 
  Check, 
  AlertCircle,
  Building,
  Shield
} from 'lucide-react';

interface StaffSettingsProps {
  token: string;
  profile: any;
  onProfileUpdate: (updated: any) => void;
}

export default function StaffSettings({ token, profile, onProfileUpdate }: StaffSettingsProps) {
  // Local state for settings form with fallbacks
  const [firstName, setFirstName] = useState(profile?.firstName || '');
  const [lastName, setLastName] = useState(profile?.lastName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [profilePic, setProfilePic] = useState(profile?.profilePic || '');
  const [qualification, setQualification] = useState(profile?.qualification || '');

  // Form states
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.put('/api/staff/profile/update', {
        phone,
        email,
        address,
        profilePic,
        qualification
      }, { headers });

      const updatedProfile = res.data.profile;
      onProfileUpdate(updatedProfile);
      setSuccessMsg('✨ Profile settings updated successfully!');
      
      // Clear success message after 4s
      setTimeout(() => {
        setSuccessMsg('');
      }, 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.error || 'Failed to update profile settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetSamplePhoto = (url: string) => {
    setProfilePic(url);
  };

  return (
    <div className="max-w-3xl space-y-6 font-sans text-left animate-fade-in" id="staff-profile-settings-module">
      
      {/* Header Panel */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-xs">
        <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
          <Shield className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <img 
                src={profilePic || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'} 
                alt="Lecturer Profile" 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 transition-all shadow-sm"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px]">
                <ImageIcon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold font-display">{firstName} {lastName}</h3>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 rounded-full font-bold">
                  {profile?.position || 'Lecturer'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>{profile?.department || 'General Education'}</span>
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-right">
            <span className="block text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold">Faculty Access Key</span>
            <span className="font-mono text-base font-bold text-sky-400 tracking-wider">
              {profile?.staffId || 'STF--'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Settings Form Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Contact & Faculty Configurations</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Manage your digital credentials, portal photo records, and bio coordinates.</p>
          </div>
          <span className="text-[10px] uppercase font-mono font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-md">
            Self Services
          </span>
        </div>

        <form onSubmit={handleUpdateProfile} className="p-6 space-y-5">
          
          {/* Messages block */}
          {successMsg && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 text-xs p-4 rounded-xl flex items-center gap-2.5 animate-fadeIn">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-50 text-rose-800 border border-rose-100 text-xs p-4 rounded-xl flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Contact Details Column */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 border-b pb-1">Communication channels</h5>
              
              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Official Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-hidden transition-all rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800"
                    placeholder="faculty@university.com"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Mobile Contact Phone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-hidden transition-all rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800"
                    placeholder="+254 700 000000"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Residential Campus Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-hidden transition-all rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800"
                    placeholder="e.g. Science Complex Annex, West Wing"
                  />
                </div>
              </div>
            </div>

            {/* Academic Creds & Images Column */}
            <div className="space-y-4">
              <h5 className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 border-b pb-1">Academic Credentials & photo</h5>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Highest Achievement Qualification</label>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-hidden transition-all rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800"
                    placeholder="PhD in Cloud Architecture"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Profile Photo URL</label>
                <div className="relative">
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={profilePic}
                    onChange={(e) => setProfilePic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white focus:outline-hidden transition-all rounded-lg pl-10 pr-4 py-2 text-xs text-slate-800"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>
                
                {/* Preconfigured sample placeholder picker */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Defaults:</span>
                  <button 
                    type="button" 
                    onClick={() => handleSetSamplePhoto('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150')}
                    className="text-[9px] text-blue-600 hover:underline cursor-pointer"
                  >
                    Portrait A
                  </button>
                  <span className="text-slate-300 text-[8px]">•</span>
                  <button 
                    type="button" 
                    onClick={() => handleSetSamplePhoto('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150')}
                    className="text-[9px] text-blue-600 hover:underline cursor-pointer"
                  >
                    Portrait B
                  </button>
                  <span className="text-slate-300 text-[8px]">•</span>
                  <button 
                    type="button" 
                    onClick={() => handleSetSamplePhoto('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150')}
                    className="text-[9px] text-blue-600 hover:underline cursor-pointer"
                  >
                    Portrait C
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-150 space-y-2 text-[11px] text-slate-500">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Joining Date:</span>
                    </span>
                    <span className="font-mono text-slate-700 font-semibold">{profile?.joiningDate || '2026-06-16'}</span>
                  </div>
                  <div className="border-t pt-1.5 flex justify-between items-center">
                    <span>Authorized System Scope:</span>
                    <span className="bg-amber-100 text-amber-850 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                      {profile?.status || 'ACTIVE'}
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Action button */}
          <div className="border-t border-slate-100 pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                isSaving 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-indigo-650 hover:bg-indigo-700 active:scale-95'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Adjustments...' : 'Save Settings Changes'}</span>
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
