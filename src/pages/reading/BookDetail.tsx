/**
 * 本の詳細画面
 * セッション履歴・集計・評価・ステータス切替を表示する
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReading } from '../../contexts/ReadingContext';
import type { ReadingSession } from '../../lib/reading-types';
import styles from './BookDetail.module.css';

// 秒数を読みやすい形式にフォーマット
function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}時間${m}分`;
  if (m > 0) return `${m}分`;
  return `${totalSec}秒`;
}

// 日時をフォーマット
function formatDate(epochMs: number): string {
  const d = new Date(epochMs);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    books,
    updateBook,
    deleteBook,
    getSessionsForBook,
    updateSession,
    deleteSession,
  } = useReading();

  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [sortAsc, setSortAsc] = useState(false);
  const [editingSession, setEditingSession] =
    useState<ReadingSession | null>(null);

  const book = books.find((b) => b.id === id);

  // セッション一覧を読み込む
  const loadSessions = useCallback(async () => {
    if (!id) return;
    const data = await getSessionsForBook(id);
    setSessions(data);
  }, [id, getSessionsForBook]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  if (!book) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate('/reading')}>
          ← 戻る
        </button>
        <div className={styles.emptyMessage}>本が見つかりません</div>
      </div>
    );
  }

  // 集計
  const totalTimeSec = sessions.reduce((sum, s) => sum + s.durationSec, 0);
  const totalPages = sessions.reduce((sum, s) => {
    if (s.pageFrom != null && s.pageTo != null) {
      return sum + (s.pageTo - s.pageFrom + 1);
    }
    return sum;
  }, 0);
  const progressPercent =
    book.totalPages && totalPages > 0
      ? Math.min(100, Math.round((totalPages / book.totalPages) * 100))
      : null;

  // ソート済みセッション
  const sortedSessions = [...sessions].sort((a, b) =>
    sortAsc ? a.startTime - b.startTime : b.startTime - a.startTime,
  );

  // 評価を設定
  const handleRating = async (rating: 1 | 2 | 3 | 4 | 5) => {
    const newRating = book.rating === rating ? undefined : rating;
    await updateBook({ ...book, rating: newRating });
  };

  // ステータスを切り替え
  const handleToggleStatus = async () => {
    const newStatus = book.status === 'reading' ? 'finished' : 'reading';
    await updateBook({ ...book, status: newStatus } as typeof book);
  };

  // 本を削除
  const handleDeleteBook = async () => {
    if (!confirm(`「${book.title}」を削除しますか？\n関連するセッション記録も失われます。`)) return;
    await deleteBook(book.id);
    navigate('/reading');
  };

  // セッション削除
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('このセッションを削除しますか？')) return;
    await deleteSession(sessionId);
    await loadSessions();
  };

  // セッション編集を保存
  const handleSaveEdit = async (updated: ReadingSession) => {
    await updateSession(updated);
    setEditingSession(null);
    await loadSessions();
  };

  return (
    <div className={styles.page}>
      {/* 戻るボタン */}
      <button className={styles.backBtn} onClick={() => navigate('/reading')}>
        ← 一覧に戻る
      </button>

      {/* 本の情報 */}
      <div className={styles.bookHeader}>
        {book.coverUrl && (
          <img src={book.coverUrl} alt="" className={styles.bookCoverImg} />
        )}
        <div>
          <div className={styles.bookTitle}>{book.title}</div>
          <div className={styles.bookMeta}>
            {[book.author, book.genre, book.totalPages ? `${book.totalPages}ページ` : null]
              .filter(Boolean)
              .join(' / ') || '情報なし'}
          </div>
        </div>
      </div>

      {/* 評価・ステータス */}
      <div className={styles.controls}>
        <div className={styles.ratingRow}>
          {([1, 2, 3, 4, 5] as const).map((n) => (
            <button
              key={n}
              className={styles.star}
              onClick={() => handleRating(n)}
            >
              {book.rating && n <= book.rating ? '★' : '☆'}
            </button>
          ))}
        </div>
        <button
          className={`${styles.statusToggle} ${book.status === 'reading' ? styles.toggleReading : styles.toggleFinished}`}
          onClick={handleToggleStatus}
        >
          {book.status === 'reading' ? '読書中' : '読了'}
        </button>
        <button className={styles.deleteBookBtn} onClick={handleDeleteBook}>
          削除
        </button>
      </div>

      {/* 集計 */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{formatDuration(totalTimeSec)}</div>
          <div className={styles.statLabel}>累計読書時間</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{totalPages}p</div>
          <div className={styles.statLabel}>累計ページ</div>
        </div>
        {progressPercent != null && (
          <div className={styles.statCard}>
            <div className={styles.statValue}>{progressPercent}%</div>
            <div className={styles.statLabel}>読了率</div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* セッション一覧 */}
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          読書セッション ({sessions.length})
        </div>
        <button
          className={styles.sortBtn}
          onClick={() => setSortAsc(!sortAsc)}
        >
          {sortAsc ? '古い順' : '新しい順'}
        </button>
      </div>

      <div className={styles.sessionList}>
        {sortedSessions.length === 0 ? (
          <div className={styles.emptyMessage}>
            まだセッションがありません
          </div>
        ) : (
          sortedSessions.map((session) => (
            <div key={session.id} className={styles.sessionCard}>
              <div className={styles.sessionHeader}>
                <div className={styles.sessionDate}>
                  {formatDate(session.startTime)}
                </div>
                <div className={styles.sessionDuration}>
                  {formatDuration(session.durationSec)}
                </div>
              </div>
              {session.pageFrom != null && session.pageTo != null && (
                <div className={styles.sessionPages}>
                  p.{session.pageFrom} 〜 p.{session.pageTo}
                </div>
              )}
              {session.impression && (
                <div className={styles.sessionImpression}>
                  {session.impression}
                </div>
              )}
              <div className={styles.sessionActions}>
                <button
                  className={styles.editBtn}
                  onClick={() => setEditingSession(session)}
                >
                  編集
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDeleteSession(session.id)}
                >
                  削除
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* セッション編集モーダル */}
      {editingSession && (
        <SessionEditModal
          session={editingSession}
          onSave={handleSaveEdit}
          onClose={() => setEditingSession(null)}
        />
      )}
    </div>
  );
}

// ===== セッション編集モーダル =====
function SessionEditModal({
  session,
  onSave,
  onClose,
}: {
  session: ReadingSession;
  onSave: (updated: ReadingSession) => void;
  onClose: () => void;
}) {
  const [pageFrom, setPageFrom] = useState(
    session.pageFrom != null ? String(session.pageFrom) : '',
  );
  const [pageTo, setPageTo] = useState(
    session.pageTo != null ? String(session.pageTo) : '',
  );
  const [impression, setImpression] = useState(session.impression);

  const handleSubmit = () => {
    onSave({
      ...session,
      pageFrom: pageFrom ? Number(pageFrom) : undefined,
      pageTo: pageTo ? Number(pageTo) : undefined,
      impression: impression.trim(),
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>セッションを編集</div>

        <div className={styles.pageRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>開始ページ</label>
            <input
              className={styles.input}
              type="number"
              value={pageFrom}
              onChange={(e) => setPageFrom(e.target.value)}
              min="1"
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>終了ページ</label>
            <input
              className={styles.input}
              type="number"
              value={pageTo}
              onChange={(e) => setPageTo(e.target.value)}
              min="1"
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>感想</label>
          <textarea
            className={styles.textarea}
            value={impression}
            onChange={(e) => setImpression(e.target.value)}
            placeholder="感想を入力..."
          />
        </div>

        <button className={styles.submitBtn} onClick={handleSubmit}>
          保存
        </button>
        <button className={styles.cancelBtn} onClick={onClose}>
          キャンセル
        </button>
      </div>
    </div>
  );
}
