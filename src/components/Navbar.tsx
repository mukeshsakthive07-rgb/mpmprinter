import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Printer,
  Package,
  Settings,
  Bell,
  LogOut,
  Sun,
  Moon,
  User,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { activeTab, setActiveTab, unreadCount, notifications, markNotificationRead, markAllNotificationsRead, clearAllNotifications, currentTheme, setTheme, showToast } = useApp();
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    showToast('You have been logged out securely.', 'info', '👋');
  };

  const toggleTheme = () => {
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-4 z-40 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="liquid-glass rounded-2xl mx-auto mt-3 max-w-7xl px-6 py-2.5 text-white flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('order')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-fredoka text-lg font-bold tracking-tight text-white leading-tight">
              MPM PRINTER
            </span>
            
          </div>
        </div>

        {/* Center Navigation Tabs (Desktop & Tablet) */}
        <nav className="hidden md:flex items-center gap-1 liquid-glass-sub rounded-xl p-1">
          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('receiver')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'receiver'
                  ? 'liquid-glass-active text-cyan-300 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Receiver Mode</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('order')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'order'
                ? 'liquid-glass-active text-cyan-300 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Printer Order</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'orders'
                ? 'liquid-glass-active text-cyan-300 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'settings'
                ? 'liquid-glass-active text-cyan-300 font-bold'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Right Action Icons & User Dropdown */}
        <div className="flex items-center gap-2">
          <PWAInstallButton />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={`Switch to ${currentTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle theme"
          >
            {currentTheme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications Bell Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowUserMenu(false);
              }}
              className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-blue-600 text-[10px] font-extrabold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Overlay Menu */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 liquid-glass rounded-2xl border border-white/25 shadow-2xl py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 pb-2 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Notifications</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Real-time print order updates</p>
                  </div>
                  {notifications.length > 0 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Mark all read
                      </button>
                      <button
                        onClick={clearAllNotifications}
                        className="text-xs text-slate-400 hover:text-red-500"
                        title="Clear all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/40">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationRead(notif.id)}
                        className={`px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${
                          !notif.read ? 'bg-blue-50/60 dark:bg-blue-950/20' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                            {notif.title}
                          </h5>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-slate-400 mt-1.5 block">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Dropdown */}
          <div className="relative ml-1">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 transition-colors shadow-sm"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="hidden lg:block text-left mr-1">
                <div className="text-[13px] font-bold text-white truncate max-w-[120px] leading-tight">
                  {user?.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px] leading-tight">
                  {user?.email}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

              {/* User Menu Modal */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 liquid-glass rounded-2xl border border-white/25 shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700/60">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                    {user?.role === 'admin' ? (
    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
      Admin
    </span>
  ) : (
    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
      Logged In Student
    </span>
  )}
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('order');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                    >
                      <Printer className="w-4 h-4 text-slate-400" />
                      <span>Printer Order Page</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('orders');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>Order Tracking</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      <span>Account Settings</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout Account</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Floating Mobile Liquid Glass Dock */}
      <div className="md:hidden fixed bottom-5 left-4 right-4 z-50 max-w-md mx-auto liquid-glass rounded-[32px] px-3 py-2 flex justify-between items-center select-none">
        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('receiver')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl text-[11px] font-bold transition-all duration-300 ${
              activeTab === 'receiver'
                ? 'liquid-glass-active text-cyan-300 scale-105'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span>Receiver</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('order')}
          className={`flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl text-[11px] font-bold transition-all duration-300 ${
            activeTab === 'order'
              ? 'liquid-glass-active text-cyan-300 scale-105'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Printer className="w-5 h-5 mb-0.5" />
          <span>Print</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl text-[11px] font-bold transition-all duration-300 ${
            activeTab === 'orders'
              ? 'liquid-glass-active text-cyan-300 scale-105'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span>Orders</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center justify-center py-1.5 px-3.5 rounded-2xl text-[11px] font-bold transition-all duration-300 ${
            activeTab === 'settings'
              ? 'liquid-glass-active text-cyan-300 scale-105'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
};
