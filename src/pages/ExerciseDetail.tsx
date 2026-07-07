import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loadExerciseMasters, saveExerciseMaster } from '../lib/exercise-storage';
import type { ExerciseMaster, ExerciseCategory } from '../lib/exercise-types';
import { CATEGORIES, CATEGORY_EMOJI } from '../lib/exercise-types';
import { extractVideoId, youtubeSearchUrl } from '../lib/youtube';
import styles from './ExerciseDetail.module.css';

export default function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercise, setExercise] = useState<ExerciseMaster | null>(null);
  const [editing, setEditing] = useState(false);

  // 編集フォーム
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<ExerciseCategory>('胸');
  const [editMemo, setEditMemo] = useState('');

  // 動画URL
  const [videoInput, setVideoInput] = useState('');
  const [videoError, setVideoError] = useState('');

  useEffect(() => {
    if (!user || !id) return;
    loadExerciseMasters(user.uid).then((all) => {
      const found = all.find((e) => e.id === id);
      if (found) {
        setExercise(found);
        setEditName(found.name);
        setEditCategory(found.category);
        setEditMemo(found.memo ?? '');
      }
    });
  }, [user, id]);

  if (!exercise) {
    return (
      <div className={styles.page}>
        <button className={styles.backBtn} onClick={() => navigate('/exercises')}>
          ← 戻る
        </button>
        <div className={styles.empty}>種目が見つかりません</div>
      </div>
    );
  }

  const videoId = exercise.videoUrl ? extractVideoId(exercise.videoUrl) : null;

  const handleSaveVideo = async () => {
    if (!user) return;
    const vid = extractVideoId(videoInput);
    if (!vid) {
      setVideoError('有効なYouTube URLを入力してください');
      return;
    }
    setVideoError('');
    const updated = { ...exercise, videoUrl: videoInput.trim() };
    await saveExerciseMaster(user.uid, updated);
    setExercise(updated);
    setVideoInput('');
  };

  const handleRemoveVideo = async () => {
    if (!user) return;
    const updated = { ...exercise, videoUrl: null };
    await saveExerciseMaster(user.uid, updated);
    setExercise(updated);
  };

  const handleSaveEdit = async () => {
    if (!user || !editName.trim()) return;
    const updated = {
      ...exercise,
      name: editName.trim(),
      category: editCategory,
      memo: editMemo.trim() || undefined,
    };
    await saveExerciseMaster(user.uid, updated);
    setExercise(updated);
    setEditing(false);
  };

  return (
    <div className={styles.page}>
      <button className={styles.backBtn} onClick={() => navigate('/exercises')}>
        ← 種目一覧
      </button>

      <div className={styles.header}>
        <span className={styles.categoryBadge}>
          {CATEGORY_EMOJI[exercise.category]} {exercise.category}
        </span>
        <h1 className={styles.title}>{exercise.name}</h1>
        {exercise.memo && (
          <p className={styles.memo}>{exercise.memo}</p>
        )}
      </div>

      {/* 動画セクション */}
      <div className={styles.videoSection}>
        <div className={styles.sectionTitle}>フォーム動画</div>
        {videoId ? (
          <div className={styles.videoWrapper}>
            <iframe
              className={styles.videoIframe}
              src={`https://www.youtube.com/embed/${videoId}`}
              title={exercise.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button className={styles.removeVideoBtn} onClick={handleRemoveVideo}>
              動画を削除
            </button>
          </div>
        ) : (
          <div className={styles.videoEmpty}>
            <div className={styles.videoInputRow}>
              <input
                className={styles.videoInput}
                value={videoInput}
                onChange={(e) => { setVideoInput(e.target.value); setVideoError(''); }}
                placeholder="YouTube URLを貼り付け"
              />
              <button
                className={styles.videoSaveBtn}
                onClick={handleSaveVideo}
                disabled={!videoInput.trim()}
              >
                登録
              </button>
            </div>
            {videoError && <div className={styles.videoError}>{videoError}</div>}
            <button
              className={styles.youtubeSearchBtn}
              onClick={() => window.open(youtubeSearchUrl(exercise.name), '_blank')}
            >
              YouTubeで検索
            </button>
          </div>
        )}
      </div>

      {/* 編集ボタン */}
      <button className={styles.editToggle} onClick={() => setEditing(!editing)}>
        {editing ? 'キャンセル' : '種目を編集'}
      </button>

      {editing && (
        <div className={styles.editForm}>
          <div className={styles.formGroup}>
            <label className={styles.label}>種目名</label>
            <input
              className={styles.input}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>カテゴリ</label>
            <div className={styles.categoryPicker}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.categoryBtn} ${editCategory === cat ? styles.categoryBtnActive : ''}`}
                  onClick={() => setEditCategory(cat)}
                >
                  {CATEGORY_EMOJI[cat]} {cat}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>メモ</label>
            <textarea
              className={styles.textarea}
              value={editMemo}
              onChange={(e) => setEditMemo(e.target.value)}
              placeholder="フォームのポイントなど..."
            />
          </div>
          <button
            className={styles.saveBtn}
            onClick={handleSaveEdit}
            disabled={!editName.trim()}
          >
            保存
          </button>
        </div>
      )}
    </div>
  );
}
