import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReading } from '../../contexts/ReadingContext';
import type { Book, BookSearchResult, ReadingSession } from '../../lib/reading-types';
import { searchBooks } from '../../lib/book-search';
import { calculateSpeedInfo } from '../../lib/reading-speed';
import { calculateStreak, calculateMonthlySummary } from '../../lib/reading-streak';
import { searchByISBN } from '../../lib/isbn-search';
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

function formatTime(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

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
    handleExportImpressions,
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

  const [elapsed, setElapsed] = useState(0);
  const [allSessions, setAllSessions] = useState<ReadingSession[]>([]);
  const [overallSpeed, setOverallSpeed] = useState<number | null>(null);

  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [shortcutSettings, setShortcutSettings] = useState<ShortcutSettings>(loadShortcutSettings);
  const [showSettings, setShowSettings] = useState(false);
  const iosDevice = isIOS();

  // 月次サマリー
  const now = new Date();
  const [summaryYear, setSummaryYear] = useState(now.getFullYear());
  const [summaryMonth, setSummaryMonth] = useState(now.getMonth() + 1);

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

  useEffect(() => {
    if (!activeTimer) {
      setElapsed(0);
      return;
    }
    const update = () =>
      setElapsed(Math.floor((Date.now() - activeTimer.startTime) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeTimer]);

  // セッション読み込み（ダッシュボード集計 + ストリーク + 月次サマリー用）
  useEffect(() => {
    (async () => {
      const sessions = await getAllSessions();
      setAllSessions(sessions);
      const speed = calculateSpeedInfo(sessions);
      setOverallSpeed(speed.effectiveSpeed);
    })();
  }, [getAllSessions, showSessionForm]);

  const totalReadingTimeSec = useMemo(
    () => allSessions.reduce((sum, s) => sum + s.durationSec, 0),
    [allSessions],
  );

  const streakInfo = useMemo(() => calculateStreak(allSessions), [allSessions]);

  const monthlySummary = useMemo(
    () => calculateMonthlySummary(allSessions, summaryYear, summaryMonth),
    [allSessions, summaryYear, summaryMonth],
  );

  // その月に読了した本（最後のセッションがその月にある finished の本）
  const finishedThisMonth = useMemo(() => {
    return books.filter((b) => {
      if (b.status !== 'finished') return false;
      return allSessions.some((s) => {
        if (s.bookId !== b.id) return false;
        const d = new Date(s.startTime);
        return d.getFullYear() === summaryYear && d.getMonth() + 1 === summaryMonth;
      });
    });
  }, [books, allSessions, summaryYear, summaryMonth]);

  const navigateMonth = useCallback(
    (delta: number) => {
      let y = summaryYear;
      let m = summaryMonth + delta;
      if (m < 1) { m = 12; y--; }
      if (m > 12) { m = 1; y++; }
      setSummaryYear(y);
      setSummaryMonth(m);
    },
    [summaryYear, summaryMonth],
  );

  // 前月比
  const pctChange = useMemo(() => {
    if (monthlySummary.prevMonthTimeSec === 0) return null;
    return Math.round(
      ((monthlySummary.totalTimeSec - monthlySummary.prevMonthTimeSec) /
        monthlySummary.prevMonthTimeSec) *
        100,
    );
  }, [monthlySummary]);

  const filteredBooks =
    filter === 'all' ? books : books.filter((b) => b.status === filter);

  const readingCount = books.filter((b) => b.status === 'reading').length;
  const finishedCount = books.filter((b) => b.status === 'finished').length;

  const handleStartReading = useCallback(
    async (bookId: string) => {
      await startTimer(bookId);
      setShowBookSelector(false);
      triggerShortcut(shortcutSettings);
    },
    [startTimer, shortcutSettings],
  );

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

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyMessage}>読み込み中...</div>
      </div>
    );
  }

  if (activeTimer) {
    const book = books.find((b) => b.id === activeTimer.bookId);
    return (
      <div className={styles.timerPage}>
        <div className={styles.timerBookTitle}>読書中</div>
        <div className={styles.timerBookName}>{book?.title ?? '不明な本'}</div>
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
          <div className={styles.statValue}>{formatDuration(totalReadingTimeSec)}</div>
          <div className={styles.statLabel}>累計読書時間</div>
        </div>
        {overallSpeed != null && (
          <div className={styles.statCard}>
            <div className={styles.statValue}>{overallSpeed}</div>
            <div className={styles.statLabel}>p/時間</div>
          </div>
        )}
      </div>

      {/* ストリーク */}
      {(streakInfo.currentStreak > 0 || streakInfo.maxStreak > 0) && (
        <div className={styles.streakSection}>
          <span className={styles.streakIcon}>🔥</span>
          <div className={styles.streakInfo}>
            <span className={styles.streakCurrent}>
              {streakInfo.currentStreak}日連続
            </span>
            <span className={styles.streakMax}>
              最長 {streakInfo.maxStreak}日
            </span>
          </div>
          {streakInfo.readToday && (
            <span className={styles.streakBadge}>済</span>
          )}
        </div>
      )}

      {/* 月次サマリー */}
      <div className={styles.monthlySection}>
        <div className={styles.monthNav}>
          <button className={styles.monthNavBtn} onClick={() => navigateMonth(-1)}>
            ◀
          </button>
          <span className={styles.monthNavLabel}>
            {summaryYear}年{summaryMonth}月
          </span>
          <button className={styles.monthNavBtn} onClick={() => navigateMonth(1)}>
            ▶
          </button>
        </div>

        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <div className={styles.summaryItemValue}>
              {formatDuration(monthlySummary.totalTimeSec)}
            </div>
            <div className={styles.summaryItemLabel}>読書時間</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryItemValue}>{monthlySummary.totalPages}</div>
            <div className={styles.summaryItemLabel}>ページ</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryItemValue}>{monthlySummary.sessionCount}</div>
            <div className={styles.summaryItemLabel}>セッション</div>
          </div>
          <div className={styles.summaryItem}>
            <div className={styles.summaryItemValue}>{monthlySummary.readingDays}</div>
            <div className={styles.summaryItemLabel}>読書日数</div>
          </div>
        </div>

        {pctChange !== null && (
          <div
            className={`${styles.comparison} ${pctChange >= 0 ? styles.comparisonUp : styles.comparisonDown}`}
          >
            前月比 {pctChange >= 0 ? '+' : ''}{pctChange}%
          </div>
        )}

        {monthlySummary.dailyMinutes.some((v) => v > 0) && (
          <>
            <DailyBarChart dailyMinutes={monthlySummary.dailyMinutes} />
            <MonthHeatmap
              year={summaryYear}
              month={summaryMonth}
              dailyMinutes={monthlySummary.dailyMinutes}
            />
          </>
        )}

        {finishedThisMonth.length > 0 && (
          <div className={styles.finishedList}>
            <div className={styles.finishedListTitle}>今月の読了</div>
            {finishedThisMonth.map((b) => (
              <div
                key={b.id}
                className={styles.finishedItem}
                onClick={() => navigate(`/reading/book/${b.id}`)}
              >
                {b.coverUrl ? (
                  <img src={b.coverUrl} alt="" className={styles.finishedCover} />
                ) : (
                  <span className={styles.finishedIcon}>📖</span>
                )}
                <span className={styles.finishedTitle}>{b.title}</span>
              </div>
            ))}
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
            {f === 'all'
              ? `すべて(${books.length})`
              : f === 'reading'
                ? `読書中(${readingCount})`
                : `読了(${finishedCount})`}
          </button>
        ))}
      </div>

      {/* 本一覧 */}
      <div className={styles.bookList}>
        {filteredBooks.length === 0 ? (
          <div className={styles.emptyMessage}>本が登録されていません</div>
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
                  {[book.author, book.genre].filter(Boolean).join(' / ') || '情報なし'}
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
                  style={{
                    marginTop: '6px',
                    fontSize: '12px',
                    wordBreak: 'break-all',
                    cursor: 'pointer',
                    background: '#E8F0EC',
                  }}
                  onClick={() => {
                    navigator.clipboard.writeText(getReturnUrl());
                    alert('コピーしました！');
                  }}
                >
                  {getReturnUrl()}
                  <span style={{ fontSize: '11px', color: '#5B7B6A', marginLeft: '6px' }}>
                    （タップでコピー）
                  </span>
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
          <button
            className={styles.backupBtn}
            style={{ marginTop: '8px' }}
            onClick={handleExportImpressions}
          >
            感想をエクスポート
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
              if (
                mode === 'replace' &&
                !confirm('既存のデータは全て消えます。本当に置き換えますか？')
              ) {
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
                <div className={styles.bookMeta}>{book.author || '著者未設定'}</div>
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

// ===== 本の登録モーダル（バーコード + 検索機能付き） =====
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
    isbn?: string;
  }) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<'scan' | 'search' | 'form'>('scan');
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
  const [isbn, setIsbn] = useState('');

  // バーコードスキャン用
  const [isbnInput, setIsbnInput] = useState('');
  const [isbnSearching, setIsbnSearching] = useState(false);
  const [isbnError, setIsbnError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [scannerActive, setScannerActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const applyISBNResult = useCallback(
    (result: BookSearchResult, isbnCode: string) => {
      setTitle(result.title);
      setAuthor(result.authors.join(', '));
      setGenre(result.genre ?? '');
      setTotalPages(result.pageCount ? String(result.pageCount) : '');
      setCoverUrl(result.coverUrl ?? '');
      setIsbn(isbnCode);
      setStep('form');
    },
    [],
  );

  const handleISBNLookup = useCallback(
    async (isbnCode: string) => {
      const cleaned = isbnCode.replace(/[-\s]/g, '');
      if (!/^\d{10,13}$/.test(cleaned)) {
        setIsbnError('有効なISBNを入力してください');
        return;
      }
      setIsbnSearching(true);
      setIsbnError('');
      try {
        const result = await searchByISBN(cleaned);
        if (result) {
          applyISBNResult(result, cleaned);
        } else {
          setIsbnError('この ISBN の本が見つかりませんでした');
        }
      } catch {
        setIsbnError('検索中にエラーが発生しました');
      }
      setIsbnSearching(false);
    },
    [applyISBNResult],
  );

  // バーコードスキャナー起動
  useEffect(() => {
    if (step !== 'scan') return;
    let cancelled = false;

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import('@zxing/browser');
        if (cancelled || !videoRef.current) return;
        const reader = new BrowserMultiFormatReader();
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result) => {
            if (result && !cancelled) {
              const text = result.getText();
              controls.stop();
              setScannerActive(false);
              handleISBNLookup(text);
            }
          },
        );
        if (cancelled) {
          controls.stop();
        } else {
          controlsRef.current = controls;
          setScannerActive(true);
        }
      } catch {
        if (!cancelled) {
          setCameraError('カメラを利用できません。ISBNを手動入力してください。');
        }
      }
    })();

    return () => {
      cancelled = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
      setScannerActive(false);
    };
  }, [step, handleISBNLookup]);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScannerActive(false);
  }, []);

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
      setSearchError(e instanceof Error ? e.message : '検索中にエラーが発生しました');
    }
    setSearching(false);
    setSearched(true);
  };

  const handleSelectResult = (result: BookSearchResult) => {
    setTitle(result.title);
    setAuthor(result.authors.join(', '));
    setGenre(result.genre ?? '');
    setTotalPages(result.pageCount ? String(result.pageCount) : '');
    setCoverUrl(result.coverUrl ?? '');
    if (result.isbn) setIsbn(result.isbn);
    setStep('form');
  };

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
      isbn: isbn || undefined,
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {step === 'scan' ? (
          <>
            <div className={styles.modalTitle}>バーコードで登録</div>

            {!cameraError && (
              <div className={styles.videoWrap}>
                <video
                  ref={videoRef}
                  className={styles.scanVideo}
                  playsInline
                  muted
                />
                {scannerActive && <div className={styles.scanLine} />}
                {!scannerActive && !cameraError && (
                  <div className={styles.scanLoading}>カメラ起動中...</div>
                )}
              </div>
            )}

            {cameraError && (
              <div className={styles.cameraErrorMsg}>{cameraError}</div>
            )}

            {isbnSearching && (
              <div className={styles.scanLoading}>ISBN を検索中...</div>
            )}
            {isbnError && <div className={styles.errorMessage}>{isbnError}</div>}

            <div className={styles.formGroup} style={{ marginTop: '16px' }}>
              <label className={styles.label}>ISBN を手動入力</label>
              <div className={styles.isbnRow}>
                <input
                  className={styles.input}
                  value={isbnInput}
                  onChange={(e) => setIsbnInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleISBNLookup(isbnInput)}
                  placeholder="978-4-..."
                  inputMode="numeric"
                />
                <button
                  className={styles.searchBtn}
                  onClick={() => handleISBNLookup(isbnInput)}
                  disabled={isbnSearching || !isbnInput.trim()}
                >
                  {isbnSearching ? '...' : '検索'}
                </button>
              </div>
            </div>

            <div className={styles.dividerRow}>
              <span className={styles.dividerLine} />
              <span className={styles.dividerText}>または</span>
              <span className={styles.dividerLine} />
            </div>

            <button
              className={styles.newBookBtn}
              onClick={() => {
                stopScanner();
                setStep('search');
              }}
            >
              タイトルで検索
            </button>
            <button
              className={styles.cancelBtn}
              onClick={() => {
                stopScanner();
                onClose();
              }}
            >
              キャンセル
            </button>
          </>
        ) : step === 'search' ? (
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
                      <img src={r.coverUrl} alt="" className={styles.searchResultCover} />
                    ) : (
                      <div className={styles.searchResultNoCover}>📖</div>
                    )}
                    <div className={styles.searchResultInfo}>
                      <div className={styles.searchResultTitle}>{r.title}</div>
                      <div className={styles.searchResultMeta}>
                        {r.authors.join(', ') || '著者不明'}
                        {r.pageCount ? ` / ${r.pageCount}p` : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searchError && <div className={styles.errorMessage}>{searchError}</div>}
            {results.length === 0 && searched && !searching && !searchError && (
              <div className={styles.emptyMessage}>見つかりませんでした</div>
            )}

            <button className={styles.newBookBtn} onClick={handleManualEntry}>
              手動で入力する
            </button>
            <button className={styles.cancelBtn} onClick={() => setStep('scan')}>
              バーコードに戻る
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
            {isbn && (
              <div className={styles.isbnDisplay}>ISBN: {isbn}</div>
            )}
            <button
              className={styles.submitBtn}
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              登録して読書開始
            </button>
            <button className={styles.cancelBtn} onClick={() => setStep('search')}>
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
  getSessionsForBook: (bookId: string) => Promise<ReadingSession[]>;
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

  useEffect(() => {
    (async () => {
      const sessions = await getSessionsForBook(bookId);
      if (sessions.length > 0) {
        const sorted = [...sessions].sort((a, b) => b.createdAt - a.createdAt);
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
        <div className={styles.modalTitle}>{book?.title ?? '読書記録'}</div>
        <div className={styles.sessionDuration}>
          <div className={styles.sessionDurationValue}>{formatTime(durationSec)}</div>
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

// ===== 日別バーチャート =====
function DailyBarChart({ dailyMinutes }: { dailyMinutes: number[] }) {
  const maxVal = Math.max(...dailyMinutes, 1);
  const days = dailyMinutes.length;
  const barW = 10;
  const gap = 2;
  const chartW = days * (barW + gap);
  const chartH = 80;

  return (
    <div className={styles.barChartWrap}>
      <div className={styles.barChartLabel}>日別読書時間（分）</div>
      <svg
        viewBox={`0 0 ${chartW} ${chartH + 18}`}
        className={styles.barChart}
        preserveAspectRatio="xMidYMid meet"
      >
        {dailyMinutes.map((val, i) => {
          const h = val > 0 ? Math.max((val / maxVal) * chartH, 2) : 0;
          return (
            <g key={i}>
              <rect
                x={i * (barW + gap)}
                y={chartH - h}
                width={barW}
                height={h}
                rx={2}
                fill={val > 0 ? '#5B7B6A' : 'transparent'}
              />
              {(i + 1) % 5 === 0 && (
                <text
                  x={i * (barW + gap) + barW / 2}
                  y={chartH + 14}
                  textAnchor="middle"
                  fontSize="7"
                  fill="#999"
                >
                  {i + 1}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ===== カレンダーヒートマップ =====
function MonthHeatmap({
  year,
  month,
  dailyMinutes,
}: {
  year: number;
  month: number;
  dailyMinutes: number[];
}) {
  const daysInMonth = dailyMinutes.length;
  const firstDow = new Date(year, month - 1, 1).getDay();
  // Mon=0 .. Sun=6
  const startOffset = firstDow === 0 ? 6 : firstDow - 1;

  const maxVal = Math.max(...dailyMinutes, 1);

  function getColor(minutes: number): string {
    if (minutes === 0) return '#EBEDF0';
    const ratio = minutes / maxVal;
    if (ratio < 0.25) return '#C6E4D0';
    if (ratio < 0.5) return '#8BC4A0';
    if (ratio < 0.75) return '#5B9B7A';
    return '#3A5244';
  }

  const cellSize = 18;
  const gap = 3;
  const totalCols = 7;
  const totalRows = Math.ceil((startOffset + daysInMonth) / 7);
  const labelH = 16;
  const svgW = totalCols * (cellSize + gap) - gap;
  const svgH = totalRows * (cellSize + gap) - gap + labelH;

  const dayLabels = ['月', '火', '水', '木', '金', '土', '日'];

  return (
    <div className={styles.heatmapWrap}>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className={styles.heatmap}>
        {dayLabels.map((label, i) => (
          <text
            key={i}
            x={i * (cellSize + gap) + cellSize / 2}
            y={11}
            textAnchor="middle"
            fontSize="8"
            fill="#999"
          >
            {label}
          </text>
        ))}
        {Array.from({ length: daysInMonth }, (_, d) => {
          const pos = startOffset + d;
          const col = pos % 7;
          const row = Math.floor(pos / 7);
          return (
            <g key={d}>
              <rect
                x={col * (cellSize + gap)}
                y={row * (cellSize + gap) + labelH}
                width={cellSize}
                height={cellSize}
                rx={3}
                fill={getColor(dailyMinutes[d])}
              />
              <text
                x={col * (cellSize + gap) + cellSize / 2}
                y={row * (cellSize + gap) + labelH + cellSize / 2 + 3}
                textAnchor="middle"
                fontSize="7"
                fill={dailyMinutes[d] > 0 ? '#fff' : '#bbb'}
              >
                {d + 1}
              </text>
            </g>
          );
        })}
      </svg>
      <div className={styles.heatmapLegend}>
        <span className={styles.legendLabel}>少</span>
        {['#EBEDF0', '#C6E4D0', '#8BC4A0', '#5B9B7A', '#3A5244'].map((c) => (
          <span
            key={c}
            className={styles.legendCell}
            style={{ background: c }}
          />
        ))}
        <span className={styles.legendLabel}>多</span>
      </div>
    </div>
  );
}
