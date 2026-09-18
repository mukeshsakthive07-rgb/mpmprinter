import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Printer, AlertCircle, Eye, EyeOff, Mail, Lock, User, Phone, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';

type AuthMode = 'login' | 'register' | 'forgot';

export const LoginPage: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword, loading } = useAuth();
  const { showToast } = useApp();
  
  const [mode, setMode] = useState<AuthMode>('login');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const resetForm = () => {
    setErrorMsg(null);
    setPassword('');
    setConfirmPassword('');
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    const result = await loginWithGoogle();
    setIsProcessing(false);
    if (result.success) {
      showToast('Logged in successfully', 'success', '👋');
    } else {
      setErrorMsg(result.error || 'Failed to login with Google');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'login') {
      if (!email.trim() || !password.trim()) {
        setErrorMsg('Please enter both email and password.');
        return;
      }
      setIsProcessing(true);
      const result = await loginWithEmail(email.trim(), password);
      setIsProcessing(false);
      
      if (result.success) {
        showToast('Logged in successfully', 'success', '👋');
      } else {
        setErrorMsg(result.error || 'Invalid email or password.');
      }
    } 
    else if (mode === 'register') {
      if (!name.trim() || !email.trim() || !password.trim()) {
        setErrorMsg('Please fill in all required fields.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      
      setIsProcessing(true);
      const result = await signupWithEmail(name.trim(), email.trim(), phone.trim(), password);
      setIsProcessing(false);
      
      if (result.success) {
        showToast('Account created successfully!', 'success', '🎉');
      } else {
        setErrorMsg(result.error || 'Failed to create account.');
      }
    }
    else if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMsg('Please enter your email address.');
        return;
      }
      setIsProcessing(true);
      const result = await resetPassword(email.trim());
      setIsProcessing(false);
      
      if (result.success) {
        showToast('Password reset link sent to your email.', 'success', '📧');
        switchMode('login');
      } else {
        setErrorMsg(result.error || 'Failed to send reset link.');
      }
    }
  };

  return (
    <div className="min-h-[100dvh] bg-transparent flex flex-col justify-center py-12 relative overflow-hidden">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="text-center flex flex-col items-center">
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
          <p className="mt-4 text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            High-speed document printing, spiral binding, colour photocopies &amp; campus delivery.
          </p>
        </div>
        
        <div className="relative z-10 liquid-glass rounded-3xl p-6 sm:p-8 text-white max-w-md w-full shadow-2xl mt-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {mode === 'forgot' && (
            <button 
              onClick={() => switchMode('login')}
              className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold mb-6 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Login
            </button>
          )}

          <div className="mb-6 text-center">
            <h2 className="text-xl font-bold text-white mb-1">
              {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create an Account' : 'Reset Password'}
            </h2>
            <p className="text-xs text-slate-400">
              {mode === 'login' ? 'Enter your credentials to access your account' 
                : mode === 'register' ? 'Sign up to start printing instantly' 
                : 'Enter your email to receive a reset link'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs font-medium animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1 leading-snug">{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {mode === 'register' && (
              <>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 liquid-glass-input rounded-xl text-sm transition-all"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-500" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 liquid-glass-input rounded-xl text-sm transition-all"
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Email Address *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 liquid-glass-input rounded-xl text-sm transition-all"
                  placeholder="name@student.college.edu"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 liquid-glass-input rounded-xl text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirm Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 liquid-glass-input rounded-xl text-sm transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-900/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
                  />
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => switchMode('forgot')}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing || loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white liquid-glass-active hover:brightness-110 active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  mode === 'login' ? 'Login' : mode === 'register' ? 'Sign Up' : 'Send Reset Link'
                )}
              </button>
            </div>
          </form>

          {mode !== 'forgot' && (
            <>
              <div className="relative mt-6 mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700/80"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-slate-900/90 text-slate-400 font-medium">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isProcessing || loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:scale-100"
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-slate-400/30 border-t-slate-800 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  <path d="M1 1h22v22H1z" fill="none"/>
                </svg>
                )}
                {isProcessing ? 'Connecting...' : 'Sign in with Google'}
              </button>
            </>
          )}

          <div className="mt-6 text-center">
            {mode === 'login' ? (
              <p className="text-xs text-slate-400 font-medium">
                Don't have an account?{' '}
                <button onClick={() => switchMode('register')} className="text-blue-400 hover:text-blue-300 font-bold hover:underline">
                  Sign up
                </button>
              </p>
            ) : mode === 'register' ? (
              <p className="text-xs text-slate-400 font-medium">
                Already have an account?{' '}
                <button onClick={() => switchMode('login')} className="text-blue-400 hover:text-blue-300 font-bold hover:underline">
                  Log in
                </button>
              </p>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
};
