/**
 * レイアウトコンポーネント
 * 全画面共通の下部ナビゲーションバーを提供する
 */

import { NavLink, Outlet } from 'react-router-dom';
import styles from './Layout.module.css';

// ナビゲーションのタブ定義
const navItems = [
  { to: '/',         label: 'ホーム',       icon: '🏠' },
  { to: '/workout',  label: '記録',         icon: '➕' },
  { to: '/calendar', label: 'カレンダー',   icon: '📅' },
  { to: '/progress', label: '進捗',         icon: '📈' },
  { to: '/protein',  label: 'プロテイン',   icon: '💊' },
];

export default function Layout() {
  return (
    <div className={styles.wrapper}>
      {/* 各ページのコンテンツがここに表示される */}
      <main className={styles.main}>
        <Outlet />
      </main>

      {/* 下部タブバー */}
      <nav className={styles.tabBar}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `${styles.tabItem} ${isActive ? styles.tabItemActive : ''}`
            }>
            <span className={styles.tabIcon}>{item.icon}</span>
            <span className={styles.tabLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
