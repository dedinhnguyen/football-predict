import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface Prediction {
  userId: string;
  matchId: string;
  predictedChoice: 'home' | 'away' | 'draw';
  modificationCount: number; // Tối đa là 2
  isLocked: boolean;
  isCorrect: boolean | null; // null: chưa diễn ra, true: thắng kèo, false: thua kèo
  createdAt?: any;
  updatedAt?: any;
}

// Kiểm tra xem trận đấu đã bị khóa dự đoán hay chưa
export const isMatchLocked = (match: any, lockTimeMinutes: number = 15): boolean => {
  if (!match) return true;
  if (match.status === 'live' || match.status === 'completed') return true;

  // Tính thời điểm khóa cược (Ví dụ: matchTime - 15 phút)
  const matchTime = new Date(match.matchTime);
  const lockTime = new Date(matchTime.getTime() - lockTimeMinutes * 60 * 1000);
  
  return new Date() >= lockTime;
};

// Gửi hoặc Cập nhật dự đoán cược của người dùng
export const submitPrediction = async (
  userId: string,
  match: any,
  choice: 'home' | 'away' | 'draw',
  lockTimeMinutes: number = 15
) => {
  try {
    // 1. Kiểm tra khóa cược theo thời gian & trạng thái trận đấu
    if (isMatchLocked(match, lockTimeMinutes)) {
      throw new Error("Trận đấu đã khóa dự đoán (đang diễn ra hoặc đã quá thời gian quy định).");
    }

    const predictionDocId = `${userId}_${match.id}`;
    const docRef = doc(db, 'predictions', predictionDocId);
    
    // 2. Tìm kiếm dự đoán hiện tại
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const existingPred = docSnap.data();
      const currentCount = existingPred.modificationCount || 1;

      // 3. Kiểm tra giới hạn số lần sửa cược (Tối đa 2 lần submit)
      if (currentCount >= 2) {
        throw new Error("Bạn đã hết lượt sửa đổi dự đoán cho trận đấu này (Tối đa 2 lần).");
      }

      // Tiến hành cập nhật cược lần thứ 2
      await updateDoc(docRef, {
        predictedChoice: choice,
        modificationCount: currentCount + 1,
        updatedAt: serverTimestamp()
      });
    } else {
      // Đặt cược lần đầu tiên
      await setDoc(docRef, {
        userId: userId,
        matchId: match.id,
        predictedChoice: choice,
        modificationCount: 1,
        isCorrect: null,
        isLocked: false,
        createdAt: serverTimestamp()
      });
    }
  } catch (error: any) {
    console.error("Lỗi khi ghi nhận dự đoán:", error);
    throw error;
  }
};
