import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Link } from 'react-router-dom';
import MarqueeTicker from '../components/MarqueeTicker';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  createMatch, 
  deleteMatch, 
  updateMatchStatus, 
  editCompletedMatchResult,
} from '../lib/services/matchService';
import type { Match } from '../lib/services/matchService';
import { 
  getAppSettings, 
  updateAppSettings, 
} from '../lib/services/settingsService';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Calendar, 
  Plus, 
  Settings as SettingsIcon, 
  Trash2, 
  Play, 
  Check, 
  Edit,
  Upload, 
  Info,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'matches' | 'add' | 'settings'>('matches');
  const [matches, setMatches] = useState<Match[]>([]);

  // States for Add Match Form
  const [homeTeamName, setHomeTeamName] = useState('');
  const [homeTeamLogo, setHomeTeamLogo] = useState('');
  const [awayTeamName, setAwayTeamName] = useState('');
  const [awayTeamLogo, setAwayTeamLogo] = useState('');
  const [handicap, setHandicap] = useState(0);
  const [matchDate, setMatchDate] = useState('');
  const [matchTime, setMatchTime] = useState('');
  const [isSubmittingMatch, setIsSubmittingMatch] = useState(false);

  // States for Settings Form
  const [appTitle, setAppTitle] = useState('');
  const [defaultBgImage, setDefaultBgImage] = useState('');
  const [matchLockTimeMinutes, setMatchLockTimeMinutes] = useState(15);
  const [isSubmittingSettings, setIsSubmittingSettings] = useState(false);

  // States for Completion Modal
  const [showCompModal, setShowCompModal] = useState(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [winningKeeo, setWinningKeeo] = useState<'home' | 'away' | 'draw'>('home');
  const [isCompletingMatch, setIsCompletingMatch] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load matches real-time
  useEffect(() => {
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
      console.error("Lỗi realtime matches trong Admin:", error);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      const appSettings = await getAppSettings();
      setAppTitle(appSettings.appTitle);
      setDefaultBgImage(appSettings.defaultBgImage);
      setMatchLockTimeMinutes(appSettings.matchLockTimeMinutes);
    };
    fetchSettings();
  }, []);

  // Cập nhật background body động theo theme và defaultBgImage tương tự Home.tsx
  useEffect(() => {
    if (appTitle) {
      document.title = `${appTitle} - Admin`;
    } else {
      document.title = 'Football Predict - Admin';
    }

    if (defaultBgImage) {
      const overlay = theme === 'dark' 
        ? 'linear-gradient(rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.95))' 
        : 'linear-gradient(rgba(241, 245, 249, 0.9), rgba(241, 245, 249, 0.95))';
      document.body.style.backgroundImage = `${overlay}, url(${defaultBgImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundAttachment = 'fixed';
    } else {
      document.body.style.backgroundImage = '';
    }
  }, [appTitle, defaultBgImage, theme]);

  // Tự động chuyển trận đấu sang Live khi đến giờ thi đấu
  useEffect(() => {
    if (!user || user.role !== 'admin' || matches.length === 0) return;

    const checkAndStartLive = () => {
      const nowTime = new Date();
      matches.forEach((match) => {
        if (match.status === 'scheduled' && match.id) {
          const matchTimeDate = match.matchTime.toDate 
            ? match.matchTime.toDate() 
            : new Date(match.matchTime);
          
          if (nowTime >= matchTimeDate) {
            console.log(`Tự động chuyển Live cho: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
            updateMatchStatus(match.id, 'live').catch((err) => {
              console.error("Lỗi khi tự động chuyển Live:", err);
            });
          }
        }
      });
    };

    checkAndStartLive();
    const interval = setInterval(checkAndStartLive, 5000);
    return () => clearInterval(interval);
  }, [matches, user]);

  // Handle Base64 file conversions
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setImgState: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024 * 1.5) { // Giới hạn 1.5MB cho ảnh Base64
      showToast(t('settingsImageTooBig'), 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImgState(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Match Form
  const handleAddMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTeamName || !awayTeamName || !matchDate || !matchTime) {
      showToast(t('formRequiredAlert'), 'warning');
      return;
    }

    try {
      setIsSubmittingMatch(true);
      const combinedDateTime = new Date(`${matchDate}T${matchTime}`);
      
      await createMatch({
        homeTeam: {
          name: homeTeamName,
          logoUrl: homeTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + homeTeamName
        },
        awayTeam: {
          name: awayTeamName,
          logoUrl: awayTeamLogo || 'https://api.dicebear.com/7.x/identicon/svg?seed=' + awayTeamName
        },
        matchTime: combinedDateTime.toISOString(),
        handicap: Number(handicap),
      });

      // Clear Form
      setHomeTeamName('');
      setHomeTeamLogo('');
      setAwayTeamName('');
      setAwayTeamLogo('');
      setHandicap(0);
      setMatchDate('');
      setMatchTime('');
      setActiveTab('matches');
      showToast(t('formAddSuccess'), 'success');
    } catch (err) {
      console.error(err);
      showToast(t('formAddError'), 'error');
    } finally {
      setIsSubmittingMatch(false);
    }
  };

  // Submit Settings Form
  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingSettings(true);
      await updateAppSettings({
        appTitle,
        defaultBgImage,
        matchLockTimeMinutes: Number(matchLockTimeMinutes)
      });
      showToast(t('settingsSaveSuccess'), 'success');
    } catch (err) {
      console.error(err);
      showToast(t('settingsSaveError'), 'error');
    } finally {
      setIsSubmittingSettings(false);
    }
  };

  // Delete Match
  const handleDeleteMatch = async (matchId: string) => {
    if (!window.confirm(t('btnDeleteConfirm'))) return;
    try {
      await deleteMatch(matchId);
      showToast(language === 'vi' ? 'Đã xóa trận đấu thành công!' : 'Match deleted successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(t('formAddError'), 'error');
    }
  };

  // Start Match Live
  const handleStartLive = async (matchId: string) => {
    try {
      await updateMatchStatus(matchId, 'live');
      showToast(language === 'vi' ? 'Trận đấu đã chuyển sang Live!' : 'Match is now Live!', 'success');
    } catch (err) {
      console.error(err);
      showToast(t('liveStatusError'), 'error');
    }
  };

  // Open Completion Modal
  const openCompleteModal = (matchId: string) => {
    setSelectedMatchId(matchId);
    setHomeScore(0);
    setAwayScore(0);
    setWinningKeeo('home');
    setIsEditing(false);
    setShowCompModal(true);
  };

  // Open Edit Modal for Completed Match
  const openEditModal = (
    matchId: string, 
    currentHomeScore: number, 
    currentAwayScore: number, 
    currentWinningKeeo: 'home' | 'away' | 'draw'
  ) => {
    setSelectedMatchId(matchId);
    setHomeScore(currentHomeScore);
    setAwayScore(currentAwayScore);
    setWinningKeeo(currentWinningKeeo);
    setIsEditing(true);
    setShowCompModal(true);
  };

  // Confirm Match Completion or Edit Result and Calculate Points
  const handleConfirmCompletion = async () => {
    if (!selectedMatchId) return;
    try {
      setIsCompletingMatch(true);
      if (isEditing) {
        await editCompletedMatchResult(selectedMatchId, {
          homeScore,
          awayScore,
          winningKeeo
        });
        showToast(t('modalSuccessMsgEdit'), 'success');
      } else {
        await updateMatchStatus(selectedMatchId, 'completed', {
          homeScore,
          awayScore,
          winningKeeo
        });
        showToast(t('modalSuccessMsg'), 'success');
      }
      setShowCompModal(false);
      setSelectedMatchId(null);
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      showToast(t('modalErrorMsg') + (err?.message || String(err)), 'error');
    } finally {
      setIsCompletingMatch(false);
    }
  };

  // Helper format date
  const formatMatchTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen w-screen flex-col pb-12">
      {/* Warning Ticker Banner */}
      <MarqueeTicker />

      {/* Header */}
      <header className="border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 md:px-8 md:py-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>{t('backToHome')}</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
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

            <div className="flex items-center gap-2 text-purple-400 font-semibold text-xs border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 rounded-full shrink-0">
              <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
              <span className="hidden sm:inline">{t('adminMode')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-6xl px-3 pt-6 md:px-8 md:pt-8 w-full flex-1">
        
        {/* Page Banner */}
        <div className="glass-panel relative mb-6 rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500 opacity-60" />
          <h2 className="text-xl font-extrabold text-white sm:text-2xl">
            {t('adminModeTitle')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('adminModeDesc')}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 mb-6 gap-1 md:gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 text-xs font-semibold border-b-2 transition-all duration-200 shrink-0 ${
              activeTab === 'matches'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>{t('tabMatchList')} ({matches.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 text-xs font-semibold border-b-2 transition-all duration-200 shrink-0 ${
              activeTab === 'add'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>{t('tabAddMatch')}</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-2.5 md:px-4 md:py-3 text-xs font-semibold border-b-2 transition-all duration-200 shrink-0 ${
              activeTab === 'settings'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <SettingsIcon className="h-4 w-4" />
            <span>{t('tabSettings')}</span>
          </button>
        </div>

        {/* Tab CONTENT 1: Match List */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {/* Desktop View Table */}
            <div className="hidden md:block glass-panel rounded-xl overflow-hidden border border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-white/[0.02] text-slate-400 font-semibold border-b border-white/5 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">{t('thAdminTime')}</th>
                      <th className="px-6 py-4 text-center">{t('thAdminMatchHandicap')}</th>
                      <th className="px-6 py-4">{t('thAdminStatus')}</th>
                      <th className="px-6 py-4">{t('thAdminResult')}</th>
                      <th className="px-6 py-4 text-right">{t('thAdminActions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300">
                    {matches.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                          {t('noMatchesAdmin')}
                        </td>
                      </tr>
                    ) : (
                      matches.map((match) => (
                        <tr key={match.id} className="hover:bg-white/[0.01] transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-400">
                            {formatMatchTime(match.matchTime)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <div className="flex items-center gap-2 justify-end w-28">
                                <span className="font-semibold text-right truncate">{match.homeTeam.name}</span>
                                <img src={match.homeTeam.logoUrl} alt="" className="h-6 w-6 object-contain" />
                              </div>
                              <span className="rounded bg-slate-800 px-2 py-0.5 font-bold text-[10px] text-yellow-400">
                                {match.handicap === 0 ? t('hoaKeoLabel') : t('handicapLabel', { val: match.handicap })}
                              </span>
                              <div className="flex items-center gap-2 w-28">
                                <img src={match.awayTeam.logoUrl} alt="" className="h-6 w-6 object-contain" />
                                <span className="font-semibold truncate">{match.awayTeam.name}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {match.status === 'scheduled' && (
                              <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
                                {t('statusScheduled')}
                              </span>
                            )}
                            {match.status === 'live' && (
                              <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-400 animate-pulse">
                                {t('statusLive')}
                              </span>
                            )}
                            {match.status === 'completed' && (
                              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                {t('statusCompleted')}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {match.status === 'completed' && match.result ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-slate-100 font-mono text-sm">
                                  {match.result.homeScore} - {match.result.awayScore}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {t('actualWinnerLabel')}: <span className="text-purple-400 capitalize">{
                                    match.result.winningKeeo === 'home' ? t('choiceHome') :
                                    match.result.winningKeeo === 'away' ? t('choiceAway') : t('choiceDraw')
                                  }</span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {match.status === 'scheduled' && (
                                <button
                                  onClick={() => handleStartLive(match.id!)}
                                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm"
                                  title={t('btnLive')}
                                >
                                  <Play className="h-3 w-3" />
                                  <span>{t('btnLive')}</span>
                                </button>
                              )}
                              {match.status === 'live' && (
                                <button
                                  onClick={() => openCompleteModal(match.id!)}
                                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm"
                                  title={t('btnComplete')}
                                >
                                  <Check className="h-3 w-3" />
                                  <span>{t('btnComplete')}</span>
                                </button>
                              )}
                              {match.status === 'completed' && (
                                <button
                                  onClick={() => openEditModal(match.id!, match.result?.homeScore || 0, match.result?.awayScore || 0, match.result?.winningKeeo || 'home')}
                                  className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 transition-colors shadow-sm"
                                  title={t('btnEdit')}
                                >
                                  <Edit className="h-3 w-3" />
                                  <span>{t('btnEdit')}</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteMatch(match.id!)}
                                className="rounded-lg border border-white/5 bg-white/5 p-1.5 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                                title="Delete Match"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="space-y-4 md:hidden">
              {matches.length === 0 ? (
                <div className="glass-panel rounded-xl p-8 text-center text-slate-500 border border-white/5">
                  {t('noMatchesAdmin')}
                </div>
              ) : (
                matches.map((match) => (
                  <div key={match.id} className="glass-panel rounded-xl p-4 border border-white/5 flex flex-col gap-4 relative">
                    {/* Top bar: Time and Status */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-400">
                        {formatMatchTime(match.matchTime)}
                      </span>
                      <div>
                        {match.status === 'scheduled' && (
                          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
                            {t('statusScheduled')}
                          </span>
                        )}
                        {match.status === 'live' && (
                          <span className="rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-[10px] font-bold text-red-400 animate-pulse">
                            {t('statusLive')}
                          </span>
                        )}
                        {match.status === 'completed' && (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                            {t('statusCompleted')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Mid block: Teams, logos, handicap */}
                    <div className="flex items-center justify-between gap-2 py-2">
                      <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                        <img src={match.homeTeam.logoUrl} alt="" className="h-10 w-10 object-contain" />
                        <span className="font-semibold text-xs text-center truncate w-full text-slate-200">{match.homeTeam.name}</span>
                      </div>

                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <span className="rounded bg-slate-800 px-2 py-0.5 font-bold text-[10px] text-yellow-400">
                          {match.handicap === 0 ? t('hoaKeoLabel') : t('handicapLabel', { val: match.handicap })}
                        </span>
                        {match.status === 'completed' && match.result && (
                          <span className="font-bold text-slate-100 font-mono text-base mt-1">
                            {match.result.homeScore} - {match.result.awayScore}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                        <img src={match.awayTeam.logoUrl} alt="" className="h-10 w-10 object-contain" />
                        <span className="font-semibold text-xs text-center truncate w-full text-slate-200">{match.awayTeam.name}</span>
                      </div>
                    </div>

                    {/* Completed result details */}
                    {match.status === 'completed' && match.result && (
                      <div className="text-center text-[10px] text-slate-500 border-t border-white/5 pt-2">
                        {t('actualWinnerLabel')}: <span className="text-purple-400 font-semibold capitalize">{
                          match.result.winningKeeo === 'home' ? t('choiceHome') :
                          match.result.winningKeeo === 'away' ? t('choiceAway') : t('choiceDraw')
                        }</span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-3">
                      <div className="flex gap-2 flex-1">
                        {match.status === 'scheduled' && (
                          <button
                            onClick={() => handleStartLive(match.id!)}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500 transition-colors shadow-sm flex-1"
                          >
                            <Play className="h-3 w-3" />
                            <span>{t('btnLive')}</span>
                          </button>
                        )}
                        {match.status === 'live' && (
                          <button
                            onClick={() => openCompleteModal(match.id!)}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors shadow-sm flex-1"
                          >
                            <Check className="h-3 w-3" />
                            <span>{t('btnComplete')}</span>
                          </button>
                        )}
                        {match.status === 'completed' && (
                          <button
                            onClick={() => openEditModal(match.id!, match.result?.homeScore || 0, match.result?.awayScore || 0, match.result?.winningKeeo || 'home')}
                            className="flex items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold text-white hover:bg-purple-500 transition-colors shadow-sm flex-1"
                          >
                            <Edit className="h-3 w-3" />
                            <span>{t('btnEdit')}</span>
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteMatch(match.id!)}
                        className="rounded-lg border border-white/5 bg-white/5 p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                        title="Delete Match"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab CONTENT 2: Add Match Form */}
        {activeTab === 'add' && (
          <div className="glass-panel max-w-2xl mx-auto rounded-xl p-5 sm:p-8 shadow-lg relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-pink-500 opacity-60" />
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-400" />
              <span>{t('addMatchHeader')}</span>
            </h3>

            <form onSubmit={handleAddMatch} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {/* Home Team */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{t('formHomeTeam')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('formHomePlaceholder')}
                    value={homeTeamName}
                    onChange={(e) => setHomeTeamName(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-xs admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                  <div className="space-y-2">
                    <span className="block text-[10px] text-slate-500">{t('formHomeLogo')}</span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 text-xs text-slate-400 hover:bg-white/[0.05] cursor-pointer sm:w-1/2 shrink-0">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{t('formUploadBtn')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setHomeTeamLogo)}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        placeholder={t('formUrlPlaceholder')}
                        value={homeTeamLogo.startsWith('data:') ? '' : homeTeamLogo}
                        onChange={(e) => setHomeTeamLogo(e.target.value)}
                        className="rounded-lg px-3 py-1.5 text-xs admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50 sm:w-1/2 flex-1"
                      />
                    </div>
                    {homeTeamLogo && (
                      <div className="flex items-center gap-2 rounded-lg bg-black/20 p-2 border border-white/5 w-fit">
                        <img src={homeTeamLogo} alt="Preview Logo" className="h-8 w-8 object-contain" />
                        <span className="text-[10px] text-slate-500 max-w-[150px] truncate">{t('logoLoadedMsg')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Away Team */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{t('formAwayTeam')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('formAwayPlaceholder')}
                    value={awayTeamName}
                    onChange={(e) => setAwayTeamName(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-xs admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                  <div className="space-y-2">
                    <span className="block text-[10px] text-slate-500">{t('formAwayLogo')}</span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-3 text-xs text-slate-400 hover:bg-white/[0.05] cursor-pointer sm:w-1/2 shrink-0">
                        <Upload className="h-3.5 w-3.5" />
                        <span>{t('formUploadBtn')}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setAwayTeamLogo)}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        placeholder={t('formUrlPlaceholder')}
                        value={awayTeamLogo.startsWith('data:') ? '' : awayTeamLogo}
                        onChange={(e) => setAwayTeamLogo(e.target.value)}
                        className="rounded-lg px-3 py-1.5 text-xs admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50 sm:w-1/2 flex-1"
                      />
                    </div>
                    {awayTeamLogo && (
                      <div className="flex items-center gap-2 rounded-lg bg-black/20 p-2 border border-white/5 w-fit">
                        <img src={awayTeamLogo} alt="Preview Logo" className="h-8 w-8 object-contain" />
                        <span className="text-[10px] text-slate-500 max-w-[150px] truncate">{t('logoLoadedMsg')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {/* Handicap */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{t('formHandicapSelect')}</label>
                  <select
                    value={handicap}
                    onChange={(e) => setHandicap(Number(e.target.value))}
                    className="w-full rounded-lg px-4 py-2.5 text-xs admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  >
                    <option value={0} className="bg-slate-900">{t('formHandicap0')}</option>
                    <option value={0.5} className="bg-slate-900">{t('formHandicap05')}</option>
                    <option value={1} className="bg-slate-900">{t('formHandicap10')}</option>
                    <option value={1.5} className="bg-slate-900">{t('formHandicap15')}</option>
                    <option value={2} className="bg-slate-900">{t('formHandicap20')}</option>
                  </select>
                </div>

                {/* Match Date */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{t('formDate')}</label>
                  <input
                    type="date"
                    required
                    value={matchDate}
                    onChange={(e) => setMatchDate(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-xs admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>

                {/* Match Time */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{t('formTime')}</label>
                  <input
                    type="time"
                    required
                    value={matchTime}
                    onChange={(e) => setMatchTime(e.target.value)}
                    className="w-full rounded-lg px-4 py-2.5 text-xs admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingMatch}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-xs font-bold text-white hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-500/10 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmittingMatch ? t('formSubmittingMsg') : t('formSubmitBtn')}
              </button>
            </form>
          </div>
        )}

        {/* Tab CONTENT 3: Settings Form */}
        {activeTab === 'settings' && (
          <div className="glass-panel max-w-2xl mx-auto rounded-xl p-5 sm:p-8 shadow-lg relative">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-indigo-500 opacity-60" />
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-purple-400" />
              <span>{t('settingsHeader')}</span>
            </h3>

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              {/* App Title */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{t('settingsAppTitle')}</label>
                <input
                  type="text"
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  className="w-full rounded-lg px-4 py-2.5 text-xs admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                />
              </div>

              {/* Lock Time */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <span>{t('settingsLockTime')}</span>
                  <div className="group relative">
                     <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                     <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-48 rounded bg-slate-950 p-2 text-[10px] text-slate-300 font-normal leading-normal opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 border border-white/5 shadow-xl">
                       {t('settingsLockTimeTooltip')}
                     </div>
                  </div>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={matchLockTimeMinutes}
                    onChange={(e) => setMatchLockTimeMinutes(Number(e.target.value))}
                    className="w-full rounded-lg pl-4 pr-12 py-2.5 text-xs admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 text-[10px] font-bold">
                    {t('settingsMinutesUnit')}
                  </div>
                </div>
              </div>

              {/* Background Image Upload */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{t('settingsBgImage')}</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <label className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 text-xs text-slate-400 hover:bg-white/[0.05] cursor-pointer sm:w-1/3 shrink-0">
                    <Upload className="h-4 w-4" />
                    <span>{t('formUploadBtn')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, setDefaultBgImage)}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="text"
                    placeholder={t('formUrlPlaceholder')}
                    value={defaultBgImage.startsWith('data:') ? '' : defaultBgImage}
                    onChange={(e) => setDefaultBgImage(e.target.value)}
                    className="rounded-lg px-4 py-2 text-xs admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50 sm:w-2/3 flex-1"
                  />
                </div>
                {defaultBgImage && (
                  <div className="relative rounded-lg overflow-hidden border border-white/5 aspect-video w-full max-w-sm mt-3 bg-black/20 flex items-center justify-center">
                    <img src={defaultBgImage} alt="Background Preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-[10px] text-slate-400 font-mono">{t('settingsPreviewBg')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Settings */}
              <button
                type="submit"
                disabled={isSubmittingSettings}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-xs font-bold text-white hover:from-purple-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-purple-500/10 active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
              >
                {isSubmittingSettings ? t('settingsSubmitting') : t('settingsSubmitBtn')}
              </button>
            </form>
          </div>
        )}

      </main>

      {/* MODAL: Complete Match Dialog */}
      {showCompModal && selectedMatchId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 shadow-2xl relative border border-white/10">
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
              {isEditing ? <Edit className="h-5 w-5 text-purple-400" /> : <Check className="h-5 w-5 text-emerald-400" />}
              <span>{isEditing ? t('modalHeaderEdit') : t('modalHeader')}</span>
            </h3>

            <div className="space-y-6">
              {/* Score Input */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
                <span className="block text-[10px] text-slate-500 text-center uppercase tracking-wider font-bold mb-3">{t('modalScoreTitle')}</span>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-slate-300">{t('modalHomeLabel')}</span>
                    <input
                      type="number"
                      min={0}
                      value={homeScore}
                      onChange={(e) => setHomeScore(Number(e.target.value))}
                      className="w-14 h-12 rounded-lg text-center font-bold text-lg admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                  </div>
                  <span className="text-lg font-bold text-slate-400 mt-5">-</span>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-bold text-slate-300">{t('modalAwayLabel')}</span>
                    <input
                      type="number"
                      min={0}
                      value={awayScore}
                      onChange={(e) => setAwayScore(Number(e.target.value))}
                      className="w-14 h-12 rounded-lg text-center font-bold text-lg admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Winning Handicap Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">{t('modalWinnerLabel')}</label>
                <select
                  value={winningKeeo}
                  onChange={(e) => setWinningKeeo(e.target.value as any)}
                  className="w-full rounded-lg px-4 py-2.5 text-xs admin-input focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                >
                  <option value="home">{t('modalWinnerHome')}</option>
                  <option value="away">{t('modalWinnerAway')}</option>
                  <option value="draw">{t('modalWinnerDraw')}</option>
                </select>
                <p className="text-[10px] text-slate-500 flex items-start gap-1 mt-1 leading-normal">
                  <Info className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                  <span>{t('modalWinnerTooltip')}</span>
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-8">
                <button
                  type="button"
                  onClick={() => { setShowCompModal(false); setIsEditing(false); }}
                  className="w-1/2 rounded-lg border border-white/5 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition-colors"
                >
                  {t('modalCancelBtn')}
                </button>
                <button
                  type="button"
                  disabled={isCompletingMatch}
                  onClick={handleConfirmCompletion}
                  className={`w-1/2 rounded-lg py-2.5 text-xs font-bold text-white transition-colors flex items-center justify-center gap-1.5 ${
                    isEditing ? 'bg-purple-600 hover:bg-purple-500' : 'bg-emerald-600 hover:bg-emerald-500'
                  }`}
                >
                  {isEditing 
                    ? (isCompletingMatch ? t('modalEditingMsg') : t('modalConfirmBtnEdit'))
                    : (isCompletingMatch ? t('modalCompletingMsg') : t('modalConfirmBtn'))}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
