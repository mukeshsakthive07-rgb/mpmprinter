import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import type { UserSettings, SavedAddress, SavedPaymentMethod } from '../types';
import {
  User,
  Shield,
  Bell,
  Palette,
  Globe,
  Package,
  CreditCard,
  Lock,
  HelpCircle,
  Info,
  Check,
  Save,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  LogOut,
  Smartphone,
  Laptop,
  Plus,
  Trash2,
  Download,
  Send,
  Printer,
  ChevronDown,
  Menu
} from 'lucide-react';

type SettingsSectionId =
  | 'account'
  | 'security'
  | 'notifications'
  | 'appearance'
  | 'language'
  | 'orders'
  | 'payments'
  | 'privacy'
  | 'help'
  | 'about';

interface SectionItem {
  id: SettingsSectionId;
  label: string;
  icon: any;
  desc: string;
}

const SECTIONS: SectionItem[] = [
  { id: 'account', label: 'Account', icon: User, desc: 'Personal details, email & WhatsApp' },
  { id: 'security', label: 'Security', icon: Shield, desc: 'Password, 2FA & active sessions' },
  { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Email, order & WhatsApp alerts' },
  { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Theme, fonts & compact mode' },
  { id: 'language', label: 'Language & Region', icon: Globe, desc: 'Language, currency & time zone' },
  { id: 'orders', label: 'Orders', icon: Package, desc: 'Saved addresses & order preferences' },
  { id: 'payments', label: 'Payments', icon: CreditCard, desc: 'UPI, saved cards & billing history' },
  { id: 'privacy', label: 'Privacy', icon: Lock, desc: 'Data sharing, export & account deletion' },
  { id: 'help', label: 'Help & Support', icon: HelpCircle, desc: 'FAQs, contact form & feedback' },
  { id: 'about', label: 'About', icon: Info, desc: 'App version, terms & licenses' },
];

export const SettingsPage: React.FC = () => {
  const { user, firebaseUser, updateProfile, logout } = useAuth();

  const changePassword = async (curr: string, next: string) => {
    return { success: false, error: 'Password change is disabled for Google Authentication.' };
  };

  const deleteAccount = async () => {
    return { success: false, error: 'Account deletion must be done from Google.' };
  };
  const { settings, updateSettings, orders, currentTheme, setTheme, showToast } = useApp();

  
  const defaultSettings = {
    notifications: { email: true, push: false, whatsapp: true, orderUpdates: true, promotional: false },
    appearance: { theme: 'system', compactMode: false, fontSize: 'medium' },
    languageAndRegion: { language: 'en', currency: 'INR', timeZone: 'Asia/Kolkata' },
    addresses: [],
    paymentMethods: [],
    privacy: { shareUsageData: false, personalizedAds: false, profileVisibility: 'private' }
  };

  const safeSettings = {
    notifications: { ...defaultSettings.notifications, ...(settings?.notifications || {}) },
    appearance: { ...defaultSettings.appearance, ...(settings?.appearance || {}) },
    languageAndRegion: { ...defaultSettings.languageAndRegion, ...(settings?.languageAndRegion || {}) },
    addresses: settings?.addresses || defaultSettings.addresses,
    paymentMethods: settings?.paymentMethods || defaultSettings.paymentMethods,
    privacy: { ...defaultSettings.privacy, ...(settings?.privacy || {}) }
  };



  
  const [rates, setRates] = useState<Record<string, number>>({
    'bw-single': 1.0,
    'bw-double': 1.4,
    'colour': 6.8,
    'photo': 18.0
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      fetch('/api/rates')
        .then(res => res.json())
        .then(data => {
          if (data.rates) setRates(data.rates);
        });
    }
  }, [user]);

  const handleRateUpdate = async () => {
    try {
      const token = firebaseUser ? await firebaseUser.getIdToken() : '';
      const res = await fetch('/api/admin/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rates })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Print rates updated successfully', 'success');
      } else {
        showToast(data.error || 'Failed to update rates', 'error');
      }
    } catch (e) {
      showToast('Network error while updating rates', 'error');
    }
  };

  const [activeSection, setActiveSection] = useState<SettingsSectionId>('account');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Account State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [username, setUsername] = useState(user?.username || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // 2. Security State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);

  // 3. Address Modal State
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('');
  const [newAddrLine, setNewAddrLine] = useState('');

  // 4. Payment Method Modal State
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'upi' | 'card'>('upi');
  const [paymentTitle, setPaymentTitle] = useState('');
  const [paymentInfo, setPaymentInfo] = useState('');

  // 5. Help / Feedback State
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportCategory, setSupportCategory] = useState('Print Quality');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

  // 6. Delete Account Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Sync state when user/settings load
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setUsername(user.username || '');
      setAvatarUrl(user.avatarUrl || '');
      setTwoFactorEnabled(user.twoFactorEnabled || false);
    }
  }, [user]);

  // Handle Account Update
  const handleSaveAccount = async () => {
    if (!name.trim()) {
      showToast('Name cannot be empty', 'error', '⚠️');
      return;
    }
    setIsSavingAccount(true);
    const res = await updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      username: username.trim(),
      avatarUrl: avatarUrl.trim(),
    });
    setIsSavingAccount(false);

    if (res.success) {
      setIsEditingAccount(false);
      showToast('Profile updated successfully.', 'success', '👤');
    } else {
      showToast(res.error || 'Failed to update profile.', 'error', '❌');
    }
  };

  const handleCancelAccount = () => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setUsername(user.username || '');
      setAvatarUrl(user.avatarUrl || '');
    }
    setIsEditingAccount(false);
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass) {
      showToast('Please enter your current password.', 'error', '⚠️');
      return;
    }
    if (!newPass || newPass.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error', '⚠️');
      return;
    }
    if (newPass !== confirmNewPass) {
      showToast('Passwords do not match.', 'error', '⚠️');
      return;
    }

    setIsUpdatingPassword(true);
    const res = await changePassword(currentPass, newPass);
    setIsUpdatingPassword(false);

    if (res.success) {
      setCurrentPass('');
      setNewPass('');
      setConfirmNewPass('');
      showToast('Password changed successfully!', 'success', '🔐');
    } else {
      showToast(res.error || 'Password update failed.', 'error', '❌');
    }
  };

  // Handle 2FA Toggle
  const handleToggle2FA = async (enabled: boolean) => {
    setTwoFactorEnabled(enabled);
    const res = await updateProfile({ twoFactorEnabled: enabled });
    if (res.success) {
      showToast(
        enabled ? 'Two-Factor Authentication activated.' : 'Two-Factor Authentication disabled.',
        'info',
        '🛡️'
      );
    }
  };

  // Handle Notification Toggle
  const handleToggleNotification = async (key: keyof UserSettings['notifications']) => {
    const currentVal = safeSettings.notifications[key];
    const newNotifications = {
      ...safeSettings.notifications,
      [key]: !currentVal,
    };
    await updateSettings({ notifications: newNotifications });
    showToast('Notification preferences updated.', 'success', '🔔');
  };

  // Handle Appearance Change
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setTheme(theme);
    showToast(`Theme changed to ${theme.toUpperCase()}.`, 'info', '🎨');
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    updateSettings({
      appearance: {
        ...safeSettings.appearance,
        fontSize: size,
      },
    });
    showToast(`Font size set to ${size}.`, 'info', '🔤');
  };

  const handleCompactModeToggle = () => {
    const current = safeSettings.appearance.compactMode;
    updateSettings({
      appearance: {
        ...safeSettings.appearance,
        compactMode: !current,
      },
    });
    showToast(`Compact mode ${!current ? 'enabled' : 'disabled'}.`, 'info', '📐');
  };

  // Handle Language & Region Changes
  const handleRegionalChange = (key: keyof UserSettings['languageAndRegion'], value: string) => {
    const newRegional = {
      ...safeSettings.languageAndRegion,
      [key]: value,
    };
    // Sync currency symbol
    if (key === 'currency') {
      if (value === 'INR') newRegional.currencySymbol = '₹';
      else if (value === 'USD') newRegional.currencySymbol = '$';
      else if (value === 'EUR') newRegional.currencySymbol = '€';
      else if (value === 'GBP') newRegional.currencySymbol = '£';
    }
    updateSettings({ languageAndRegion: newRegional });
    showToast('Language & regional preferences saved.', 'success', '🌐');
  };

  // Handle Saved Addresses
  const handleAddAddress = () => {
    if (!newAddrLabel.trim() || !newAddrLine.trim()) {
      showToast('Please provide both address label and address line.', 'error', '⚠️');
      return;
    }
    const current = safeSettings.addresses || [];
    const newAddr: SavedAddress = {
      id: `addr-${Date.now()}`,
      label: newAddrLabel.trim(),
      addressLine: newAddrLine.trim(),
      isDefault: current.length === 0,
    };
    updateSettings({ addresses: [...current, newAddr] });
    setNewAddrLabel('');
    setNewAddrLine('');
    setShowAddAddressModal(false);
    showToast('New delivery address saved.', 'success', '📍');
  };

  const handleSetDefaultAddress = (id: string) => {
    if (!safeSettings.addresses) return;
    const updated = safeSettings.addresses.map((a) => ({
      ...a,
      isDefault: a.id === id,
    }));
    updateSettings({ addresses: updated });
    showToast('Default delivery address updated.', 'info', '⭐');
  };

  const handleDeleteAddress = (id: string) => {
    if (!safeSettings.addresses) return;
    const updated = safeSettings.addresses.filter((a) => a.id !== id);
    updateSettings({ addresses: updated });
    showToast('Address removed.', 'info', '🗑️');
  };

  // Handle Payments
  const handleAddPaymentMethod = () => {
    if (!paymentTitle.trim() || !paymentInfo.trim()) {
      showToast('Please fill all payment fields.', 'error', '⚠️');
      return;
    }
    const current = safeSettings.paymentMethods || [];
    let masked = paymentInfo.trim();
    if (paymentType === 'card') {
      const clean = paymentInfo.replace(/\D/g, '');
      const last4 = clean.slice(-4) || '1234';
      masked = `•••• •••• •••• ${last4}`;
    }

    const newPm: SavedPaymentMethod = {
      id: `pm-${Date.now()}`,
      type: paymentType,
      title: paymentTitle.trim(),
      maskedInfo: masked,
      isDefault: current.length === 0,
    };

    updateSettings({ paymentMethods: [...current, newPm] });
    setPaymentTitle('');
    setPaymentInfo('');
    setShowAddPaymentModal(false);
    showToast('Payment method saved.', 'success', '💳');
  };

  const handleDeletePaymentMethod = (id: string) => {
    if (!safeSettings.paymentMethods) return;
    const updated = safeSettings.paymentMethods.filter((p) => p.id !== id);
    updateSettings({ paymentMethods: updated });
    showToast('Payment method removed.', 'info', '🗑️');
  };

  // Handle Privacy Toggles
  const handlePrivacyToggle = (key: keyof UserSettings['privacy']) => {
    const currentVal = safeSettings.privacy[key];
    updateSettings({
      privacy: {
        ...safeSettings.privacy,
        [key]: typeof currentVal === 'boolean' ? !currentVal : currentVal,
      },
    });
    showToast('Privacy preferences updated.', 'info', '🔒');
  };

  // Download User Data Export
  const handleDownloadMyData = async () => {
    try {
      const exportData = { user, settings, orders };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mm-printer-account-export-${user?.username || 'user'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('Account data downloaded successfully.', 'success', '📦');
    } catch {
      showToast('Error exporting account data.', 'error', '❌');
    }
  };

  // Handle Delete Account
  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    const res = await deleteAccount();
    setIsDeletingAccount(false);
    if (!res.success) {
      showToast(res.error || 'Failed to delete account.', 'error', '❌');
    }
  };

  // Submit Support Form
  const supportTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (supportTimeoutRef.current) clearTimeout(supportTimeoutRef.current);
    };
  }, []);

  const handleSubmitSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) {
      showToast('Subject and message cannot be empty.', 'error', '⚠️');
      return;
    }
    setIsSubmittingSupport(true);
    try {
      supportTimeoutRef.current = setTimeout(() => {
        setSupportSubject('');
        setSupportMessage('');
        showToast('Your message has been sent to Mugilan & Mukesh.', 'success', '📩');
        setIsSubmittingSupport(false);
      }, 1000);
    } catch {
      showToast('Failed to submit message.', 'error', '❌');
      setIsSubmittingSupport(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Settings Top Title */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Application &amp; Account Settings
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Manage your student profile, password security, appearance, notifications, addresses, and privacy.
        </p>
      </div>

      {/* Mobile Category Dropdown Selector */}
      <div className="lg:hidden mb-6">
        <div className="relative">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/40 border border-slate-700 shadow-sm text-slate-900 dark:text-white font-bold text-sm"
          >
            <div className="flex items-center gap-2.5">
              {React.createElement(SECTIONS.find((s) => s.id === activeSection)!.icon, {
                className: 'w-5 h-5 text-blue-600 dark:text-blue-400',
              })}
              <span>{SECTIONS.find((s) => s.id === activeSection)!.label}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-slate-900/40 border border-slate-700 shadow-xl py-2 z-30 max-h-80 overflow-y-auto">
              {SECTIONS.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveSection(sec.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-xs font-bold transition-colors ${
                    activeSection === sec.id
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <sec.icon className="w-4 h-4" />
                  <span>{sec.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Dashboard Layout: Left Sidebar + Right Content Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Sidebar Menu (4 cols on desktop) */}
        <aside className="hidden lg:block lg:col-span-4 liquid-glass rounded-3xl p-3 shadow-xl sticky top-24">
          <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700/60 mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Settings Navigation
            </span>
          </div>

          <nav className="space-y-1">
            {SECTIONS.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all ${
                    isActive
                      ? 'liquid-glass-active text-cyan-300 font-bold'
                      : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 dark:bg-slate-700/80 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs truncate">{sec.label}</div>
                    <div
                      className={`text-[11px] truncate ${
                        isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {sec.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Right Content Panel (8 cols on desktop) */}
        <main className="relative lg:col-span-8 liquid-glass rounded-3xl p-6 sm:p-8 text-white min-h-[560px]">
          {/* ==================================================== */}
          {/* SECTION 1: ACCOUNT SETTINGS */}
          {/* ==================================================== */}
          {activeSection === 'account' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <div>
                  <h3 className="text-lg font-bold text-white">Account Settings</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Update your personal profile, registered student email, and contact info.
                  </p>
                </div>
                {!isEditingAccount ? (
                  <button
                    onClick={() => setIsEditingAccount(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleCancelAccount}
                      disabled={isSavingAccount}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAccount}
                      disabled={isSavingAccount}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      {isSavingAccount ? <span>Saving...</span> : <><Check className="w-3.5 h-3.5" /> Save Changes</>}
                    </button>
                  </div>
                )}
              </div>

              {/* Profile Picture & Avatar */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/30 border border-white/15 text-white">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl ring-4 ring-blue-500/20 overflow-hidden shrink-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    name.charAt(0) || 'U'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-base text-white truncate">{name}</h4>
                  <p className="text-xs text-slate-300 truncate mt-0.5">{email}</p>
                  {isEditingAccount && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Avatar Image URL (or paste photo link)"
                        value={avatarUrl}
                        onChange={(e) => setAvatarUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-slate-900/40 text-white placeholder-slate-400 text-xs font-semibold focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Account Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingAccount}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="liquid-glass-input rounded-xl px-3.5 py-2.5 text-xs disabled:bg-slate-800/80 disabled:border-slate-700 disabled:text-white disabled:opacity-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    disabled={!isEditingAccount}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="liquid-glass-input rounded-xl px-3.5 py-2.5 text-xs disabled:bg-slate-800/80 disabled:border-slate-700 disabled:text-white disabled:opacity-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Email Address (Registered)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-slate-900/40 text-white text-xs font-semibold cursor-not-allowed opacity-100"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Account email is locked for security.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    disabled={!isEditingAccount}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 1234567890"
                    className="liquid-glass-input rounded-xl px-3.5 py-2.5 text-xs disabled:bg-slate-800/80 disabled:border-slate-700 disabled:text-white disabled:opacity-100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SECTION 2: SECURITY SETTINGS */}
          {/* ==================================================== */}
          {activeSection === 'security' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <h3 className="text-lg font-bold text-white">Security &amp; Passwords</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Update password credentials, manage two-factor authentication, and monitor active sessions.
                </p>
              </div>

              {/* Change Password Card */}
              <form onSubmit={handleChangePassword} className="space-y-4 p-5 rounded-2xl bg-slate-900/30 border border-white/15 text-white">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Change Account Password
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPass ? 'text' : 'password'}
                      required
                      value={currentPass}
                      onChange={(e) => setCurrentPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-white/15 bg-slate-900/40 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      New Password * (min 6 chars)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        required
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-white/15 bg-slate-900/40 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Confirm New Password *
                    </label>
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      value={confirmNewPass}
                      onChange={(e) => setConfirmNewPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-white/15 bg-slate-900/40 text-white placeholder-slate-400 text-xs focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>

              {/* Two-Factor Authentication Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-700/80">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    Two-Factor Authentication (2FA)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Require an OTP verification code when signing in from unfamiliar devices.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle2FA(!twoFactorEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    twoFactorEnabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Active Sessions List */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Active Devices &amp; Sessions
                  </h4>
                  <button
                    onClick={async () => {
                      showToast('Logged out of all other devices.', 'info', '🔒');
                    }}
                    className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Logout from All Devices
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <Laptop className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <strong className="text-slate-900 dark:text-white block">Current Device (Web Browser)</strong>
                        <span className="text-[11px] text-slate-500">Active session • Session authenticated</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                      Active Now
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-slate-500" />
                      <div>
                        <strong className="text-slate-900 dark:text-white block">Mobile Device (PWA / Mobile Safari)</strong>
                        <span className="text-[11px] text-slate-500">Last synchronized today • Ready</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">Synced</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SECTION 3: NOTIFICATIONS SETTINGS */}
          {/* ==================================================== */}
          {activeSection === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <h3 className="text-lg font-bold text-white">Notification Preferences</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Choose how and when MPM PRINTER sends you updates on print jobs and security.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {[
                  {
                    key: 'order',
                    title: 'Order Status Notifications',
                    desc: 'Real-time alerts when your printout moves to "Printing" or "Ready for Pickup".',
                  },
                  {
                    key: 'whatsapp',
                    title: 'WhatsApp Notifications',
                    desc: 'Direct WhatsApp ping when completed at MPM PRINTER shop counter.',
                  },
                  {
                    key: 'email',
                    title: 'Email Order Receipts',
                    desc: 'Digital PDF receipt sent to your registered college email.',
                  },
                  {
                    key: 'securityAlerts',
                    title: 'Security & Login Alerts',
                    desc: 'Immediate notification if a new device signs in to your account.',
                  },
                  {
                    key: 'systemUpdates',
                    title: 'System & Shop Schedule Updates',
                    desc: 'Notices regarding shop holiday hours, maintenance, or pricing updates.',
                  },
                  {
                    key: 'promotional',
                    title: 'Promotional & Student Discounts',
                    desc: 'Occasional discounts on semester project binding and spiral printouts.',
                  },
                ].map((item) => {
                  const isChecked = safeSettings.notifications
                    ? (safeSettings.notifications as any)[item.key]
                    : true;
                  return (
                    <div key={item.key} className="py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleNotification(item.key as any)}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isChecked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            isChecked ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SECTION 4: APPEARANCE SETTINGS */}
          {/* ==================================================== */}
          {activeSection === 'appearance' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <h3 className="text-lg font-bold text-white">Appearance &amp; Theme</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Customize the look and feel. Changes apply immediately and persist automatically.
                </p>
              </div>

              {/* Theme Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider uppercase tracking-wider mb-2">
                  Theme Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Light Mode', icon: '☀️' },
                    { id: 'dark', label: 'Dark Mode', icon: '🌙' },
                    { id: 'system', label: 'System Default', icon: '💻' },
                  ].map((thm) => {
                    const isSelected = (safeSettings.appearance?.theme || 'system') === thm.id;
                    return (
                      <button
                        key={thm.id}
                        type="button"
                        onClick={() => handleThemeChange(thm.id as any)}
                        className={`p-4 rounded-2xl border-2 text-center transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                            : 'border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 font-medium'
                        }`}
                      >
                        <div className="text-2xl mb-1">{thm.icon}</div>
                        <div className="text-xs">{thm.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider uppercase tracking-wider mb-2">
                  Font Size
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'small', label: 'Small (14px)' },
                    { id: 'medium', label: 'Medium (16px)' },
                    { id: 'large', label: 'Large (18px)' },
                  ].map((sz) => {
                    const isSelected = (safeSettings.appearance?.fontSize || 'medium') === sz.id;
                    return (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => handleFontSizeChange(sz.id as any)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white font-bold shadow-sm'
                            : 'border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {sz.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Compact Mode Toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-700/80">
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Compact Density Mode</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Reduce padding and spacing to view more print orders at once.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCompactModeToggle}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    safeSettings.appearance?.compactMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      safeSettings.appearance?.compactMode ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SECTION 5: LANGUAGE & REGION */}
          {/* ==================================================== */}
          {activeSection === 'language' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <h3 className="text-lg font-bold text-white">Language &amp; Regional Settings</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure your preferred language, local currency symbol, and date formatting.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Language */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5.5">
                    Language
                  </label>
                  <select
                    value={safeSettings.languageAndRegion?.language || 'English'}
                    onChange={(e) => handleRegionalChange('language', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="English">English</option>
                    <option value="Tamil">Tamil (தமிழ்)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Malayalam">Malayalam (മലയാളം)</option>
                    <option value="Telugu">Telugu (తెలుగు)</option>
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5.5">
                    Country
                  </label>
                  <select
                    value={safeSettings.languageAndRegion?.country || 'India'}
                    onChange={(e) => handleRegionalChange('country', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="India">India (IN)</option>
                    <option value="United States">United States (US)</option>
                    <option value="United Kingdom">United Kingdom (UK)</option>
                    <option value="Singapore">Singapore (SG)</option>
                    <option value="UAE">United Arab Emirates (UAE)</option>
                  </select>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5.5">
                    Currency
                  </label>
                  <select
                    value={safeSettings.languageAndRegion?.currency || 'INR'}
                    onChange={(e) => handleRegionalChange('currency', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="INR">INR (₹ - Indian Rupee)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                  </select>
                </div>

                {/* Time Zone */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5.5">
                    Time Zone
                  </label>
                  <select
                    value={safeSettings.languageAndRegion?.timeZone || 'Asia/Kolkata (IST)'}
                    onChange={(e) => handleRegionalChange('timeZone', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Asia/Kolkata (IST)">Asia/Kolkata (IST +5:30)</option>
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="America/New_York">America/New_York (EST/EDT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
                  </select>
                </div>

                {/* Date Format */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5.5">
                    Date Format
                  </label>
                  <select
                    value={safeSettings.languageAndRegion?.dateFormat || 'DD/MM/YYYY'}
                    onChange={(e) => handleRegionalChange('dateFormat', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 14/09/2026)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 09/14/2026)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-09-14)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SECTION 6: ORDER SETTINGS */}
          {/* ==================================================== */}
          {activeSection === 'orders' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <div>
                  <h3 className="text-lg font-bold text-white">Order Settings &amp; Addresses</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage your saved campus delivery addresses and order preferences.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddAddressModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Address
                </button>
              </div>

              {/* Order Stats Overview */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700 text-center">
                  <span className="text-[11px] font-semibold text-slate-500 block">Total Orders</span>
                  <strong className="text-xl font-fredoka text-slate-900 dark:text-white">{orders.length}</strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 text-center">
                  <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">In Printing</span>
                  <strong className="text-xl font-fredoka text-blue-600 dark:text-blue-400">
                    {orders.filter((o) => o.status === 'printing').length}
                  </strong>
                </div>
                <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 text-center">
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">Completed</span>
                  <strong className="text-xl font-fredoka text-emerald-600 dark:text-emerald-400">
                    {orders.filter((o) => o.status === 'completed').length}
                  </strong>
                </div>
              </div>

              {/* Saved Addresses List */}
              <div>
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                  Saved Campus Delivery Addresses
                </h4>
                <div className="space-y-3">
                  {(safeSettings.addresses || []).map((addr) => (
                    <div
                      key={addr.id}
                      className="liquid-glass-sub rounded-2xl p-4 text-white flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-slate-900 dark:text-white">
                            {addr.label}
                          </strong>
                          {addr.isDefault && (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                              Default Address
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {addr.addressLine}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!addr.isDefault && (
                          <button
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SECTION 7: PAYMENT SETTINGS */}
          {/* ==================================================== */}
          {activeSection === 'payments' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <div>
                  <h3 className="text-lg font-bold text-white">Payment Methods</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Saved UPI accounts and masked debit cards for fast printout checkout.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddPaymentModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Payment Method
                </button>
              </div>

              {/* Saved Methods List */}
              <div className="space-y-3">
                {(safeSettings.paymentMethods || []).map((pm) => (
                  <div
                    key={pm.id}
                    className="liquid-glass-sub rounded-2xl p-4 text-white flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold">
                        {pm.type === 'upi' ? 'UPI' : '💳'}
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                          {pm.title}
                        </strong>
                        <span className="font-mono text-xs text-slate-400">
                          {pm.maskedInfo}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeletePaymentMethod(pm.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Remove method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Payment History Preview */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-3">
                  Recent Print Payments
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-700 text-slate-400 text-[11px]">
                        <th className="pb-2">Order ID</th>
                        <th className="pb-2">Description</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Amount</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                      {orders.slice(0, 4).map((o) => (
                        <tr key={o.orderId} className="text-slate-700 dark:text-slate-300">
                          <td className="py-2.5 font-mono font-bold text-blue-600">#{o.orderId}</td>
                          <td className="py-2.5">{o.serviceTitle}</td>
                          <td className="py-2.5 text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td className="py-2.5 font-bold">₹{o.totalPrice.toFixed(2)}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                              Paid
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SECTION 8: PRIVACY SETTINGS */}
          {/* ==================================================== */}
          {activeSection === 'privacy' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <h3 className="text-lg font-bold text-white">Privacy &amp; Data Controls</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Control how your information is shared, export personal records, or permanently delete your account.
                </p>
              </div>

              {/* Privacy Toggles */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Data Sharing</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Share anonymous usage analytics to improve printing speed and load times.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePrivacyToggle('dataSharing')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      safeSettings.privacy?.dataSharing ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        safeSettings.privacy?.dataSharing ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">Personalized Recommendations</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Suggest paper grades and binding types based on your previous print assignments.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePrivacyToggle('personalizedRecommendations')}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      safeSettings.privacy?.personalizedRecommendations ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        safeSettings.privacy?.personalizedRecommendations ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Data Export & Danger Zone */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 space-y-4">
                <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">Download My Data</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Export all your past orders, settings, and profile info in JSON format.
                    </p>
                  </div>
                  <button
                    onClick={handleDownloadMyData}
                    className="px-3.5 py-2 rounded-xl bg-slate-900/40 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" /> Download JSON
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-rose-700 dark:text-rose-400">Delete My Account</h4>
                    <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-0.5">
                      Permanently delete your profile and all associated print orders.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20"
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* SECTION 9: HELP & SUPPORT */}
          {/* ==================================================== */}
          
            {user?.role === 'admin' && activeSection === 'admin' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-slate-900/40 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-700/80">
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Print Rates Management</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Single Side (B&W) ₹/page</label>
                      <input
                        type="number" step="0.1"
                        value={rates['bw-single']}
                        onChange={e => setRates({...rates, 'bw-single': parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Double Side (B&W) ₹/page</label>
                      <input
                        type="number" step="0.1"
                        value={rates['bw-double']}
                        onChange={e => setRates({...rates, 'bw-double': parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Colour Print Out ₹/page</label>
                      <input
                        type="number" step="0.1"
                        value={rates['colour']}
                        onChange={e => setRates({...rates, 'colour': parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Photo Sheet (Glossy) ₹/sheet</label>
                      <input
                        type="number" step="0.1"
                        value={rates['photo']}
                        onChange={e => setRates({...rates, 'photo': parseFloat(e.target.value) || 0})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                      />
                    </div>
                  </div>
                  <button onClick={handleRateUpdate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl">
                    Save Rates
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'help' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <h3 className="text-lg font-bold text-white">Help Center &amp; Support</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Frequently asked questions, printing guidelines, and direct contact desk.
                </p>
              </div>

              {/* FAQs Accordion */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Frequently Asked Questions
                </h4>

                {[
                  {
                    q: 'How do I collect my printed documents?',
                    a: 'Once your order status changes to "Ready for Pickup", visit the MPM PRINTER shop counter and show your Order ID (e.g. #MPM-1042).',
                  },
                  {
                    q: 'Can I cancel or delete an order?',
                    a: 'Yes, you can permanently delete any pending or completed order in My Orders. Deleting permanently purges it from the database across all devices.',
                  },
                  {
                    q: 'What file formats are accepted?',
                    a: 'PDF, Word (.doc, .docx), PowerPoint (.ppt, .pptx), Excel, and high-resolution JPG/PNG images.',
                  },
                  {
                    q: 'What are the official print rates?',
                    a: 'Single Side B&W: ₹1.0/page • Double Side B&W: ₹1.4/page • Colour: ₹6.8/page • Photo Sheet: ₹18/sheet.',
                  },
                ].map((faq, i) => (
                  <details
                    key={i}
                    className="liquid-glass-sub rounded-xl p-3.5 text-xs group cursor-pointer"
                  >
                    <summary className="font-bold text-slate-900 dark:text-white list-none flex items-center justify-between">
                      <span>{faq.q}</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <p className="mt-2 text-slate-600 dark:text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-700/40">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>

              {/* Support Form */}
              <form onSubmit={handleSubmitSupport} className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Send Support Query or Feedback
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Your Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || ''}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <select
                      value={supportCategory}
                      onChange={(e) => setSupportCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium"
                    >
                      <option value="Print Quality">Print Quality Issue</option>
                      <option value="Delayed Order">Order Queue Delay</option>
                      <option value="Binding Request">Custom Binding Request</option>
                      <option value="General Feedback">General Feedback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Subject *
                  </label>
                  <input
                    type="text"
                    required
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="e.g. Urgent assignment printing question"
                    className="liquid-glass-input rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                    Message / Problem Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    placeholder="Explain what you need help with..."
                    className="liquid-glass-input rounded-xl px-3.5 py-2.5 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingSupport}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  {isSubmittingSupport ? <span>Sending...</span> : <><Send className="w-3.5 h-3.5" /> Submit Message</>}
                </button>
              </form>
            </div>
          )}

          {/* ==================================================== */}
          {/* SECTION 10: ABOUT MPM PRINTER */}
          {/* ==================================================== */}
          {activeSection === 'about' && (
            <div className="space-y-6 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-100 dark:border-slate-700/60">
                <h3 className="text-lg font-bold text-white">About MPM PRINTER</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Application specifications, release version, and licensing.
                </p>
              </div>

              <div className="flex items-center gap-4 p-5 rounded-3xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-blue-500/30 shrink-0">
                  <Printer className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-fredoka text-xl font-bold text-slate-900 dark:text-white">
                    MPM PRINTER
                  </h4>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    By Mugilan &amp; Mukesh
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                    Version 1.0.0 (Build 2026.2.0)
                  </span>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  MPM PRINTER is the premier campus and professional printing service built to eliminate lines at the college xerox shop. Upload your project documents, notes, diagrams, and photo sheets from any device and track your queue in real time.
                </p>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-700 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Shop Operators:</span>
                    <strong className="text-slate-900 dark:text-white">Mugilan &amp; Mukesh</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Shop Contact:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">+91 94430 71443</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-400">Security Architecture:</span>
                    <span>PBKDF2 Password Hashing &amp; SSE Real-Time Sync</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-4 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'MPM PRINTER Terms of Service:\n1. Orders placed are printed on high-grade A4/A3 bond paper.\n2. Collected documents must be picked up within 7 days of completion.\n3. Student data and uploaded documents are securely protected.'
                    )
                  }
                  className="hover:underline"
                >
                  Terms &amp; Conditions
                </button>
                <button
                  type="button"
                  onClick={() =>
                    alert(
                      'MPM PRINTER Privacy Policy:\nUploaded files are encrypted and processed strictly for physical document print fulfillment. Deleted orders are permanently wiped from the database across all devices.'
                    )
                  }
                  className="hover:underline"
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => alert('Open Source Licenses: React 19, Tailwind CSS 4, Express, Lucide React, Vite.')}
                  className="hover:underline"
                >
                  Software Licenses
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================== */}
      {/* ADD ADDRESS MODAL */}
      {/* ==================================================== */}
      {showAddAddressModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900/40 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">
              Add Campus Delivery Address
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Address Label *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mechanical Dept Lab or Hostel Block B"
                  value={newAddrLabel}
                  onChange={(e) => setNewAddrLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Address Line *
                </label>
                <textarea
                  rows={3}
                  placeholder="Room number, building, college department..."
                  value={newAddrLine}
                  onChange={(e) => setNewAddrLine(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowAddAddressModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddAddress}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* ADD PAYMENT MODAL */}
      {/* ==================================================== */}
      {showAddPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900/40 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-3">
              Add Payment Method
            </h3>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentType('upi')}
                  className={`py-2 rounded-xl border font-bold text-center ${
                    paymentType === 'upi'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  UPI (GPay/PhonePe)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('card')}
                  className={`py-2 rounded-xl border font-bold text-center ${
                    paymentType === 'card'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}
                >
                  Debit/Credit Card
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title / Nickname *
                </label>
                <input
                  type="text"
                  placeholder={paymentType === 'upi' ? 'e.g. My Primary GPay' : 'e.g. HDFC Student Card'}
                  value={paymentTitle}
                  onChange={(e) => setPaymentTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {paymentType === 'upi' ? 'UPI ID (e.g. name@okhdfcbank) *' : 'Card Number (Masked automatically) *'}
                </label>
                <input
                  type="text"
                  placeholder={paymentType === 'upi' ? 'name@okaxis' : '•••• •••• •••• 1234'}
                  value={paymentInfo}
                  onChange={(e) => setPaymentInfo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowAddPaymentModal(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPaymentMethod}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-600/20"
              >
                Save Payment Method
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {/* ==================================================== */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900/40 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border border-slate-700 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="font-fredoka text-xl font-bold text-slate-900 dark:text-white">
              Delete Your Account?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              "Are you sure you want to delete your account? This action cannot be undone."
            </p>
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-semibold">
              All active print jobs, order records, and saved addresses will be wiped permanently.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeletingAccount}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md shadow-rose-600/30"
              >
                {isDeletingAccount ? 'Deleting...' : 'Confirm Account Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
