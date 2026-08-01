/**
 * 部位別リカバリー画面
 * 既存の記録・種目マスタを読み取り専用で参照し、部位ごとの回復率を表示する。
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { loadDataFromFirestore } from '../lib/firestore';
import { loadExerciseMasters } from '../lib/exercise-storage';
import type { Workout } from '../lib/types';
import type { ExerciseMaster } from '../lib/exercise-types';
import type { MusclePart } from '../lib/recovery-constants';
import { TRACKED_PARTS } from '../lib/recovery-constants';
import {
  getLastTrainedAtByPart,
  getRecoveryRate,
  getRemainingHours,
  getRecoveryState,
  getRecommendedParts,
} from '../lib/recovery';
import { CATEGORY_EMOJI } from '../lib/exercise-types';
import styles from './Recovery.module.css';

const NEUTRAL = '#D3D7DC';

function formatRemaining(remainingHours: number): string {
  const h = Math.ceil(remainingHours);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const rest = h % 24;
    return `あと約${d}d ${rest}h で回復`;
  }
  return `あと約${h}h で回復`;
}

function formatPercent(rate: number | null): string {
  return rate == null ? '—' : `${Math.round(rate * 100)}%`;
}

type PartColors = Record<MusclePart, string>;
type PartRates = Record<MusclePart, number | null>;

// ===== 人体図（前面） =====
function BodyFront({ colors, rates }: { colors: PartColors; rates: PartRates }) {
  return (
    <svg viewBox="0 0 120 210" className={styles.bodySvg} role="img" aria-label="前面の回復状態">
      {/* 頭・首（対象外） */}
      <circle cx="60" cy="16" r="11" fill={NEUTRAL} />
      <rect x="55" y="26" width="10" height="7" fill={NEUTRAL} />
      {/* 肩 */}
      <rect x="26" y="32" width="20" height="12" rx="6" fill={colors['肩']} />
      <rect x="74" y="32" width="20" height="12" rx="6" fill={colors['肩']} />
      {/* 胸 */}
      <rect x="44" y="32" width="32" height="26" rx="6" fill={colors['胸']} />
      {/* 腹 */}
      <rect x="46" y="60" width="28" height="30" rx="6" fill={colors['腹']} />
      {/* 腕 */}
      <rect x="22" y="46" width="12" height="44" rx="6" fill={colors['腕']} />
      <rect x="86" y="46" width="12" height="44" rx="6" fill={colors['腕']} />
      {/* 脚 */}
      <rect x="42" y="94" width="16" height="64" rx="7" fill={colors['脚']} />
      <rect x="62" y="94" width="16" height="64" rx="7" fill={colors['脚']} />
      {/* %ラベル（色覚対応） */}
      <text x="60" y="48" className={styles.svgLabel}>{formatPercent(rates['胸'])}</text>
      <text x="60" y="77" className={styles.svgLabel}>{formatPercent(rates['腹'])}</text>
      <text x="28" y="105" className={styles.svgLabelDark}>{formatPercent(rates['腕'])}</text>
      <text x="97" y="30" className={styles.svgLabelDark}>{formatPercent(rates['肩'])}</text>
      <text x="60" y="130" className={styles.svgLabel}>{formatPercent(rates['脚'])}</text>
      <text x="60" y="175" className={styles.svgCaption}>前面</text>
    </svg>
  );
}

// ===== 人体図（背面） =====
function BodyBack({ colors, rates }: { colors: PartColors; rates: PartRates }) {
  return (
    <svg viewBox="0 0 120 210" className={styles.bodySvg} role="img" aria-label="背面の回復状態">
      {/* 頭・首（対象外） */}
      <circle cx="60" cy="16" r="11" fill={NEUTRAL} />
      <rect x="55" y="26" width="10" height="7" fill={NEUTRAL} />
      {/* 肩 */}
      <rect x="26" y="32" width="20" height="12" rx="6" fill={colors['肩']} />
      <rect x="74" y="32" width="20" height="12" rx="6" fill={colors['肩']} />
      {/* 背中 */}
      <rect x="44" y="32" width="32" height="42" rx="6" fill={colors['背中']} />
      {/* 腰（対象外） */}
      <rect x="46" y="76" width="28" height="14" rx="6" fill={NEUTRAL} />
      {/* 腕 */}
      <rect x="22" y="46" width="12" height="44" rx="6" fill={colors['腕']} />
      <rect x="86" y="46" width="12" height="44" rx="6" fill={colors['腕']} />
      {/* 脚 */}
      <rect x="42" y="94" width="16" height="64" rx="7" fill={colors['脚']} />
      <rect x="62" y="94" width="16" height="64" rx="7" fill={colors['脚']} />
      {/* %ラベル（色覚対応） */}
      <text x="60" y="56" className={styles.svgLabel}>{formatPercent(rates['背中'])}</text>
      <text x="28" y="105" className={styles.svgLabelDark}>{formatPercent(rates['腕'])}</text>
      <text x="97" y="30" className={styles.svgLabelDark}>{formatPercent(rates['肩'])}</text>
      <text x="60" y="130" className={styles.svgLabel}>{formatPercent(rates['脚'])}</text>
      <text x="60" y="175" className={styles.svgCaption}>背面</text>
    </svg>
  );
}

export default function Recovery() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exercises, setExercises] = useState<ExerciseMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  // 画面表示時にデータを読み込む（読み取り専用）
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      loadDataFromFirestore(user.uid),
      loadExerciseMasters(user.uid),
    ]).then(([data, masters]) => {
      if (cancelled) return;
      setWorkouts(data.workouts);
      setExercises(masters);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  // 時間経過で回復率が変わるため、60秒ごとに now を更新して再レンダリング
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const lastTrainedAt = useMemo(
    () => getLastTrainedAtByPart(workouts, exercises),
    [workouts, exercises],
  );

  const rates = useMemo(() => {
    const result = {} as PartRates;
    for (const part of TRACKED_PARTS) {
      result[part] = getRecoveryRate(lastTrainedAt[part], part, now);
    }
    return result;
  }, [lastTrainedAt, now]);

  const colors = useMemo(() => {
    const result = {} as PartColors;
    for (const part of TRACKED_PARTS) {
      result[part] = getRecoveryState(rates[part]).color;
    }
    return result;
  }, [rates]);

  const recommended = useMemo(() => getRecommendedParts(rates), [rates]);

  if (loading) {
    return (
      <div className={styles.page}>
        <p className={styles.loading}>読み込み中...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>部位別リカバリー</h1>

      {/* 今日おすすめの部位 */}
      <div className={styles.card}>
        <p className={styles.cardTitle}>今日おすすめの部位</p>
        {recommended.length > 0 ? (
          <div className={styles.chipRow}>
            {recommended.map((part) => (
              <span key={part} className={styles.chip}>
                {CATEGORY_EMOJI[part]} {part}
              </span>
            ))}
          </div>
        ) : (
          <p className={styles.restMessage}>今日は全体的に休養日</p>
        )}
      </div>

      {/* 人体図ヒートマップ */}
      <div className={styles.card}>
        <p className={styles.cardTitle}>ヒートマップ</p>
        <div className={styles.bodyRow}>
          <BodyFront colors={colors} rates={rates} />
          <BodyBack colors={colors} rates={rates} />
        </div>
        <div className={styles.legend}>
          {[
            getRecoveryState(0),
            getRecoveryState(0.5),
            getRecoveryState(0.8),
            getRecoveryState(1),
            getRecoveryState(null),
          ].map((s) => (
            <span key={s.label} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* 部位カードリスト */}
      <div className={styles.partList}>
        {TRACKED_PARTS.map((part) => {
          const rate = rates[part];
          const state = getRecoveryState(rate);
          const remaining = getRemainingHours(lastTrainedAt[part], part, now);
          const statusText =
            lastTrainedAt[part] == null
              ? '未実施'
              : remaining <= 0
                ? '回復済み'
                : formatRemaining(remaining);

          return (
            <div key={part} className={styles.partCard}>
              <div className={styles.partHeader}>
                <span className={styles.partName}>
                  {CATEGORY_EMOJI[part]} {part}
                </span>
                <span className={styles.partState} style={{ color: state.color }}>
                  {state.label}
                </span>
              </div>
              <div className={styles.partBody}>
                <span className={styles.partPercent}>{formatPercent(rate)}</span>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{
                      width: `${rate == null ? 0 : rate * 100}%`,
                      background: state.color,
                    }}
                  />
                </div>
              </div>
              <p className={styles.partRemaining}>{statusText}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
