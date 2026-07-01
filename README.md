# Workout & Reading Web App

筋トレ記録 + 読書管理ができるWebアプリケーション。

## 起動方法

```bash
npm install
npm run dev
```

ブラウザで `http://localhost:5173` を開く。

## 読書管理機能

下部ナビゲーションの「読書」タブから利用可能。

### 主な機能
- **本の登録**: タイトル・著者・ジャンル・ページ数を登録
- **読書タイマー**: 開始/終了ボタンで読書時間を自動計測（ブラウザを閉じても復元可能）
- **セッション記録**: 読んだページ範囲と感想を記録
- **本の詳細**: セッション履歴・累計読書時間・読了率・★5段階評価
- **ダッシュボード**: 登録冊数・読了冊数・累計読書時間

### データ保存
現在はブラウザの localStorage に保存。ストレージ抽象レイヤー（`ReadingStorage` インターフェース）を介してアクセスしているため、バックエンドの差し替えが容易。

## 技術スタック

- Vite + React + TypeScript
- CSS Modules
- react-router-dom
- Firebase Authentication（ログイン機能）
- localStorage（読書データ保存、第一段階）

## Firebase Firestore 連携を追加する場合の手順

1. `src/lib/reading-storage.ts` に `FirestoreAdapter` クラスを追加し、`ReadingStorage` インターフェースを実装する
2. Firestore のコレクション設計例:
   - `users/{uid}/books/{bookId}` → Book ドキュメント
   - `users/{uid}/sessions/{sessionId}` → ReadingSession ドキュメント
   - `users/{uid}/activeTimer` → ActiveTimer ドキュメント（1つだけ）
3. `src/lib/reading-storage.ts` の末尾で `readingStorage` のインスタンスを `FirestoreAdapter` に差し替える
4. Firebase の設定は `src/lib/firebase.ts` に既存の設定があるのでそのまま利用可能
5. 環境変数（Firebase APIキー等）は `.env` ファイルに `VITE_` プレフィックス付きで設定する
6. Firestore セキュリティルールで `users/{uid}` 配下は本人のみ読み書き可能にする
