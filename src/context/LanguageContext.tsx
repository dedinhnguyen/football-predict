import React, { createContext, useContext, useState } from 'react';

type Language = 'vi' | 'en';

const translations = {
  vi: {
    // Header & Info
    appTitle: 'FOOTBALL PREDICT',
    adminPanel: 'Admin Panel',
    logout: 'Đăng xuất',
    pointsUnit: 'đ',
    points: 'Điểm',
    lightMode: 'Chuyển sang Chế độ sáng',
    darkMode: 'Chuyển sang Chế độ tối',
    systemTime: 'Thời gian hệ thống',
    backToHome: 'Quay lại Trang chủ',
    adminMode: 'Chế độ Quản trị viên (Admin Mode)',
    adminModeTitle: 'Quản trị Hệ thống 🛠️',
    adminModeDesc: 'Thiết lập lịch thi đấu, tỷ lệ chấp handicap và tính điểm real-time khi kết thúc trận.',
    meBadge: 'Tôi',

    // Login
    loginTitle: 'FOOTBALL PREDICT',
    loginDesc: 'Hệ thống dự đoán tỉ số bóng đá & Bảng xếp hạng Excel trực tiếp',
    loginErrorTitle: 'Lỗi xác thực',
    loginErrorDesc: 'Hãy đảm bảo các thông số Firebase và Supabase trong file .env.local đã được điền chính xác, và dịch vụ Google Sign-In đã được bật trên Firebase Console.',
    loginButton: 'Tiếp tục với Google',
    loginTerms: 'Hệ thống bảo mật bởi Google Firebase Authentication. Bằng cách đăng nhập, bạn đồng ý tham gia cuộc đua dự đoán của chúng tôi.',

    // Tabs
    tabPredictFloor: 'Sàn Dự Đoán',
    tabExcelLeaderboard: 'Bảng Xếp Hạng Excel',
    tabMatchList: 'Danh sách Trận đấu',
    tabAddMatch: 'Thêm Trận mới',
    tabSettings: 'Cấu hình Giao diện',

    // Home - Predict Panel
    predictFloorTitle: 'Sàn Dự Đoán Tỉ Số ⚽',
    predictFloorDesc: 'Chọn đội bóng bạn tin là sẽ thắng sau khi đã tính tỷ lệ kèo chấp. Cược sẽ tự động khóa trước khi bóng lăn {lockTime} phút hoặc khi Admin đặt trận đấu sang trực tiếp. Bạn được phép sửa đổi tối đa 2 lần.',
    matchListTitle: 'Danh sách các trận đấu',
    noMatches: 'Chưa có trận đấu nào được tạo trên hệ thống.',
    createMatchHere: 'Tạo trận đấu mới tại đây',
    matchStatusScheduled: 'Sắp đá',
    matchStatusLive: 'Live',
    matchStatusCompleted: 'Kết thúc',
    handicapLabel: 'Chấp {val}',
    hoaKeoLabel: 'Hòa Kèo',

    // Prediction Choices & Status
    choiceHome: 'Đội Nhà',
    choiceAway: 'Đội Khách',
    choiceDraw: 'Hòa',
    choiceHomeAbbr: 'Chủ',
    choiceAwayAbbr: 'Khách',
    choiceDrawAbbr: 'Hòa',
    choiceSelected: 'Đã Chọn',
    
    predictCorrect: 'Đoán chính xác (+1 Điểm)',
    predictWrong: 'Đoán sai (0 Điểm)',
    yourChoiceLabel: 'Lựa chọn của bạn',
    choiceHomeTitle: 'Đội nhà',
    choiceAwayTitle: 'Đội khách',
    choiceDrawTitle: 'Hòa cược',
    noPredictionMade: 'Bạn không tham gia dự đoán trận đấu này.',
    lockedBetTime: 'Đã khóa cược (Trận đấu đang diễn ra hoặc đã sát giờ)',
    lockedBetLimit: 'Đã khóa cược (Hết lượt sửa cược tối đa)',
    modificationCountLabel: 'Lượt chỉnh sửa',
    modificationLimitTip: 'Cược được sửa tối đa 2 lần',

    // Excel Leaderboard
    spreadsheetTitle: 'Bảng điểm Spreadsheet thời gian thực',
    legendWin: 'Thắng (+1đ)',
    legendLoss: 'Thua (0đ)',
    legendPlaced: 'Đã đặt (Đang chờ)',
    legendNotPlaced: 'Chưa cược / Ẩn cược',
    thRank: 'Hạng',
    thMember: 'Thành viên',
    thTotalPoints: 'Tổng điểm',
    tooltipPredictedHome: 'Dự đoán: Đội nhà thắng',
    tooltipPredictedAway: 'Dự đoán: Đội khách thắng',
    tooltipPredictedDraw: 'Dự đoán: Hòa cược',

    // Win/Loss display
    winCellText: 'Thắng',
    lossCellText: 'Thua',

    // Admin Panel - Match List Table
    thAdminTime: 'Thời gian',
    thAdminMatchHandicap: 'Trận đấu (Handicap)',
    thAdminStatus: 'Trạng thái',
    thAdminResult: 'Kết quả thực tế',
    thAdminActions: 'Hành động',
    noMatchesAdmin: 'Chưa có trận đấu nào được tạo. Hãy sang tab "Thêm Trận mới".',
    statusScheduled: 'Sắp diễn ra',
    statusLive: 'Đang trực tiếp',
    statusCompleted: 'Đã hoàn thành',
    actualWinnerLabel: 'Thắng kèo',
    btnLive: 'Trực tiếp',
    btnComplete: 'Hoàn thành',
    btnDeleteConfirm: 'Bạn có chắc chắn muốn xóa trận đấu này? Dữ liệu dự đoán liên quan sẽ mất.',

    // Admin Panel - Add Match
    addMatchHeader: 'Thiết lập trận đấu mới',
    formHomeTeam: 'Đội Nhà (Home Team) *',
    formHomePlaceholder: 'Ví dụ: Arsenal',
    formHomeLogo: 'Logo Đội nhà (Upload file hoặc điền link ảnh)',
    formUploadBtn: 'Tải tệp tin',
    formUrlPlaceholder: 'Dán URL ảnh',
    logoLoadedMsg: 'Logo đã tải',
    formAwayTeam: 'Đội Khách (Away Team) *',
    formAwayPlaceholder: 'Ví dụ: Chelsea',
    formAwayLogo: 'Logo Đội khách (Upload file hoặc điền link ảnh)',
    formHandicapSelect: 'Tỷ lệ Chấp (Handicap) *',
    formHandicap0: '0 (Hòa Kèo)',
    formHandicap05: '0.5 (Chấp nửa trái)',
    formHandicap10: '1.0 (Chấp một trái)',
    formHandicap15: '1.5 (Chấp một trái rưỡi)',
    formHandicap20: '2.0 (Chấp hai trái)',
    formDate: 'Ngày đá *',
    formTime: 'Giờ đá *',
    formSubmitBtn: 'Tạo Trận đấu mới',
    formSubmittingMsg: 'Đang khởi tạo...',
    formRequiredAlert: 'Vui lòng điền đầy đủ thông tin bắt buộc!',
    formAddSuccess: 'Đã thêm trận đấu thành công!',
    formAddError: 'Lỗi khi thêm trận đấu!',

    // Admin Panel - App Settings
    settingsHeader: 'Cấu hình chung ứng dụng',
    settingsAppTitle: 'Tiêu đề ứng dụng (App Title)',
    settingsLockTime: 'Số phút khóa dự đoán trước trận',
    settingsLockTimeTooltip: 'Hệ thống tự động khóa không cho user đặt cược X phút trước khi trận đấu chính thức bắt đầu.',
    settingsMinutesUnit: 'PHÚT',
    settingsBgImage: 'Ảnh nền ứng dụng (Background Image)',
    settingsPreviewBg: 'Xem trước ảnh nền',
    settingsSubmitBtn: 'Lưu cấu hình hệ thống',
    settingsSubmitting: 'Đang lưu cấu hình...',
    settingsSaveSuccess: 'Cập nhật cấu hình ứng dụng thành công!',
    settingsSaveError: 'Lỗi khi lưu cấu hình!',
    settingsImageTooBig: 'Kích thước ảnh quá lớn (Vui lòng chọn ảnh < 1.5MB để tối ưu dung lượng database)',

    // Admin Panel - Completion Modal
    modalHeader: 'Nhập kết quả & Tính điểm dự đoán',
    modalScoreTitle: 'Tỷ số trận đấu',
    modalHomeLabel: 'Đội nhà',
    modalAwayLabel: 'Đội khách',
    modalWinnerLabel: 'Kết quả Thắng Kèo chấp *',
    modalWinnerHome: 'Đội Nhà (Home) thắng kèo',
    modalWinnerAway: 'Đội Khách (Away) thắng kèo',
    modalWinnerDraw: 'Hòa kèo (Draw)',
    modalWinnerTooltip: 'Dựa vào tỷ lệ chấp Handicap ban đầu, bạn hãy tính toán và chỉ định đội bóng nào là đội thắng kèo để cộng điểm cho User đoán chính xác.',
    modalCancelBtn: 'Hủy',
    modalConfirmBtn: 'Xác nhận & Trả điểm',
    modalCompletingMsg: 'Đang cộng điểm...',
    modalSuccessMsg: 'Đã kết thúc trận đấu và tự động cập nhật điểm thành công!',
    modalErrorMsg: 'Lỗi khi cập nhật kết quả trận đấu: '
  },
  en: {
    // Header & Info
    appTitle: 'FOOTBALL PREDICT',
    adminPanel: 'Admin Panel',
    logout: 'Log Out',
    pointsUnit: 'pts',
    points: 'Points',
    lightMode: 'Switch to Light Mode',
    darkMode: 'Switch to Dark Mode',
    systemTime: 'System Time',
    backToHome: 'Back to Home',
    adminMode: 'Admin Mode',
    adminModeTitle: 'System Admin 🛠️',
    adminModeDesc: 'Manage schedules, handicap ratios, and trigger real-time point distribution upon match completion.',
    meBadge: 'Me',

    // Login
    loginTitle: 'FOOTBALL PREDICT',
    loginDesc: 'Football Prediction Floor & Live Excel Leaderboard',
    loginErrorTitle: 'Authentication Error',
    loginErrorDesc: 'Please ensure your Firebase credentials and variables are correct and Google Sign-In is enabled in the Firebase Console.',
    loginButton: 'Continue with Google',
    loginTerms: 'Secured by Google Firebase Authentication. By logging in, you agree to join our prediction competition.',

    // Tabs
    tabPredictFloor: 'Predict Floor',
    tabExcelLeaderboard: 'Excel Leaderboard',
    tabMatchList: 'Match List',
    tabAddMatch: 'Add Match',
    tabSettings: 'UI Settings',

    // Home - Predict Panel
    predictFloorTitle: 'Prediction Floor ⚽',
    predictFloorDesc: 'Select the team you believe will win after applying the handicap. Predictions lock {lockTime} minutes before kickoff or when the Admin sets the match to live. You are allowed up to 2 modifications.',
    matchListTitle: 'Match Schedule',
    noMatches: 'No matches scheduled yet.',
    createMatchHere: 'Create a new match here',
    matchStatusScheduled: 'Upcoming',
    matchStatusLive: 'Live',
    matchStatusCompleted: 'Completed',
    handicapLabel: 'Handicap {val}',
    hoaKeoLabel: 'Draw Refund',

    // Prediction Choices & Status
    choiceHome: 'Home Team',
    choiceAway: 'Away Team',
    choiceDraw: 'Draw',
    choiceHomeAbbr: 'Home',
    choiceAwayAbbr: 'Away',
    choiceDrawAbbr: 'Draw',
    choiceSelected: 'Selected',
    
    predictCorrect: 'Correct Prediction (+1 Point)',
    predictWrong: 'Incorrect Prediction (0 Points)',
    yourChoiceLabel: 'Your choice',
    choiceHomeTitle: 'Home Team',
    choiceAwayTitle: 'Away Team',
    choiceDrawTitle: 'Draw prediction',
    noPredictionMade: 'You did not predict this match.',
    lockedBetTime: 'Predictions locked (Match in progress or near kickoff)',
    lockedBetLimit: 'Predictions locked (Modification limit reached)',
    modificationCountLabel: 'Modifications',
    modificationLimitTip: 'Max 2 modifications allowed',

    // Excel Leaderboard
    spreadsheetTitle: 'Real-time Spreadsheet Leaderboard',
    legendWin: 'Win (+1pt)',
    legendLoss: 'Loss (0pt)',
    legendPlaced: 'Placed (Pending)',
    legendNotPlaced: 'Unpredicted / Hidden',
    thRank: 'Rank',
    thMember: 'Member',
    thTotalPoints: 'Total Points',
    tooltipPredictedHome: 'Prediction: Home Team Win',
    tooltipPredictedAway: 'Prediction: Away Team Win',
    tooltipPredictedDraw: 'Prediction: Draw',

    // Win/Loss display
    winCellText: 'Win',
    lossCellText: 'Loss',

    // Admin Panel - Match List Table
    thAdminTime: 'Kickoff Time',
    thAdminMatchHandicap: 'Match (Handicap)',
    thAdminStatus: 'Status',
    thAdminResult: 'Actual Score',
    thAdminActions: 'Actions',
    noMatchesAdmin: 'No matches created yet. Go to the "Add Match" tab.',
    statusScheduled: 'Scheduled',
    statusLive: 'Live Now',
    statusCompleted: 'Completed',
    actualWinnerLabel: 'Handicap Winner',
    btnLive: 'Live',
    btnComplete: 'Complete',
    btnDeleteConfirm: 'Are you sure you want to delete this match? Associated predictions will be lost.',

    // Admin Panel - Add Match
    addMatchHeader: 'Create New Match',
    formHomeTeam: 'Home Team *',
    formHomePlaceholder: 'e.g., Arsenal',
    formHomeLogo: 'Home Logo (Upload file or paste image URL)',
    formUploadBtn: 'Upload file',
    formUrlPlaceholder: 'Paste Image URL',
    logoLoadedMsg: 'Logo Loaded',
    formAwayTeam: 'Away Team *',
    formAwayPlaceholder: 'e.g., Chelsea',
    formAwayLogo: 'Away Logo (Upload file or paste image URL)',
    formHandicapSelect: 'Handicap Ratio *',
    formHandicap0: '0 (Draw Refund)',
    formHandicap05: '0.5 (Half goal handicap)',
    formHandicap10: '1.0 (One goal handicap)',
    formHandicap15: '1.5 (One and a half goal handicap)',
    formHandicap20: '2.0 (Two goal handicap)',
    formDate: 'Date *',
    formTime: 'Time *',
    formSubmitBtn: 'Create Match',
    formSubmittingMsg: 'Creating...',
    formRequiredAlert: 'Please fill in all required fields!',
    formAddSuccess: 'Match created successfully!',
    formAddError: 'Error creating match!',

    // Admin Panel - App Settings
    settingsHeader: 'Global Application Settings',
    settingsAppTitle: 'App Title',
    settingsLockTime: 'Lock predictions (minutes before kickoff)',
    settingsLockTimeTooltip: 'Locks prediction entry X minutes before the scheduled kickoff time.',
    settingsMinutesUnit: 'MINUTES',
    settingsBgImage: 'Application Background Image',
    settingsPreviewBg: 'Background Preview',
    settingsSubmitBtn: 'Save Settings',
    settingsSubmitting: 'Saving...',
    settingsSaveSuccess: 'Settings saved successfully!',
    settingsSaveError: 'Error saving settings!',
    settingsImageTooBig: 'Image size too large (Please use an image under 1.5MB for better DB performance)',

    // Admin Panel - Completion Modal
    modalHeader: 'Enter Score & Distribute Points',
    modalScoreTitle: 'Match Final Score',
    modalHomeLabel: 'Home Team',
    modalAwayLabel: 'Away Team',
    modalWinnerLabel: 'Winning Handicap Outcome *',
    modalWinnerHome: 'Home Team wins handicap',
    modalWinnerAway: 'Away Team wins handicap',
    modalWinnerDraw: 'Draw / Refund handicap',
    modalWinnerTooltip: 'Calculate based on the initial handicap and specify which option won the bet to reward points to players.',
    modalCancelBtn: 'Cancel',
    modalConfirmBtn: 'Confirm & Payout',
    modalCompletingMsg: 'Processing payout...',
    modalSuccessMsg: 'Match completed and points distributed successfully!',
    modalErrorMsg: 'Error updating match results: '
  }
};

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string, variables?: Record<string, any>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const savedLang = localStorage.getItem('language');
    return (savedLang as Language) || 'vi';
  });

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const next = prev === 'vi' ? 'en' : 'vi';
      localStorage.setItem('language', next);
      return next;
    });
  };

  const t = (key: string, variables?: Record<string, any>): string => {
    const langTranslations = translations[language];
    // @ts-ignore
    let translation = langTranslations[key] || translations['vi'][key] || key;

    if (variables) {
      Object.entries(variables).forEach(([k, val]) => {
        translation = translation.replace(`{${k}}`, String(val));
      });
    }

    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
