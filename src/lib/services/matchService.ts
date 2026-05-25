import { db } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  runTransaction, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';

export interface Match {
  id?: string;
  homeTeam: {
    name: string;
    logoUrl: string;
  };
  awayTeam: {
    name: string;
    logoUrl: string;
  };
  matchTime: any; // ISO String Date
  handicap: number; // Kèo chấp: 0, 0.5, 1, 1.5, 2
  status: 'scheduled' | 'live' | 'completed';
  result?: {
    homeScore: number;
    awayScore: number;
    winningKeeo: 'home' | 'away' | 'draw';
  };
  createdAt?: any;
}

// Khởi tạo/Thêm trận đấu mới
export const createMatch = async (matchData: Omit<Match, 'id' | 'status' | 'createdAt'>) => {
  try {
    const matchesCol = collection(db, 'matches');
    const docRef = doc(matchesCol);
    await setDoc(docRef, {
      homeTeam: matchData.homeTeam,
      awayTeam: matchData.awayTeam,
      handicap: Number(matchData.handicap),
      matchTime: matchData.matchTime,
      status: 'scheduled',
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Lỗi khi tạo trận đấu:", error);
    throw error;
  }
};

// Cập nhật thông tin trận đấu (trừ kết quả/trạng thái đặc biệt)
export const updateMatch = async (matchId: string, matchData: Partial<Omit<Match, 'id'>>) => {
  try {
    const docRef = doc(db, 'matches', matchId);
    const updateData: any = {};
    if (matchData.homeTeam !== undefined) updateData.homeTeam = matchData.homeTeam;
    if (matchData.awayTeam !== undefined) updateData.awayTeam = matchData.awayTeam;
    if (matchData.handicap !== undefined) updateData.handicap = Number(matchData.handicap);
    if (matchData.matchTime !== undefined) updateData.matchTime = matchData.matchTime;

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Lỗi khi cập nhật trận đấu:", error);
    throw error;
  }
};

// Xóa trận đấu
export const deleteMatch = async (matchId: string) => {
  try {
    const docRef = doc(db, 'matches', matchId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Lỗi khi xóa trận đấu:", error);
    throw error;
  }
};

// Cập nhật trạng thái trận đấu (scheduled -> live -> completed)
// Khi completed sẽ đi kèm kết quả và tự động tính điểm cho người dùng bằng Transaction
export const updateMatchStatus = async (
  matchId: string, 
  status: 'scheduled' | 'live' | 'completed',
  resultData?: { homeScore: number; awayScore: number; winningKeeo: 'home' | 'away' | 'draw' }
) => {
  try {
    const matchDocRef = doc(db, 'matches', matchId);

    if (status === 'completed' && resultData) {
      // 1. Lấy tất cả dự đoán cho trận đấu này trước khi thực hiện transaction
      const predictionsQuery = query(collection(db, 'predictions'), where('matchId', '==', matchId));
      const predictionsSnap = await getDocs(predictionsQuery);
      
      const predictionDocs: any[] = [];
      predictionsSnap.forEach((docSnap) => {
        predictionDocs.push({ id: docSnap.id, ...docSnap.data() });
      });

      // 2. Chạy transaction nguyên tử
      await runTransaction(db, async (transaction) => {
        const matchSnap = await transaction.get(matchDocRef);
        if (!matchSnap.exists()) {
          throw new Error("Trận đấu không tồn tại");
        }
        
        const matchInfo = matchSnap.data();
        if (matchInfo.status === 'completed') {
          throw new Error("Trận đấu đã được hoàn tất trước đó");
        }

        // Cập nhật trạng thái trận đấu
        transaction.update(matchDocRef, {
          status: 'completed',
          result: resultData
        });

        // Xử lý các dự đoán và cộng điểm
        for (const pred of predictionDocs) {
          const isCorrect = pred.predictedChoice === resultData.winningKeeo;
          const predDocRef = doc(db, 'predictions', pred.id);
          
          transaction.update(predDocRef, {
            isCorrect: isCorrect,
            isLocked: true
          });

          if (isCorrect) {
            const userDocRef = doc(db, 'users', pred.userId);
            transaction.update(userDocRef, {
              totalPoints: increment(1)
            });
          }
        }
      });
    } else {
      // Nếu chỉ đổi sang live hoặc scheduled
      await updateDoc(matchDocRef, { status });
    }
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái trận đấu:", error);
    throw error;
  }
};

// Chỉnh sửa tỷ số & đội thắng kèo của trận đấu đã kết thúc và tự động điều chỉnh điểm số người dùng
export const editCompletedMatchResult = async (
  matchId: string,
  newResult: { homeScore: number; awayScore: number; winningKeeo: 'home' | 'away' | 'draw' }
) => {
  try {
    const matchDocRef = doc(db, 'matches', matchId);

    // 1. Lấy tất cả dự đoán cho trận đấu này
    const predictionsQuery = query(collection(db, 'predictions'), where('matchId', '==', matchId));
    const predictionsSnap = await getDocs(predictionsQuery);
    
    const predictionDocs: any[] = [];
    predictionsSnap.forEach((docSnap) => {
      predictionDocs.push({ id: docSnap.id, ...docSnap.data() });
    });

    // 2. Chạy transaction nguyên tử
    await runTransaction(db, async (transaction) => {
      const matchSnap = await transaction.get(matchDocRef);
      if (!matchSnap.exists()) {
        throw new Error("Trận đấu không tồn tại");
      }
      
      const matchInfo = matchSnap.data();
      if (matchInfo.status !== 'completed') {
        throw new Error("Trận đấu chưa được hoàn thành");
      }

      const oldResult = matchInfo.result;
      const oldWinningKeeo = oldResult?.winningKeeo;

      // Cập nhật kết quả trận đấu
      transaction.update(matchDocRef, {
        result: newResult
      });

      // Điều chỉnh điểm số của người dùng
      for (const pred of predictionDocs) {
        const wasCorrect = oldWinningKeeo ? (pred.predictedChoice === oldWinningKeeo) : false;
        const isNowCorrect = pred.predictedChoice === newResult.winningKeeo;
        const predDocRef = doc(db, 'predictions', pred.id);

        transaction.update(predDocRef, {
          isCorrect: isNowCorrect
        });

        const userDocRef = doc(db, 'users', pred.userId);

        if (wasCorrect && !isNowCorrect) {
          // Trừ đi 1 điểm do đoán sai kết quả mới
          transaction.update(userDocRef, {
            totalPoints: increment(-1)
          });
        } else if (!wasCorrect && isNowCorrect) {
          // Cộng thêm 1 điểm do đoán đúng kết quả mới
          transaction.update(userDocRef, {
            totalPoints: increment(1)
          });
        }
      }
    });
  } catch (error) {
    console.error("Lỗi khi chỉnh sửa kết quả trận đấu:", error);
    throw error;
  }
};

