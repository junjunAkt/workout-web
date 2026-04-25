/**
 * 認証状態を管理するContext
 * アプリ全体でログイン中のユーザー情報を共有する
 */

import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

type AuthContextType = {
  user: User | null;          // ログイン中のユーザー（nullなら未ログイン）
  loading: boolean;           // ログイン状態の確認中かどうか
  signInWithGoogle: () => Promise<void>;  // Googleでログイン
  logout: () => Promise<void>;            // ログアウト
};

const AuthContext = createContext<AuthContextType | null>(null);

// AuthContext を使うためのカスタムフック
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// アプリ全体をラップするプロバイダー
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ログイン状態の変化を監視する
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Google アカウントでログイン
  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  // ログアウト
  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
