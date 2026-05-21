import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Trophy, ShieldAlert, LogIn, Sun, Moon, Globe } from 'lucide-react';

const Login: React.FC = () => {
  const { user, loginWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const location = useLocation();

  // Redirect if already logged in
  const from = (location.state as any)?.from?.pathname || "/";
  if (user) {
    return <Navigate to={from} replace />;
  }

  const handleLogin = async () => {
    try {
      setError(null);
      setIsLoggingIn(true);
      await loginWithGoogle();
    } catch (err: any) {
      console.error("Firebase Login Error:", err);
      setError(err?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center p-4">
      {/* Theme & Language Toggles in top-right */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {/* Language Switcher */}
        <button
          onClick={toggleLanguage}
          className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2.5 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all duration-200"
          title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
        >
          <Globe className="h-4 w-4" />
          <span>{language === 'vi' ? 'VI' : 'EN'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all duration-200"
          title={theme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full bg-purple-500/10 blur-[130px]" />

      {/* Main Glassmorphic Card */}
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden transition-all duration-500">
        
        {/* Glow Header Border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-purple-500 opacity-70" />

        {/* Logo / Icon */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-lg glow-primary">
          <Trophy className="h-8 w-8 animate-pulse" />
        </div>

        {/* Title */}
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          {t('loginTitle')}
        </h1>
        <p className="mb-8 text-sm text-slate-400">
          {t('loginDesc')}
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-left text-xs text-red-400">
            <ShieldAlert className="h-5 w-5 shrink-0" />
            <div>
              <span className="font-semibold">{t('loginErrorTitle')}:</span> {error}
              <div className="mt-1 opacity-80">
                {t('loginErrorDesc')}
              </div>
            </div>
          </div>
        )}

        {/* Google Login Button */}
        <button
          onClick={handleLogin}
          disabled={isLoggingIn}
          className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 transition-all duration-300 hover:scale-[1.02] hover:bg-slate-50 hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoggingIn ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          ) : (
            <>
              {/* Google Brand Colored SVG */}
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{t('loginButton')}</span>
              <LogIn className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </button>

        {/* Support note */}
        <p className="mt-8 text-xs text-slate-500">
          {t('loginTerms')}
        </p>

      </div>
    </div>
  );
};

export default Login;
