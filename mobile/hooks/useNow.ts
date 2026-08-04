import { useEffect, useState } from 'react';

/**
 * 一定間隔で「現在時刻」を更新して再描画させるフック。
 *
 * 経過時間そのものは常に (現在時刻 - startedAt) で計算する前提なので、
 * このフックは再描画のトリガーを作るだけ。アプリがバックグラウンドに
 * 行っている間 setInterval が止まっても、復帰後の描画で正しい値になる。
 *
 * setInterval は enabled が false になった時・アンマウント時に必ず片付ける。
 */
export function useNow(intervalMs: number, enabled: boolean = true): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return;

    // 有効化された瞬間にまず1回合わせる（復帰直後のズレをなくす）
    setNow(Date.now());

    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);

  return now;
}

export default useNow;
