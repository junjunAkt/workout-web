import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { addWorkoutToFirestore, loadDataFromFirestore } from '../lib/firestore';
import { loadExerciseMasters } from '../lib/exercise-storage';
import { extractVideoId } from '../lib/youtube';
import { generateId, todayString } from '../lib/storage';
import type { WorkoutSet } from '../lib/types';
import type { ExerciseMaster } from '../lib/exercise-types';
import styles from './Workout.module.css';

export default function Workout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState<WorkoutSet[]>([{ weight: 0, reps: 0 }]);
  const [knownExercises, setKnownExercises] = useState<string[]>([]);
  const [exerciseMasters, setExerciseMasters] = useState<ExerciseMaster[]>([]);
  const [saved, setSaved] = useState(false);
  const [videoModal, setVideoModal] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    loadDataFromFirestore(user.uid).then((data) => {
      const names = new Set<string>();
      data.workouts.forEach((w) => w.exercises.forEach((e) => names.add(e.name)));
      setKnownExercises(Array.from(names));
    });
    loadExerciseMasters(user.uid).then(setExerciseMasters);
  }, [user]);

  const currentMaster = exerciseMasters.find((m) => m.name === exerciseName);
  const currentVideoId = currentMaster?.videoUrl ? extractVideoId(currentMaster.videoUrl) : null;

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

  const allChipNames = new Set([
    ...knownExercises,
    ...exerciseMasters.map((m) => m.name),
  ]);
  const chipNames = Array.from(allChipNames);

  const hasVideo = (name: string) => {
    const m = exerciseMasters.find((e) => e.name === name);
    return m?.videoUrl ? extractVideoId(m.videoUrl) : null;
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>記録</h1>

      <label className={styles.label}>種目名</label>
      <div className={styles.exerciseRow}>
        <input
          className={styles.input}
          value={exerciseName}
          onChange={(e) => setExerciseName(e.target.value)}
          placeholder="例: ベンチプレス"
        />
        {currentVideoId && (
          <button
            className={styles.videoIconBtn}
            onClick={() => setVideoModal(currentVideoId)}
            title="フォーム動画を見る"
          >
            🎬
          </button>
        )}
      </div>

      {chipNames.length > 0 && (
        <div className={styles.chips}>
          {chipNames.map((name) => (
            <button key={name} className={styles.chip} onClick={() => setExerciseName(name)}>
              {hasVideo(name) ? '🎬 ' : ''}{name}
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

      {/* 動画モーダル */}
      {videoModal && (
        <div className={styles.videoOverlay} onClick={() => setVideoModal(null)}>
          <div className={styles.videoModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.videoModalHeader}>
              <span className={styles.videoModalTitle}>{exerciseName}</span>
              <button className={styles.videoCloseBtn} onClick={() => setVideoModal(null)}>✕</button>
            </div>
            <iframe
              className={styles.videoIframe}
              src={`https://www.youtube.com/embed/${videoModal}?autoplay=1`}
              title={exerciseName}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
