import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface AppSettings {
  appTitle: string;
  defaultBgImage: string; // Có thể là Base64 hoặc URL
  matchLockTimeMinutes: number; // Mặc định là 15 phút
}

export const getAppSettings = async (): Promise<AppSettings> => {
  try {
    const docRef = doc(db, 'settings', 'app');
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      // Giá trị mặc định nếu chưa được cấu hình
      const defaultSettings: AppSettings = {
        appTitle: 'FOOTBALL PREDICT',
        defaultBgImage: '',
        matchLockTimeMinutes: 15
      };
      await setDoc(docRef, defaultSettings);
      return defaultSettings;
    }

    const data = docSnap.data();
    return {
      appTitle: data.appTitle || 'FOOTBALL PREDICT',
      defaultBgImage: data.defaultBgImage || '',
      matchLockTimeMinutes: data.matchLockTimeMinutes !== undefined ? data.matchLockTimeMinutes : 15
    };
  } catch (error) {
    console.error("Lỗi khi đọc cấu hình ứng dụng:", error);
    return {
      appTitle: 'FOOTBALL PREDICT',
      defaultBgImage: '',
      matchLockTimeMinutes: 15
    };
  }
};

export const updateAppSettings = async (settingsData: Partial<AppSettings>) => {
  try {
    const docRef = doc(db, 'settings', 'app');
    await updateDoc(docRef, settingsData);
  } catch (error) {
    console.error("Lỗi khi cập nhật cấu hình ứng dụng:", error);
    throw error;
  }
};
