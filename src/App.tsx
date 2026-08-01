/**
 * アプリのルーティング設定
 * /reading 以下は読書管理アプリ（独立動作）
 * それ以外は筋トレ記録アプリ
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ReadingProvider } from './contexts/ReadingContext';
import Layout from './components/Layout';
import ReadingLayout from './components/ReadingLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import Workout from './pages/Workout';
import CalendarPage from './pages/CalendarPage';
import Progress from './pages/Progress';
import Recovery from './pages/Recovery';
import Protein from './pages/Protein';
import Exercises from './pages/Exercises';
import ExerciseDetail from './pages/ExerciseDetail';
import ReadingHome from './pages/reading/ReadingHome';
import BookDetail from './pages/reading/BookDetail';

// 筋トレアプリ（ログイン必須）
function WorkoutRoutes() {
  const { user, loading } = useAuth();

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

  if (!user) {
    return <Login />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/"         element={<Home />} />
        <Route path="/workout"  element={<Workout />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/exercises"    element={<Exercises />} />
        <Route path="/exercises/:id" element={<ExerciseDetail />} />
        <Route path="/recovery"      element={<Recovery />} />
        <Route path="/progress"      element={<Progress />} />
        <Route path="/protein"       element={<Protein />} />
      </Route>
    </Routes>
  );
}

// 読書管理アプリ（独立動作、Googleログインでデバイス間同期）
function ReadingRoutes() {
  return (
    <ReadingProvider>
      <Routes>
        <Route element={<ReadingLayout />}>
          <Route index element={<ReadingHome />} />
          <Route path="book/:id" element={<BookDetail />} />
        </Route>
      </Routes>
    </ReadingProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/reading/*" element={<ReadingRoutes />} />
          <Route path="/*" element={<WorkoutRoutes />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
