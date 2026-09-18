import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoginPage } from './components/LoginPage';
const PrinterOrderPage = React.lazy(() => import('./components/PrinterOrderPage').then(module => ({ default: module.PrinterOrderPage })));
const OrdersPage = React.lazy(() => import('./components/OrdersPage').then(module => ({ default: module.OrdersPage })));
const SettingsPage = React.lazy(() => import('./components/SettingsPage').then(module => ({ default: module.SettingsPage })));
const ReceiverPanel = React.lazy(() => import('./components/ReceiverPanel').then(module => ({ default: module.ReceiverPanel })));
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { StarryGlowBackground } from './components/StarryGlowBackground';

const SuspenseFallback = (
  <div className="flex justify-center items-center h-64">
    <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

const MainContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { activeTab, toast, hideToast } = useApp();

  // Initial authentication loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-8"></div>
        <div className="inline-flex items-center justify-center w-24 h-24 mb-5 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-blue-600/30 border border-cyan-400/50 shadow-[0_0_30px_rgba(0,240,255,0.3)]">
          <svg className="w-12 h-12 text-cyan-400 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
        </div>
        <div className="flex flex-col items-center justify-center gap-1">
          <h1 className="font-fredoka text-4xl font-extrabold text-white tracking-tight leading-none bg-gradient-to-b from-[#00f0ff] to-[#00e676] bg-clip-text text-transparent">
            MPM PRINTER
          </h1>
          
        </div>
        <p className="text-xs text-slate-400 mt-4 animate-pulse">Connecting to database...</p>
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!user) {
    return (
      <>
        <LoginPage />
        {/* Toast Notifications container */}
        <ToastContainer toast={toast} onDismiss={hideToast} />
      </>
    );
  }

  // Logged In -> Show App Header & Active View
  return (
    <div className="relative z-10 min-h-screen bg-transparent text-white flex flex-col transition-colors duration-200">
      <Navbar />
      <OfflineIndicator />

      <main className="flex-1 pb-16">
        <React.Suspense fallback={SuspenseFallback}>
          {activeTab === 'order' && <PrinterOrderPage />}
          {activeTab === 'orders' && <OrdersPage />}
          {activeTab === 'settings' && <SettingsPage />}
          {activeTab === 'receiver' && <ReceiverPanel />}
        </React.Suspense>
      </main>

      {/* Global Real-Time Sync Indicator & Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm py-4 px-4 sm:px-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>MPM PRINTER Real-Time Cloud Sync Active</span>
            <span>•</span>
            <span>Logged in as <strong>{user.email}</strong></span>
          </div>
          <div className="text-[11px] text-slate-400">
            Single Side ₹1.0 • Double Side ₹1.4 • Colour ₹6.8 • Photo ₹18
          </div>
        </div>
      </footer>

      {/* Toast Notifications container */}
      <ToastContainer toast={toast} onDismiss={hideToast} />
    </div>
  );
};

const ToastContainer: React.FC<{
  toast: { message: string; type: 'success' | 'error' | 'info'; icon?: string } | null;
  onDismiss: () => void;
}> = ({ toast, onDismiss }) => {
  if (!toast) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <div
        className={`pointer-events-auto p-3.5 rounded-2xl shadow-xl border flex items-center justify-between gap-3 text-xs font-medium animate-in slide-in-from-bottom-3 duration-200 ${
          toast.type === 'success'
            ? 'bg-emerald-900/95 text-emerald-100 border-emerald-700/80'
            : toast.type === 'error'
            ? 'bg-rose-900/95 text-rose-100 border-rose-700/80'
            : 'bg-slate-900/95 text-slate-100 border-slate-700/80'
        }`}
      >
        <div className="flex items-center gap-2.5">
          {toast.icon ? (
            <span className="text-base">{toast.icon}</span>
          ) : toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span className="leading-snug">{toast.message}</span>
        </div>

        <button
          onClick={onDismiss}
          className="text-white/60 hover:text-white p-1 rounded-lg"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <StarryGlowBackground />
        <div className="relative z-10 bg-transparent min-h-screen w-full">
          <MainContent />
        </div>
      </AppProvider>
    </AuthProvider>
  );
}
