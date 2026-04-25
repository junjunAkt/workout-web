/**
 * アプリのルーティング設定
 * 5つのページをタブナビゲーションで管理する
 */

import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Workout from './pages/Workout';
import CalendarPage from './pages/CalendarPage';
import Progress from './pages/Progress';
import Protein from './pages/Protein';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/"         element={<Home />} />
          <Route path="/workout"  element={<Workout />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/protein"  element={<Protein />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
