/**
 * アプリのルーティング設定
 * ログイン状態に応じてログイン画面 or メイン画面を表示する
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import Workout from './pages/Workout';
import CalendarPage from './pages/CalendarPage';
import Progress from './pages/Progress';
import Protein from './pages/Protein';

// ログイン状態によって表示を切り替えるコンポーネント
function AppRoutes() {
  const { user, loading } = useAuth();

  // ログイン状態確認中はローディング表示
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        fontSize: '24px',
      }}>
        💪
      </div>
    );
  }

  // 未ログインならログイン画面を表示
  if (!user) {
    return <Login />;
  }

  // ログイン済みならメイン画面を表示
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"         element={<Home />} />
        <Route path="/workout"  element={<Workout />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/protein"  element={<Protein />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
