import { useState, useRef, ChangeEvent, FormEvent, useEffect } from 'react';
import { useAuthUser } from '../hooks/useAuthUser';
import StudentLayout from '../components/layout/StudentLayout';
import AdminLayout from '../components/layout/AdminLayout';
import 'react-phone-number-input/style.css';
import PhoneInput from 'react-phone-number-input';

export default function Profile() {
  const user = useAuthUser();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  
  const [securityMsg, setSecurityMsg] = useState('');
  const [securityErr, setSecurityErr] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingPic, setRemovingPic] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  if (!user) return null;

  const Layout = (user.role === 'SystemAdmin' || user.role === 'CourseAdmin') ? AdminLayout : StudentLayout;

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const handleProfileUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setProfileErr('');
    setProfileMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ full_name: fullName, phone })
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = Array.isArray(data.message) ? data.message[0] : data.message || 'Failed to update profile';
        throw new Error(errMsg);
      }
      setProfileMsg('Profile updated successfully.');
      setTimeout(() => window.location.reload(), 1000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setProfileErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setSecurityErr('');
    setSecurityMsg('');
    
    if (newPassword !== confirmPassword) {
      setSecurityErr('New passwords do not match');
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/users/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update password');
      setSecurityMsg('Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setSecurityErr(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProfileErr('');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/users/profile/picture`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to upload image');
      setProfileMsg('Profile picture updated successfully.');
      setTimeout(() => window.location.reload(), 1000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setProfileErr(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    setRemovingPic(true);
    setProfileErr('');
    try {
      const res = await fetch(`${API_URL}/users/profile/picture`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to remove image');
      setProfileMsg('Profile picture removed successfully.');
      setTimeout(() => window.location.reload(), 1000);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setProfileErr(err.message);
    } finally {
      setRemovingPic(false);
    }
  };

  return (
    <Layout user={user}>
      <section className="mb-8">
        <h1 className="font-display-xl text-5xl tracking-tight mb-2">My Profile</h1>
        <p className="font-body-md text-text-secondary">Manage your personal information and security preferences.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Avatar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container-low rounded-[32px] p-8 flex flex-col items-center justify-center text-center shadow-lg shadow-black/5 border border-black/5">
            <div className="relative group mb-6">
              <div className="w-40 h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-primary flex items-center justify-center">
                {user.profile_image ? (
                  <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display-xl text-6xl text-white">{user.email.charAt(0).toUpperCase()}</span>
                )}
                
                {/* Overlay for uploading */}
                <div 
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <span className="material-symbols-outlined text-white animate-spin">refresh</span>
                  ) : (
                    <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                  )}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
            
            <h2 className="font-headline-md text-2xl font-bold">{user.full_name || 'Anonymous User'}</h2>
            <p className="font-label-mono text-xs uppercase tracking-widest text-text-secondary mt-1">{user.role}</p>
            <p className="font-body-md text-sm text-text-secondary mt-2">{user.email}</p>
            
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || removingPic}
                className="font-label-mono text-xs uppercase tracking-widest border border-primary/20 bg-primary/5 text-primary px-4 py-2 rounded-full hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Change Picture'}
              </button>
              {user.profile_image && (
                <button 
                  onClick={handleRemovePicture}
                  disabled={uploading || removingPic}
                  className="font-label-mono text-xs uppercase tracking-widest border border-error/20 bg-error/5 text-error px-4 py-2 rounded-full hover:bg-error/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {removingPic ? 'Removing...' : 'Remove'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Personal Info Form */}
          <div className="bg-white rounded-[32px] p-8 shadow-lg shadow-black/5 border border-black/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">person</span>
              </div>
              <h3 className="font-headline-md text-xl font-bold">Personal Information</h3>
            </div>
            
            {profileErr && (
              <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span> {profileErr}
              </div>
            )}
            {profileMsg && (
              <div className="bg-[#E8FF66]/30 text-primary p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">check_circle</span> {profileMsg}
              </div>
            )}

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Full Name</label>
                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl px-5 py-4 focus-within:border-primary/50 transition-colors">
                    <input 
                      type="text" 
                      className="w-full bg-transparent border-none focus:ring-0 p-0 outline-none font-body-md"
                      value={fullName}
                      pattern="[a-zA-Z\s]*"
                      title="Name can only contain letters and spaces"
                      onChange={e => setFullName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Phone Number</label>
                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl px-5 py-4 focus-within:border-primary/50 transition-colors">
                    <PhoneInput
                      international
                      defaultCountry="US"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(val) => setPhone(val || '')}
                      className="w-full bg-transparent font-body-md mentora-phone-input"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="bg-primary text-white font-label-mono text-sm px-6 py-3 rounded-full hover:scale-95 transition-transform cursor-pointer shadow-md disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Security Form (Only if provider is local) */}
          {user.provider === 'local' && (
            <div className="bg-white rounded-[32px] p-8 shadow-lg shadow-black/5 border border-black/5">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-card-coral/30 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">security</span>
                </div>
                <h3 className="font-headline-md text-xl font-bold">Security</h3>
              </div>

              {securityErr && (
                <div className="bg-error/10 text-error p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span> {securityErr}
                </div>
              )}
              {securityMsg && (
                <div className="bg-[#E8FF66]/30 text-primary p-4 rounded-xl text-sm mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span> {securityMsg}
                </div>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Current Password</label>
                  <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl px-5 py-4 focus-within:border-primary/50 transition-colors">
                    <input 
                      type="password" 
                      required
                      className="w-full bg-transparent border-none focus:ring-0 p-0 outline-none font-body-md"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">New Password</label>
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl px-5 py-4 focus-within:border-primary/50 transition-colors">
                      <input 
                        type="password"
                        required
                        minLength={8}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 outline-none font-body-md"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Confirm Password</label>
                    <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-2xl px-5 py-4 focus-within:border-primary/50 transition-colors">
                      <input 
                        type="password"
                        required 
                        minLength={8}
                        className="w-full bg-transparent border-none focus:ring-0 p-0 outline-none font-body-md"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-primary text-white font-label-mono text-sm px-6 py-3 rounded-full hover:scale-95 transition-transform cursor-pointer shadow-md disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}
          
        </div>
      </div>
    </Layout>
  );
}
