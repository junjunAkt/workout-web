/**
 * 読書ホーム画面
 * 本の一覧・ダッシュボード・読書開始ボタン・タイマー・セッション記録を管理する
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReading } from '../../contexts/ReadingContext';
import type { Book, BookSearchResult } from '../../lib/reading-types';
import { searchBooks } from '../../lib/book-search';
import { calculateSpeedInfo } from '../../lib/reading-speed';
import {
  loadShortcutSettings,
  saveShortcutSettings,
  triggerShortcut,
  isIOS,
  getReturnUrl,
} from '../../lib/shortcut-settings';
import type { ShortcutSettings } from '../../lib/shortcut-settings';
import styles from './ReadingHome.module.css';

type Filter = 'all' | 'reading' | 'finished';

// 秒数を HH:MM:SS にフォーマット
function formatTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// 秒数を読みやすい形式にフォーマット
function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}時間${m}分`;
  return `${m}分`;
}

export default function ReadingHome() {
  const {
    books,
    activeTimer,
    loading,
    addBook,
    startTimer,
    stopTimer,
    saveSession,
    getAllSessions,
    getSessionsForBook,
    handleExport,
    handleImportReplace,
    handleImportMerge,
  } = useReading();
  const navigate = useNavigate();

  const [filter, setFilter] = useState<Filter>('all');
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [showBookForm, setShowBookForm] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [completedData, setCompletedData] = useState<{
    bookId: string;
    startTime: number;
    endTime: number;
  } | null>(null);

  // タイマーの経過秒数
  const [elapsed, setElapsed] = useState(0);

  // ダッシュボード集計用
  const [totalReadingTimeSec, setTotalReadingTimeSec] = useState(0);
  const [overallSpeed, setOverallSpeed] = useState<number | null>(null);

  // バックアップ
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ショートカット設定
  const [shortcutSettings, setShortcutSettings] = useState<ShortcutSettings>(loadShortcutSettings);
  const [showSettings, setShowSettings] = useState(false);
  const iosDevice = isIOS();

  // ショートカットから戻った時にセッション記録画面を復元
  useEffect(() => {
    const pending = localStorage.getItem('pending_reading_session');
    if (pending) {
      try {
        const data = JSON.parse(pending);
        setCompletedData(data);
        setShowSessionForm(true);
      } catch { /* ignore */ }
      localStorage.removeItem('pending_reading_session');
    }
  }, []);

  // タイマーの更新
  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0);
      return;
    }
    const update = () =>
      setElapsed(
        Math.floor((Date.now() - activeTimer.startTime) / 1000),
      );
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  // ダッシュボード集計
  useEffect(() => {
    (async () => {
      const sessions = await getAllSessions();
      const total = sessions.reduce((sum, s) => sum + s.durationSec, 0);
      setTotalReadingTimeSec(total);
      const speed = calculateSpeedInfo(sessions);
      setOverallSpeed(speed.effectiveSpeed);
    })();
  }, [getAllSessions, showSessionForm]);

  // フィルタリングされた本一覧
  const filteredBooks =
    filter === 'all' ? books : books.filter((b) => b.status === filter);

  const readingCount = books.filter((b) => b.status === 'reading').length;
  const finishedCount = books.filter((b) => b.status === 'finished').length;

  // 読書開始ハンドラー
  const handleStartReading = useCallback(
    async (bookId: string) => {
      await startTimer(bookId);
      setShowBookSelector(false);
      triggerShortcut(shortcutSettings);
    },
    [startTimer, shortcutSettings],
  );

  // 読書終了ハンドラー（タイマー停止→データ保存→ショートカット起動）
  const handleStopReading = useCallback(async () => {
    const data = await stopTimer();
    if (data && shortcutSettings.enabled && shortcutSettings.shortcutName.trim()) {
      localStorage.setItem('pending_reading_session', JSON.stringify(data));
      triggerShortcut(shortcutSettings);
    } else {
      setCompletedData(data);
      setShowSessionForm(true);
    }
  }, [stopTimer, shortcutSettings]);

  // ローディング
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyMessage}>読み込み中...</div>
      </div>
    );
  }

  // タイマー表示中
  if (activeTimer) {
    const book = books.find((b) => b.id === activeTimer.bookId);
    return (
      <div className={styles.timerPage}>
        <div className={styles.timerBookTitle}>読書中</div>
        <div className={styles.timerBookName}>
          {book?.title ?? '不明な本'}
        </div>
        <div className={styles.timerDisplay}>{formatTime(elapsed)}</div>
        <div className={styles.timerLabel}>経過時間</div>
        <button className={styles.stopBtn} onClick={handleStopReading}>
          読書終了
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ダッシュボード */}
      <div className={styles.dashboard}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{books.length}</div>
          <div className={styles.statLabel}>登録冊数</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{finishedCount}</div>
          <div className={styles.statLabel}>読了</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>
            {formatDuration(totalReadingTimeSec)}
          </div>
          <div className={styles.statLabel}>累計読書時間</div>
        </div>
        {overallSpeed != null && (
          <div className={styles.statCard}>
            <div className={styles.statValue}>{overallSpeed}</div>
            <div className={styles.statLabel}>p/時間</div>
          </div>
        )}
      </div>

      {/* 読書開始ボタン */}
      <button
        className={styles.startBtn}
        onClick={() => setShowBookSelector(true)}
      >
        読書を始める
      </button>

      {/* フィルター */}
      <div className={styles.filterRow}>
        {(['all', 'reading', 'finished'] as Filter[]).map((f) => (
          <button
            key={f}
            className={`${styles.filterTab} ${filter === f ? styles.filterTabActive : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? `すべて(${books.length})` : f === 'reading' ? `読書中(${readingCount})` : `読了(${finishedCount})`}
          </button>
        ))}
      </div>

      {/* 本一覧 */}
      <div className={styles.bookList}>
        {filteredBooks.length === 0 ? (
          <div className={styles.emptyMessage}>
            本が登録されていません
          </div>
        ) : (
          filteredBooks.map((book) => (
            <div
              key={book.id}
              className={styles.bookCard}
              onClick={() => navigate(`/reading/book/${book.id}`)}
            >
              {book.coverUrl ? (
                <img src={book.coverUrl} alt="" className={styles.bookCover} />
              ) : (
                <div className={styles.bookIcon}>📖</div>
              )}
              <div className={styles.bookInfo}>
                <div className={styles.bookTitle}>{book.title}</div>
                <div className={styles.bookMeta}>
                  {[book.author, book.genre].filter(Boolean).join(' / ') ||
                    '情報なし'}
                </div>
              </div>
              <div
                className={`${styles.bookStatus} ${book.status === 'reading' ? styles.statusReading : styles.statusFinished}`}
              >
                {book.status === 'reading' ? '読書中' : '読了'}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 本の選択モーダル */}
      {showBookSelector && (
        <BookSelectorModal
          books={books.filter((b) => b.status === 'reading')}
          onSelect={handleStartReading}
          onAddNew={() => {
            setShowBookSelector(false);
            setShowBookForm(true);
          }}
          onClose={() => setShowBookSelector(false)}
        />
      )}

      {/* 本の登録モーダル */}
      {showBookForm && (
        <BookFormModal
          onSave={async (data) => {
            const book = await addBook(data);
            setShowBookForm(false);
            await startTimer(book.id);
            triggerShortcut(shortcutSettings);
          }}
          onClose={() => setShowBookForm(false)}
        />
      )}

      {/* 設定（iOSのみ） */}
      {iosDevice && (
        <div className={styles.settingsSection}>
          <button
            className={styles.settingsToggle}
            onClick={() => setShowSettings(!showSettings)}
          >
            {showSettings ? '▼ 設定を閉じる' : '⚙️ ショートカット連携設定'}
          </button>
          {showSettings && (
            <div className={styles.settingsPanel}>
              <div className={styles.settingsRow}>
                <span className={styles.settingsLabel}>連携を有効にする</span>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={shortcutSettings.enabled}
                    onChange={(e) => {
                      const updated = { ...shortcutSettings, enabled: e.target.checked };
                      setShortcutSettings(updated);
                      saveShortcutSettings(updated);
                    }}
                  />
                  <span className={styles.toggleSlider} />
                </label>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>計測用ショートカット名</label>
                <input
                  className={styles.input}
                  value={shortcutSettings.shortcutName}
                  onChange={(e) => {
                    const updated = { ...shortcutSettings, shortcutName: e.target.value };
                    setShortcutSettings(updated);
                    saveShortcutSettings(updated);
                  }}
                  placeholder="例: 読書タイマー"
                />
                <div className={styles.settingsHint}>
                  iPhoneのショートカットアプリで作成した計測用ショートカットの名前を入力してください。
                  読書開始・終了時に自動で起動します。
                </div>
                <div className={styles.settingsHint} style={{ marginTop: '12px' }}>
                  📌 ショートカット実行後に自動で戻るには、ショートカットの最後に「URLを開く」アクションを追加し、以下のURLを設定してください：
                </div>
                <div
                  className={styles.input}
                  style={{ marginTop: '6px', fontSize: '12px', wordBreak: 'break-all', cursor: 'pointer', background: '#E8F0EC' }}
                  onClick={() => {
                    navigator.clipboard.writeText(getReturnUrl());
                    alert('コピーしました！');
                  }}
                >
                  {getReturnUrl()}
                  <span style={{ fontSize: '11px', color: '#5B7B6A', marginLeft: '6px' }}>（タップでコピー）</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* バックアップ */}
      <div className={styles.settingsSection}>
        <div className={styles.settingsPanel}>
          <div className={styles.settingsLabel} style={{ marginBottom: '12px' }}>
            データのバックアップ
          </div>
          <button className={styles.backupBtn} onClick={handleExport}>
            データをエクスポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const mode = confirm(
                '「OK」→ 既存データを置き換え\n「キャンセル」→ 既存データにマージ（追加のみ）',
              )
                ? 'replace'
                : 'merge';
              if (mode === 'replace' && !confirm('既存のデータは全て消えます。本当に置き換えますか？')) {
                e.target.value = '';
                return;
              }
              try {
                const result =
                  mode === 'replace'
                    ? await handleImportReplace(file)
                    : await handleImportMerge(file);
                setImportMsg(
                  `${result.booksCount}冊・${result.sessionsCount}セッションを${mode === 'replace' ? '読み込み' : '追加'}しました`,
                );
              } catch (err) {
                setImportMsg(
                  err instanceof Error ? err.message : 'インポートに失敗しました',
                );
              }
              e.target.value = '';
            }}
          />
          <button
            className={styles.backupBtn}
            style={{ marginTop: '8px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            データをインポート
          </button>
          {importMsg && (
            <div className={styles.settingsHint} style={{ marginTop: '8px' }}>
              {importMsg}
            </div>
          )}
        </div>
      </div>

      {/* セッション記録モーダル */}
      {showSessionForm && completedData && (
        <SessionFormModal
          bookId={completedData.bookId}
          startTime={completedData.startTime}
          endTime={completedData.endTime}
          books={books}
          getSessionsForBook={getSessionsForBook}
          onSave={async (data) => {
            await saveSession(data);
            setShowSessionForm(false);
            setCompletedData(null);
            localStorage.removeItem('pending_reading_session');
          }}
          onClose={() => {
            setShowSessionForm(false);
            setCompletedData(null);
            localStorage.removeItem('pending_reading_session');
          }}
        />
      )}
    </div>
  );
}

// ===== 本の選択モーダル =====
function BookSelectorModal({
  books,
  onSelect,
  onAddNew,
  onClose,
}: {
  books: Book[];
  onSelect: (bookId: string) => void;
  onAddNew: () => void;
  onClose: () => void;
}) {
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>どの本を読みますか？</div>
        <div className={styles.selectorList}>
          {books.map((book) => (
            <button
              key={book.id}
              className={styles.selectorItem}
              onClick={() => onSelect(book.id)}
            >
              <div className={styles.bookIcon}>📖</div>
              <div className={styles.bookInfo}>
                <div className={styles.bookTitle}>{book.title}</div>
                <div className={styles.bookMeta}>
                  {book.author || '著者未設定'}
                </div>
              </div>
            </button>
          ))}
        </div>
        <button className={styles.newBookBtn} onClick={onAddNew}>
          ＋ 新しい本を登録して読む
        </button>
        <button className={styles.cancelBtn} onClick={onClose}>
          キャンセル
        </button>
      </div>
    </div>
  );
}

// ===== 本の登録モーダル（検索機能付き） =====
function BookFormModal({
  onSave,
  onClose,
}: {
  onSave: (data: {
    title: string;
    author?: string;
    genre?: string;
    totalPages?: number;
    coverUrl?: string;
  }) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'search' | 'form'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [searched, setSearched] = useState(false);

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  // 検索実行
  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError('');
    setSearched(false);
    try {
      const data = await searchBooks(query);
      setResults(data);
    } catch (e) {
      setResults([]);
      setSearchError(
        e instanceof Error ? e.message : '検索中にエラーが発生しました',
      );
    }
    setSearching(false);
    setSearched(true);
  };

  // 検索結果を選択してフォームに反映
  const handleSelectResult = (result: BookSearchResult) => {
    setTitle(result.title);
    setAuthor(result.authors.join(', '));
    setGenre(result.genre ?? '');
    setTotalPages(result.pageCount ? String(result.pageCount) : '');
    setCoverUrl(result.coverUrl ?? '');
    setStep('form');
  };

  // 手動入力に切り替え
  const handleManualEntry = () => {
    setStep('form');
  };

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      author: author.trim() || undefined,
      genre: genre.trim() || undefined,
      totalPages: totalPages ? Number(totalPages) : undefined,
      coverUrl: coverUrl || undefined,
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {step === 'search' ? (
          <>
            <div className={styles.modalTitle}>本を検索</div>
            <div className={styles.searchRow}>
              <input
                className={styles.input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="本のタイトルや著者名で検索..."
                autoFocus
              />
              <button
                className={styles.searchBtn}
                onClick={handleSearch}
                disabled={searching || !query.trim()}
              >
                {searching ? '...' : '検索'}
              </button>
            </div>

            {results.length > 0 && (
              <div className={styles.searchResults}>
                {results.map((r, i) => (
                  <button
                    key={i}
                    className={styles.searchResultItem}
                    onClick={() => handleSelectResult(r)}
                  >
                    {r.coverUrl ? (
                      <img
                        src={r.coverUrl}
                        alt=""
                        className={styles.searchResultCover}
                      />
                    ) : (
                      <div className={styles.searchResultNoCover}>📖</div>
                    )}
                    <div className={styles.searchResultInfo}>
                      <div className={styles.searchResultTitle}>
                        {r.title}
                      </div>
                      <div className={styles.searchResultMeta}>
                        {r.authors.join(', ') || '著者不明'}
                        {r.pageCount ? ` / ${r.pageCount}p` : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchError && (
              <div className={styles.errorMessage}>{searchError}</div>
            )}
            {results.length === 0 && searched && !searching && !searchError && (
              <div className={styles.emptyMessage}>
                見つかりませんでした
              </div>
            )}

            <button className={styles.newBookBtn} onClick={handleManualEntry}>
              手動で入力する
            </button>
            <button className={styles.cancelBtn} onClick={onClose}>
              キャンセル
            </button>
          </>
        ) : (
          <>
            <div className={styles.modalTitle}>本の情報を確認</div>

            {coverUrl && (
              <div className={styles.formCoverPreview}>
                <img src={coverUrl} alt="" className={styles.formCoverImg} />
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>本の名前 *</label>
              <input
                className={styles.input}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 吾輩は猫である"
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>著者</label>
              <input
                className={styles.input}
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="例: 夏目漱石"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>ジャンル</label>
              <input
                className={styles.input}
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="例: 小説"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>全体ページ数</label>
              <input
                className={styles.input}
                type="number"
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                placeholder="例: 320"
                min="1"
              />
            </div>
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              登録して読書開始
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => setStep('search')}
            >
              検索に戻る
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ===== セッション記録モーダル =====
function SessionFormModal({
  bookId,
  startTime,
  endTime,
  books,
  getSessionsForBook,
  onSave,
  onClose,
}: {
  bookId: string;
  startTime: number;
  endTime: number;
  books: Book[];
  getSessionsForBook: (
    bookId: string,
  ) => Promise<import('../../lib/reading-types').ReadingSession[]>;
  onSave: (data: {
    bookId: string;
    startTime: number;
    endTime: number;
    durationSec: number;
    pageFrom?: number;
    pageTo?: number;
    impression: string;
  }) => void;
  onClose: () => void;
}) {
  const durationSec = Math.floor((endTime - startTime) / 1000);
  const book = books.find((b) => b.id === bookId);

  const [pageFrom, setPageFrom] = useState('');
  const [pageTo, setPageTo] = useState('');
  const [impression, setImpression] = useState('');

  // 前回セッションのpageToから初期値を設定
  useEffect(() => {
    (async () => {
      const sessions = await getSessionsForBook(bookId);
      if (sessions.length > 0) {
        const sorted = [...sessions].sort(
          (a, b) => b.createdAt - a.createdAt,
        );
        const lastPageTo = sorted[0].pageTo;
        if (lastPageTo != null) {
          setPageFrom(String(lastPageTo + 1));
        }
      }
    })();
  }, [bookId, getSessionsForBook]);

  const handleSubmit = () => {
    onSave({
      bookId,
      startTime,
      endTime,
      durationSec,
      pageFrom: pageFrom ? Number(pageFrom) : undefined,
      pageTo: pageTo ? Number(pageTo) : undefined,
      impression: impression.trim(),
    });
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>
          {book?.title ?? '読書記録'}
        </div>
        <div className={styles.sessionDuration}>
          <div className={styles.sessionDurationValue}>
            {formatTime(durationSec)}
          </div>
          <div className={styles.sessionDurationLabel}>読書時間</div>
        </div>

        <div className={styles.pageRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>開始ページ</label>
            <input
              className={styles.input}
              type="number"
              value={pageFrom}
              onChange={(e) => setPageFrom(e.target.value)}
              placeholder="例: 1"
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
              placeholder="例: 30"
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
            placeholder="読んだところまでの感想を書いてください..."
          />
        </div>

        <button className={styles.submitBtn} onClick={handleSubmit}>
          記録を保存
        </button>
        <button className={styles.cancelBtn} onClick={onClose}>
          保存せずに閉じる
        </button>
      </div>
    </div>
  );
}
