import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';

// Định nghĩa kiểu dữ liệu User trong hệ thống của chúng ta
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  role: 'user' | 'admin';
  totalPoints: number;
  createdAt?: any;
  isGuest?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const handleUserSession = async (fUser: FirebaseUser | null) => {
      setFirebaseUser(fUser);

      // Dọn dẹp listener real-time cũ nếu có
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (fUser) {
        const userDocRef = doc(db, 'users', fUser.uid);
        
        try {
          // Thử lấy thông tin user từ collection users trong Firestore
          const docSnap = await getDoc(userDocRef);

          if (!docSnap.exists()) {
            // Nếu user chưa tồn tại trong DB, tự động tạo hồ sơ mới dựa trên Google Metadata
            const newUser = {
              uid: fUser.uid,
              email: fUser.email || '',
              displayName: fUser.displayName || 'Người dùng mới',
              avatarUrl: fUser.photoURL || '',
              role: 'user' as const, // Mặc định ban đầu
              totalPoints: 0,
              createdAt: serverTimestamp()
            };

            await setDoc(userDocRef, newUser);
            
            setUser({
              uid: newUser.uid,
              email: newUser.email,
              displayName: newUser.displayName,
              avatarUrl: newUser.avatarUrl,
              role: newUser.role,
              totalPoints: newUser.totalPoints,
            });
          } else {
            const userProfile = docSnap.data();
            setUser({
              uid: fUser.uid,
              email: userProfile.email || '',
              displayName: userProfile.displayName || '',
              avatarUrl: userProfile.avatarUrl || '',
              role: userProfile.role || 'user',
              totalPoints: userProfile.totalPoints || 0,
              createdAt: userProfile.createdAt,
            });
          }
        } catch (err) {
          console.error("Lỗi khi tải thông tin user:", err);
        }

        // Lắng nghe sự thay đổi real-time của document user để đồng bộ tức thì
        unsubscribeProfile = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            const updatedProfile = snap.data();
            setUser({
              uid: snap.id,
              email: updatedProfile.email || '',
              displayName: updatedProfile.displayName || '',
              avatarUrl: updatedProfile.avatarUrl || '',
              role: updatedProfile.role || 'user',
              totalPoints: updatedProfile.totalPoints || 0,
              createdAt: updatedProfile.createdAt,
            });
          }
          setLoading(false);
        }, (error) => {
          console.error("Lỗi realtime user profile:", error);
          setLoading(false);
        });

        // Đảm bảo tắt loading nếu snapshot listener chậm phản hồi
        setTimeout(() => setLoading(false), 2000);
      } else {
        const isGuest = sessionStorage.getItem('is_guest') === 'true';
        if (isGuest) {
          const savedLang = localStorage.getItem('language') || 'vi';
          setUser({
            uid: 'guest',
            email: 'guest@predictfootball.local',
            displayName: savedLang === 'vi' ? 'Khách' : 'Guest',
            avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
            role: 'user',
            totalPoints: 0,
            isGuest: true
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    };

    // Lắng nghe thay đổi trạng thái đăng nhập từ Firebase Auth
    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      await handleUserSession(fUser);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      sessionStorage.removeItem('is_guest');
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Lỗi đăng nhập Google với Firebase:", error);
      setLoading(false);
      throw error;
    }
  };

  const continueAsGuest = () => {
    sessionStorage.setItem('is_guest', 'true');
    const savedLang = localStorage.getItem('language') || 'vi';
    setUser({
      uid: 'guest',
      email: 'guest@predictfootball.local',
      displayName: savedLang === 'vi' ? 'Khách' : 'Guest',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
      role: 'user',
      totalPoints: 0,
      isGuest: true
    });
    setLoading(false);
  };

  const logout = async () => {
    try {
      setLoading(true);
      sessionStorage.removeItem('is_guest');
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error("Lỗi đăng xuất với Firebase:", error);
      setLoading(false);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, loginWithGoogle, logout, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
