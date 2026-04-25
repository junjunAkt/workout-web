/**
 * Firebase の初期化ファイル
 * Firestore（データベース）と Authentication（ログイン）を設定する
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase の設定値（Firebaseコンソールで確認できる値）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Firebase アプリを初期化
const app = initializeApp(firebaseConfig);

// Firestore データベース
export const db = getFirestore(app);

// Authentication（ログイン機能）
export const auth = getAuth(app);

// Google ログインのプロバイダー
export const googleProvider = new GoogleAuthProvider();
