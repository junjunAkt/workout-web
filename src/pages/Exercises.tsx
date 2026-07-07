import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loadExerciseMasters, saveExerciseMaster, deleteExerciseMaster } from '../lib/exercise-storage';
import type { ExerciseMaster, ExerciseCategory } from '../lib/exercise-types';
import { CATEGORIES, CATEGORY_EMOJI } from '../lib/exercise-types';
import styles from './Exercises.module.css';

export default function Exercises() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<ExerciseMaster[]>([]);
  const [filterCategory, setFilterCategory] = useState<ExerciseCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadExerciseMasters(user.uid).then(setExercises);
    }
  }, [user]);

  const grouped = useMemo(() => {
    const cats = filterCategory === 'all' ? CATEGORIES : [filterCategory];
    return cats
      .map((cat) => ({
        category: cat,
        items: exercises.filter((e) => e.category === cat),
      }))
      .filter((g) => g.items.length > 0);
  }, [exercises, filterCategory]);

  const handleAdd = async (ex: ExerciseMaster) => {
    if (!user) return;
    const updated = await saveExerciseMaster(user.uid, ex);
    setExercises(updated);
    setShowAddModal(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!user) return;
    if (!confirm(`「${name}」を削除しますか？`)) return;
    const updated = await deleteExerciseMaster(user.uid, id);
    setExercises(updated);
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>種目一覧</h1>

      <div className={styles.filterRow}>
        <button
          className={`${styles.filterChip} ${filterCategory === 'all' ? styles.filterChipActive : ''}`}
          onClick={() => setFilterCategory('all')}
        >
          すべて
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`${styles.filterChip} ${filterCategory === cat ? styles.filterChipActive : ''}`}
            onClick={() => setFilterCategory(cat)}
          >
            {CATEGORY_EMOJI[cat]} {cat}
          </button>
        ))}
      </div>

      {grouped.map((group) => (
        <div key={group.category} className={styles.section}>
          <div className={styles.sectionTitle}>
            {CATEGORY_EMOJI[group.category]} {group.category}（{group.items.length}）
          </div>
          <div className={styles.list}>
            {group.items.map((ex) => (
              <div key={ex.id} className={styles.card}>
                <button
                  className={styles.cardMain}
                  onClick={() => navigate(`/exercises/${ex.id}`)}
                >
                  <div className={styles.cardName}>{ex.name}</div>
                  <div className={styles.cardMeta}>
                    {ex.videoUrl ? '🎬 動画あり' : ''}
                    {ex.memo ? ' 📝' : ''}
                  </div>
                </button>
                <button
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(ex.id, ex.name)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {grouped.length === 0 && (
        <div className={styles.empty}>種目がありません</div>
      )}

      <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
        ＋ 種目を追加
      </button>

      {showAddModal && (
        <AddExerciseModal
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
          existingIds={new Set(exercises.map((e) => e.id))}
        />
      )}
    </div>
  );
}

function AddExerciseModal({
  onSave,
  onClose,
  existingIds,
}: {
  onSave: (ex: ExerciseMaster) => void;
  onClose: () => void;
  existingIds: Set<string>;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('胸');

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    if (existingIds.has(id)) return;
    onSave({
      id,
      name: trimmed,
      category,
      videoUrl: null,
      isPreset: false,
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>種目を追加</div>

        <div className={styles.formGroup}>
          <label className={styles.label}>種目名</label>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例: ケーブルクロスオーバー"
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>カテゴリ</label>
          <div className={styles.categoryPicker}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`${styles.categoryBtn} ${category === cat ? styles.categoryBtnActive : ''}`}
                onClick={() => setCategory(cat)}
              >
                {CATEGORY_EMOJI[cat]} {cat}
              </button>
            ))}
          </div>
        </div>

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={!name.trim()}
        >
          追加
        </button>
        <button className={styles.cancelBtn} onClick={onClose}>
          キャンセル
        </button>
      </div>
    </div>
  );
}
