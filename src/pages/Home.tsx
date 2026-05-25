import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, doc, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import {
  LogOut,
  LayoutDashboard,
  Trophy,
  Award,
  Lock,
  HelpCircle,
  AlertCircle,
  XCircle,
  ThumbsUp,
  Sun,
  Moon,
  Globe,
  LogIn
} from 'lucide-react';
import { isMatchLocked, submitPrediction } from '../lib/services/predictionService';
import type { Match } from '../lib/services/matchService';

import MarqueeTicker from '../components/MarqueeTicker';
import { useAppTour } from '../hooks/useAppTour';

interface AppUser {
  uid: string;
  displayName: string;
  avatarUrl: string;
  totalPoints: number;
  role: string;
}

// Rút gọn tên đội bóng để hiển thị trong cột bảng Excel
const getTeamAbbr = (name: string) => {
  if (!name) return '???';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    // Manchester United -> MU, Việt Nam -> VN
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 3).toUpperCase();
};

const Home: React.FC = () => {
  const { user, logout, loginWithGoogle } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const [appSettings, setAppSettings] = useState({
    appTitle: 'FOOTBALL PREDICT',
    defaultBgImage: '',
    matchLockTimeMinutes: 15
  });

  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<{ [matchId: string]: any }>({});
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Trạng thái tab hiển thị và bảng xếp hạng
  const [viewMode, setViewMode] = useState<'matches' | 'leaderboard'>('matches');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [allPredictions, setAllPredictions] = useState<{ [key: string]: any }>({});

  // Khởi tạo tour hướng dẫn
  const { startTour } = useAppTour(matches.length > 0, setViewMode);

  // Cập nhật thời gian hiện tại mỗi 5 giây để tự động khóa cược
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Tự động khởi chạy tour cho người mới
  useEffect(() => {
    if (user && matches.length > 0) {
      const tourCompleted = localStorage.getItem('predict_football_tour_completed');
      if (!tourCompleted) {
        const timer = setTimeout(() => {
          startTour();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, matches.length]);

  // Lắng nghe cấu hình ứng dụng
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, 'settings', 'app');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setAppSettings({
          appTitle: data.appTitle || 'FOOTBALL PREDICT',
          defaultBgImage: data.defaultBgImage || '',
          matchLockTimeMinutes: data.matchLockTimeMinutes !== undefined ? data.matchLockTimeMinutes : 15
        });
      }
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Lỗi tải app settings (permission-denied). Hãy đảm bảo đã deploy firestore.rules mới lên Firebase.");
        return;
      }
      console.error("Lỗi realtime app settings:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Thay đổi tiêu đề và ảnh nền động
  useEffect(() => {
    document.title = appSettings.appTitle;

    if (appSettings.defaultBgImage) {
      const overlay = theme === 'dark'
        ? 'linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.8))'
        : 'linear-gradient(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.85))';
      document.body.style.backgroundImage = `${overlay}, url(${appSettings.defaultBgImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
    }
  }, [appSettings, theme]);

  // Lắng nghe danh sách trận đấu
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'matches'), orderBy('matchTime', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMatches = snapshot.docs.map((docSnap) => {
        const m = docSnap.data();
        return {
          id: docSnap.id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          matchTime: m.matchTime,
          handicap: Number(m.handicap),
          status: m.status,
          result: m.result,
          createdAt: m.createdAt
        };
      });
      setMatches(loadedMatches);
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Lỗi tải danh sách trận đấu (permission-denied). Hãy đảm bảo đã deploy firestore.rules mới lên Firebase để cho phép Guest xem.");
        return;
      }
      console.error("Lỗi realtime matches:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Lắng nghe danh sách dự đoán cược của user hiện tại
  useEffect(() => {
    if (!user || user.isGuest) return;
    const q = query(collection(db, 'predictions'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const predMap: { [matchId: string]: any } = {};
      snapshot.docs.forEach((docSnap) => {
        const p = docSnap.data();
        predMap[p.matchId] = {
          id: docSnap.id,
          userId: p.userId,
          matchId: p.matchId,
          predictedChoice: p.predictedChoice,
          modificationCount: p.modificationCount,
          isLocked: p.isLocked,
          isCorrect: p.isCorrect,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt
        };
      });
      setPredictions(predMap);
    }, (error) => {
      if (error.code === 'permission-denied') return;
      console.error("Lỗi realtime user predictions:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Lắng nghe danh sách toàn bộ User (cho Bảng xếp hạng Excel)
  useEffect(() => {
    if (!user) return;
    if (viewMode !== 'leaderboard') return;
    const q = query(collection(db, 'users'), orderBy('totalPoints', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => {
        const u = docSnap.data();
        return {
          uid: docSnap.id,
          displayName: u.displayName || 'Người dùng mới',
          avatarUrl: u.avatarUrl || '',
          totalPoints: u.totalPoints || 0,
          role: u.role || 'user'
        };
      });
      setUsers(list);
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Lỗi tải danh sách users leaderboard (permission-denied). Hãy đảm bảo đã deploy firestore.rules mới lên Firebase để cho phép Guest xem.");
        return;
      }
      console.error("Lỗi realtime users leaderboard:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [viewMode, user]);

  // Lắng nghe toàn bộ dự đoán (cho Bảng xếp hạng Excel)
  useEffect(() => {
    if (!user) return;
    if (viewMode !== 'leaderboard') return;
    const q = collection(db, 'predictions');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const predMap: { [key: string]: any } = {};
      snapshot.docs.forEach((docSnap) => {
        const p = docSnap.data();
        const key = `${p.userId}_${p.matchId}`;
        predMap[key] = {
          id: docSnap.id,
          userId: p.userId,
          matchId: p.matchId,
          predictedChoice: p.predictedChoice,
          modificationCount: p.modificationCount,
          isLocked: p.isLocked,
          isCorrect: p.isCorrect
        };
      });
      setAllPredictions(predMap);
    }, (error) => {
      if (error.code === 'permission-denied') {
        console.warn("Lỗi tải danh sách predictions (permission-denied). Hãy đảm bảo đã deploy firestore.rules mới lên Firebase để cho phép Guest xem.");
        return;
      }
      console.error("Lỗi realtime all predictions:", error);
    });

    return () => {
      unsubscribe();
    };
  }, [viewMode, user]);

  // Thực hiện đặt cược
  const handlePredict = async (match: Match, choice: 'home' | 'away' | 'draw') => {
    if (!user) return;
    if (user.isGuest) {
      showToast(t('loginRequireAlert'), 'warning');
      return;
    }
    try {
      setSubmittingMatchId(match.id!);
      await submitPrediction(user.uid, match, choice, appSettings.matchLockTimeMinutes);
      showToast(language === 'vi' ? "Đặt dự đoán thành công!" : "Prediction submitted successfully!", 'success');
    } catch (err: any) {
      showToast(err?.message || (language === 'vi' ? "Đặt cược thất bại. Vui lòng thử lại!" : "Prediction failed. Please try again!"), 'error');
    } finally {
      setSubmittingMatchId(null);
    }
  };

  // Định dạng ngày giờ thi đấu
  const formatMatchTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen w-screen pb-12">
      {/* Warning Ticker Banner */}
      <div id="marquee-ticker">
        <MarqueeTicker />
      </div>

      {/* Premium Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 md:px-8 md:py-4">
          <div className="flex items-center gap-2 md:gap-3" id="app-logo">
            <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-md glow-primary shrink-0">
              <Trophy className="h-4.5 w-4.5 md:h-5 md:w-5" />
            </div>
            <span className="text-sm md:text-lg font-bold tracking-wider bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent uppercase truncate max-w-[120px] sm:max-w-none">
              {appSettings.appTitle}
            </span>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            {/* Admin Dashboard link */}
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 rounded-lg bg-purple-600/20 px-2 py-1 md:px-3 md:py-1.5 text-xs font-semibold text-purple-300 border border-purple-500/20 hover:bg-purple-600/30 transition-all duration-200"
              >
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t('adminPanel')}</span>
              </Link>
            )}

            {/* User Profile */}
            <div className="flex items-center gap-1.5 md:gap-3 rounded-xl border border-white/5 bg-white/5 px-2 py-1 md:px-3 md:py-1.5">
              <img
                src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                alt={user.displayName}
                className="h-6 w-6 md:h-7 md:w-7 rounded-full border border-white/20 bg-slate-800"
              />
              <div className="hidden text-left md:block">
                <p className="text-xs font-semibold text-slate-200">{user.isGuest ? t('guestRole') : user.displayName}</p>
                <p className="text-[10px] text-slate-400 font-mono capitalize">{user.isGuest ? 'guest' : user.role}</p>
              </div>
              <div className="flex items-center gap-1 rounded bg-yellow-500/20 px-1 py-0.5 md:px-1.5 md:py-0.5 text-xs font-bold text-yellow-400 shadow-sm shrink-0" id="points-indicator">
                {user.isGuest ? <Lock className="h-3 w-3 text-yellow-500/70" /> : <Award className="h-3 w-3" />}
                <span>{user.isGuest ? '-' : `${user.totalPoints}${t('pointsUnit')}`}</span>
              </div>
            </div>

            {/* Guide Tour Manual Trigger */}
            <button
              onClick={startTour}
              id="tour-trigger"
              className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all duration-200 shrink-0"
              title={language === 'vi' ? 'Xem hướng dẫn' : 'View Guide Tour'}
            >
              <HelpCircle className="h-4 w-4 text-blue-400" />
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex h-8 md:h-9 items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 px-2 text-xs font-bold text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all duration-200"
              title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            >
              <Globe className="h-3.5 w-3.5" />
              <span className="text-[10px] md:text-xs">{language === 'vi' ? 'VI' : 'EN'}</span>
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all duration-200 shrink-0"
              title={theme === 'dark' ? t('lightMode') : t('darkMode')}
            >
              {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            {/* Logout or Login */}
            {user.isGuest ? (
              <button
                onClick={() => loginWithGoogle()}
                className="flex h-8 md:h-9 items-center justify-center gap-1.5 rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 text-xs font-bold text-blue-300 hover:bg-blue-500/20 transition-all duration-200 shrink-0"
                title={t('signInBtn')}
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">{t('signInBtn')}</span>
              </button>
            ) : (
              <button
                onClick={() => logout()}
                className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200 shrink-0"
                title={t('logout')}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Floor */}
      <main className="mx-auto max-w-5xl px-4 pt-10 md:px-8">

        {/* Welcome Board */}
        <div className="glass-panel relative mb-10 rounded-2xl p-6 md:p-8 shadow-xl overflow-hidden" id="predict-floor-welcome">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-60" />
          <h2 className="text-xl font-extrabold text-white md:text-2xl">
            {t('predictFloorTitle')}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {t('predictFloorDesc', { lockTime: appSettings.matchLockTimeMinutes })}
          </p>
          {user.isGuest && (
            <div className="mt-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400/90 font-medium">
              ⚠️ {t('loginRequireAlert')}
            </div>
          )}
          <div className="mt-3 text-[10px] text-slate-500 font-mono">
            {t('systemTime')}: {now.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US')}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-4 mb-6 border-b border-white/5 pb-2">
          <button
            onClick={() => setViewMode('matches')}
            id="tab-predict-floor"
            className={`pb-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 ${viewMode === 'matches' ? 'text-blue-400 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
          >
            {t('tabPredictFloor')}
          </button>
          <button
            onClick={() => setViewMode('leaderboard')}
            id="tab-excel-leaderboard"
            className={`pb-2.5 text-sm font-bold uppercase tracking-wider transition-all duration-200 border-b-2 ${viewMode === 'leaderboard' ? 'text-blue-400 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
          >
            {t('tabExcelLeaderboard')}
          </button>
        </div>

        {/* Matches Feed / Leaderboard view */}
        {viewMode === 'matches' ? (
          <div className="space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <span>{t('matchListTitle')}</span>
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-ping" />
            </h3>

            {matches.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 border border-white/5">
                <HelpCircle className="mx-auto h-12 w-12 text-slate-600 mb-3 animate-bounce" />
                <p className="text-sm">{t('noMatches')}</p>
                {user.role === 'admin' && (
                  <Link to="/admin" className="mt-4 inline-block text-xs text-purple-400 underline hover:text-purple-300 font-semibold">
                    {t('createMatchHere')}
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {matches.map((match, index) => {
                  const userPred = predictions[match.id!];
                  const locked = isMatchLocked(match, appSettings.matchLockTimeMinutes);
                  const modCount = userPred?.modificationCount || 0;
                  const limitReached = modCount >= 2;

                  const matchTimeDate = match.matchTime.toDate ? match.matchTime.toDate() : new Date(match.matchTime);
                  const isAutoCompleted = match.status !== 'completed' && now.getTime() >= matchTimeDate.getTime() + 120 * 60 * 1000;

                  return (
                    <div
                      key={match.id}
                      id={index === 0 ? "first-match-card" : undefined}
                      className="glass-panel rounded-2xl p-6 relative border border-white/5 flex flex-col justify-between hover:shadow-xl hover:shadow-black/25 transition-all duration-300 overflow-hidden"
                    >
                      {/* Status Light overlay */}
                      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-white/5" />

                      {/* Top Row: Date & Status Badges */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono text-slate-400 font-semibold flex items-center gap-1">
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {formatMatchTime(match.matchTime)}
                        </span>

                        {/* Status badge */}
                        {(match.status === 'completed' || isAutoCompleted) ? (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wide">
                            {t('matchStatusCompleted')}
                          </span>
                        ) : match.status === 'live' ? (
                          <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wide animate-pulse">
                            {t('matchStatusLive')}
                          </span>
                        ) : (
                          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[9px] font-bold text-blue-400 uppercase tracking-wide">
                            {t('matchStatusScheduled')}
                          </span>
                        )}
                      </div>

                      {/* Middle Row: Matchup details */}
                      <div className="flex items-center justify-between py-2 mb-4 bg-white/[0.01] rounded-xl px-2 border border-white/5">
                        {/* Home */}
                        <div className="flex flex-col items-center gap-1.5 w-5/12 text-center">
                          <img
                              src={match.homeTeam.logoUrl}
                              alt=""
                              className="h-10 w-10 object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.05)]"
                          />
                          <span className="text-xs font-bold text-slate-200 truncate w-full">{match.homeTeam.name}</span>
                        </div>

                        {/* Handicap Middle */}
                        <div className="flex flex-col items-center justify-center gap-1 w-2/12 shrink-0">
                          {match.status === 'completed' && match.result ? (
                            <span className="text-base font-extrabold text-white font-mono bg-slate-900 px-2.5 py-0.5 rounded-lg border border-white/10">
                              {match.result.homeScore}-{match.result.awayScore}
                            </span>
                          ) : isAutoCompleted ? (
                            <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider bg-yellow-500/10 px-1.5 py-0.5 rounded-md border border-yellow-500/20 text-center whitespace-nowrap">
                              {t('updating')}
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">VS</span>
                          )}
                          <span className="rounded dark:bg-slate-800/80 bg-white/10 px-1.5 py-0.5 font-bold text-[8px] text-yellow-400 border border-yellow-500/10">
                            {match.handicap === 0 ? t('hoaKeoLabel') : t('handicapLabel', { val: match.handicap })}
                          </span>
                        </div>

                        {/* Away */}
                        <div className="flex flex-col items-center gap-1.5 w-5/12 text-center">
                          <img
                              src={match.awayTeam.logoUrl}
                              alt=""
                              className="h-10 w-10 object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.05)]"
                          />
                          <span className="text-xs font-bold text-slate-200 truncate w-full">{match.awayTeam.name}</span>
                        </div>
                      </div>

                      {/* Bottom Row: Predictions Platform */}
                      <div className="mt-auto space-y-3">
                        {/* If completed, display result with colorful status */}
                        {match.status === 'completed' ? (
                          <div className="space-y-2">
                            {userPred ? (
                              <div className={`flex flex-col items-center gap-2 rounded-xl p-3 border text-center transition-all ${userPred.isCorrect
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/10 border-red-500/20 text-red-400'
                                }`}>
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                                  {userPred.isCorrect ? (
                                    <>
                                      <ThumbsUp className="h-4 w-4 animate-bounce" />
                                      <span>{t('predictCorrect')}</span>
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="h-4 w-4" />
                                      <span>{t('predictWrong')}</span>
                                    </>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {t('yourChoiceLabel')}: <span className="font-bold underline uppercase">{
                                    userPred.predictedChoice === 'home' ? t('choiceHomeTitle') :
                                      userPred.predictedChoice === 'away' ? t('choiceAwayTitle') : t('choiceDrawTitle')
                                  }</span>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-xl dark:bg-white bg-gray-200 p-3 border text-black border-white/5 text-center text-[10px] italic">
                                {t('noPredictionMade')}
                              </div>
                            )}
                          </div>
                        ) : isAutoCompleted ? (
                          <div className="space-y-2">
                            {userPred ? (
                              <div className="flex flex-col items-center gap-2 rounded-xl p-3 border text-center bg-blue-500/10 border-blue-500/20 text-blue-400">
                                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider">
                                  <Lock className="h-4 w-4" />
                                  <span>{t('awaitingResult')}</span>
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  {t('yourChoiceLabel')}: <span className="font-bold underline uppercase">{
                                    userPred.predictedChoice === 'home' ? t('choiceHomeTitle') :
                                      userPred.predictedChoice === 'away' ? t('choiceAwayTitle') : t('choiceDrawTitle')
                                  }</span>
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-xl dark:bg-white bg-gray-200 p-3 border text-black border-white/5 text-center text-[10px] italic">
                                {t('noPredictionMade')}
                              </div>
                            )}
                          </div>
                        ) : (
                          // If cược is open / live
                          <div>
                            {/* Locked Status Header */}
                            {(locked || limitReached) && (
                              <div className="mb-2 flex items-center justify-center gap-1 text-[10px] text-yellow-400/90 font-medium">
                                <Lock className="h-3 w-3 shrink-0" />
                                <span>
                                  {locked
                                    ? t('lockedBetTime')
                                    : t('lockedBetLimit')}
                                </span>
                              </div>
                            )}

                            {/* Prediction Selector Buttons */}
                            <div className="flex gap-2" id={index === 0 ? "match-prediction-buttons-demo" : undefined}>
                              {(match.handicap === 0 ? (['home', 'draw', 'away'] as const) : (['home', 'away'] as const)).map((choice) => {
                                const isSelected = userPred?.predictedChoice === choice;
                                const isInteractive = !locked && !limitReached && !user.isGuest;

                                let btnStyle = "flex-1 rounded-xl py-2 px-1 text-[10px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ";

                                if (isSelected) {
                                  btnStyle += "bg-blue-600 border-blue-500 text-white glow-primary scale-[1.02] ";
                                } else {
                                  btnStyle += "bg-white/5 border-white/5 text-slate-400 ";
                                  if (isInteractive) {
                                    btnStyle += "hover:bg-white/10 hover:text-white active:scale-95 ";
                                  } else {
                                    btnStyle += "opacity-40 cursor-not-allowed ";
                                  }
                                }

                                const choiceLabel =
                                  choice === 'home' ? t('choiceHome') :
                                    choice === 'away' ? t('choiceAway') : t('choiceDraw');

                                return (
                                  <button
                                    key={choice}
                                    type="button"
                                    disabled={!isInteractive || submittingMatchId === match.id}
                                    onClick={() => handlePredict(match, choice)}
                                    className={btnStyle}
                                  >
                                    {submittingMatchId === match.id && isSelected ? (
                                      <div className="h-4.5 w-4.5 animate-spin rounded-full border border-t-transparent" />
                                    ) : (
                                      <>
                                        <span>{choiceLabel}</span>
                                        {isSelected && <span className="text-[7px] bg-black/30 px-1 py-0.5 rounded uppercase tracking-widest text-blue-200">{t('choiceSelected')}</span>}
                                      </>
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {/* Modification tracker info */}
                            {!user.isGuest && (
                              <div className="mt-2.5 flex items-center justify-between text-[9px] text-slate-500 px-1" id={index === 0 ? "match-mod-tracker-demo" : undefined}>
                                <span className="font-semibold">
                                  {t('modificationCountLabel')}: <span className={modCount >= 2 ? 'text-red-400 font-bold' : modCount === 1 ? 'text-yellow-400' : 'text-slate-400'}>{modCount}/2</span>
                                </span>
                                {!locked && !limitReached && (
                                  <span className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 text-slate-600" />
                                    <span>{t('modificationLimitTip')}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Bảng xếp hạng dạng Excel */
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>{t('spreadsheetTitle')}</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              </h3>
              <div className="flex items-center gap-4 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-emerald-500/20 border border-emerald-500/30" /> {t('legendWin')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-red-500/20 border border-red-500/30" /> {t('legendLoss')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-blue-500/10 border border-blue-500/20" /> {t('legendPlaced')}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm border border-slate-700" /> {t('legendNotPlaced')}
                </span>
              </div>
            </div>

            {users.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 text-center text-slate-500 border border-white/5">
                <p className="text-sm">Đang tải danh sách bảng xếp hạng...</p>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto w-full max-h-[600px] custom-scrollbar" id="spreadsheet-table">
                  <table className="w-full border-collapse text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-950/80 sticky top-0 z-20 backdrop-blur-md">
                        <th 
                          style={{ minWidth: '48px', maxWidth: '48px', width: '48px' }}
                          className="p-4 font-bold text-slate-200 uppercase tracking-wider text-center sticky left-0 bg-slate-950/90 z-30"
                        >
                          {t('thRank')}
                        </th>
                        <th 
                          style={{ minWidth: '160px', maxWidth: '160px', width: '160px' }}
                          className="p-4 font-bold text-slate-200 uppercase tracking-wider sticky left-12 bg-slate-950/90 z-30 border-r border-white/5"
                        >
                          {t('thMember')}
                        </th>
                        <th 
                          style={{ minWidth: '96px', maxWidth: '96px', width: '96px' }}
                          className="p-4 font-bold text-slate-200 uppercase tracking-wider text-center border-r border-white/5 sticky left-52 bg-slate-950/90 z-30"
                          id="th-total-points"
                        >
                          {t('thTotalPoints')}
                        </th>
                        {matches.map((match) => (
                          <th
                            key={match.id}
                            className="p-4 font-bold text-slate-200 uppercase tracking-wider min-w-[110px] text-center border-r border-white/5 select-none"
                            title={`${match.homeTeam.name} vs ${match.awayTeam.name} (${match.handicap === 0 ? t('hoaKeoLabel') : t('handicapLabel', { val: match.handicap })})`}
                          >
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="text-[10px] text-slate-300 font-mono">
                                {getTeamAbbr(match.homeTeam.name)}-{getTeamAbbr(match.awayTeam.name)}
                              </span>
                              <span className="text-[8px] px-1 py-0.2 bg-slate-800 rounded text-yellow-400 font-normal">
                                {match.handicap === 0 ? t('hoaKeoLabel') : t('handicapLabel', { val: match.handicap })}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {users.map((rowUser, index) => {
                        const rank = index + 1;
                        const isMe = rowUser.uid === user.uid;

                        return (
                          <tr
                            key={rowUser.uid}
                            className={`transition-colors hover:bg-white/[0.02] ${isMe ? 'bg-blue-500/5' : ''}`}
                          >
                            {/* Rank cell */}
                            <td 
                              style={{ minWidth: '48px', maxWidth: '48px', width: '48px' }}
                              className="p-4 text-center font-bold sticky left-0 bg-slate-900/90 z-10"
                            >
                              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                            </td>

                            {/* Member profile cell */}
                            <td 
                              style={{ minWidth: '160px', maxWidth: '160px', width: '160px' }}
                              className="p-4 sticky left-12 bg-slate-900/90 z-10 border-r border-white/5 flex items-center gap-2"
                            >
                              <img
                                src={rowUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg'}
                                alt=""
                                className="h-6 w-6 rounded-full bg-slate-800 border border-white/10"
                              />
                              <span className="font-semibold text-slate-200 truncate max-w-[90px]" title={rowUser.displayName}>
                                {rowUser.displayName}
                              </span>
                              {isMe && (
                                <span className="text-[8px] bg-blue-500/20 text-blue-300 font-bold px-1 rounded uppercase tracking-wider shrink-0">{t('meBadge')}</span>
                              )}
                            </td>

                            {/* Points cell */}
                            <td 
                              style={{ minWidth: '96px', maxWidth: '96px', width: '96px' }}
                              className="p-4 text-center border-r border-white/5 font-bold text-slate-100 sticky left-52 bg-slate-900/90 z-10"
                            >
                              <span className="inline-flex items-center gap-1 rounded bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-400 border border-yellow-500/10">
                                {rowUser.totalPoints}{t('pointsUnit')}
                              </span>
                            </td>

                            {/* Predictions cells for matches */}
                            {matches.map((match) => {
                              const predDocId = `${rowUser.uid}_${match.id}`;
                              const pred = allPredictions[predDocId];
                              const locked = isMatchLocked(match, appSettings.matchLockTimeMinutes);

                              // Bảo mật chống sao chép cược: Ẩn cược của user khác nếu chưa khóa trận đấu
                              const hidePrediction = !locked && !isMe;

                              let cellContent = '-';
                              let cellClass = 'p-4 text-center border-r border-white/5 text-slate-500 font-mono text-[10px] ';
                              let cellTooltip = undefined;

                              if (pred) {
                                if (hidePrediction) {
                                  cellContent = '🔒';
                                  cellClass += 'text-yellow-500/70 font-sans';
                                } else {
                                  if (match.status === 'completed') {
                                    if (pred.isCorrect) {
                                      cellContent = t('winCellText');
                                      cellClass += 'cell-thang ';
                                      cellTooltip = t('predictCorrect');
                                    } else {
                                      cellContent = t('lossCellText');
                                      cellClass += 'cell-thua ';
                                      cellTooltip = t('predictWrong');
                                    }
                                  } else {
                                    const choiceLabel =
                                      pred.predictedChoice === 'home' ? t('choiceHomeAbbr') :
                                        pred.predictedChoice === 'away' ? t('choiceAwayAbbr') : t('choiceDrawAbbr');

                                    cellContent = choiceLabel;
                                    cellClass += 'bg-blue-500/10 text-blue-300 border border-blue-500/10 ';

                                    cellTooltip = pred.predictedChoice === 'home' ? t('tooltipPredictedHome') :
                                      pred.predictedChoice === 'away' ? t('tooltipPredictedAway') : t('tooltipPredictedDraw');
                                  }
                                }
                              }

                              return (
                                <td
                                  key={match.id}
                                  className={cellClass}
                                  title={cellTooltip}
                                >
                                  {cellContent}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

// SVG Calendar icon helper
const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

export default Home;
