/**
 * トレーニング記録画面 - Firestore対応版
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { addWorkoutToFirestore, loadDataFromFirestore } from '../lib/firestore';
import { generateId, todayString } from '../lib/storage';
import type { WorkoutSet } from '../lib/types';
import styles from './Workout.module.css';

export default function Workout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState<WorkoutSet[]>([{ weight: 0, reps: 0 }]);
  const [knownExercises, setKnownExercises] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      loadDataFromFirestore(user.uid).then((data) => {
        const names = new Set<string>();
        data.workouts.forEach((w) => w.exercises.forEach((e) => names.add(e.name)));
        setKnownExercises(Array.from(names));
      });
    }
  }, [user]);

  const addSet = () => setSets([...sets, { weight: 0, reps: 0 }]);

  const removeSet = (i: number) => {
    if (sets.length === 1) return;
    setSets(sets.filter((_, idx) => idx !== i));
  };

  const updateSet = (i: number, field: 'weight' | 'reps', val: string) => {
    const num = parseFloat(val) || 0;
    const next = [...sets];
    next[i] = { ...next[i], [field]: num };
    setSets(next);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!exerciseName.trim()) { alert('種目名を入力してください'); return; }
    const validSets = sets.filter((s) => s.weight > 0 || s.reps > 0);
    if (validSets.length === 0) { alert('重量または回数を入力してください'); return; }

    await addWorkoutToFirestore(user.uid, {
      id: generateId(),
      date: todayString(),
      exercises: [{ name: exerciseName.trim(), sets: validSets }],
    });

    setSaved(true);
    setTimeout(() => {
      setExerciseName('');
      setSets([{ weight: 0, reps: 0 }]);
      setSaved(false);
      navigate('/');
    }, 800);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>記録</h1>

      <label className={styles.label}>種目名</label>
      <input
        className={styles.input}
        value={exerciseName}
        onChange={(e) => setExerciseName(e.target.value)}
        placeholder="例: ベンチプレス"
      />

      {knownExercises.length > 0 && (
        <div className={styles.chips}>
          {knownExercises.map((name) => (
            <button key={name} className={styles.chip} onClick={() => setExerciseName(name)}>
              {name}
            </button>
          ))}
        </div>
      )}

      <label className={styles.label} style={{ marginTop: 24 }}>セット</label>
      {sets.map((set, i) => (
        <div key={i} className={styles.setRow}>
          <span className={styles.setNum}>{i + 1}</span>
          <div className={styles.setInputWrap}>
            <input
              className={styles.setInput}
              type="number"
              inputMode="decimal"
              value={set.weight || ''}
              onChange={(e) => updateSet(i, 'weight', e.target.value)}
              placeholder="0"
            />
            <span className={styles.setUnit}>kg</span>
          </div>
          <div className={styles.setInputWrap}>
            <input
              className={styles.setInput}
              type="number"
              inputMode="numeric"
              value={set.reps || ''}
              onChange={(e) => updateSet(i, 'reps', e.target.value)}
              placeholder="0"
            />
            <span className={styles.setUnit}>回</span>
          </div>
          <button className={styles.removeBtn} onClick={() => removeSet(i)} disabled={sets.length === 1}>✕</button>
        </div>
      ))}

      <button className={styles.addSetBtn} onClick={addSet}>＋ セットを追加</button>

      <button
        className={`${styles.saveBtn} ${saved ? styles.saveBtnDone : ''}`}
        onClick={handleSave}>
        {saved ? '✓ 保存しました！' : '保存する'}
      </button>
    </div>
  );
}
