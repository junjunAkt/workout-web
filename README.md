# Workout & Reading Web App

筋トレ記録と読書管理、2つの独立したWebアプリケーション。

## 起動方法

```bash
npm install
npm run dev
```

## アプリ一覧

| アプリ | URL | 説明 |
|--------|-----|------|
| 筋トレ記録 | `/` | ログインして筋トレ・栄養を管理 |
| 読書管理 | `/reading` | ログイン不要で読書を記録 |

## 読書管理アプリ

`/reading` にアクセスすると利用可能。筋トレアプリとは完全に独立して動作し、ログイン不要。

### 主な機能
- **本の登録**: タイトル・著者・ジャンル・ページ数を登録
- **読書タイマー**: 開始/終了ボタンで読書時間を自動計測（ブラウザを閉じても復元可能）
- **セッション記録**: 読んだページ範囲と感想を記録
- **本の詳細**: セッション履歴・累計読書時間・読了率・★5段階評価・読書速度・読了予測
- **ダッシュボード**: 登録冊数・読了冊数・累計読書時間・平均読書速度
- **バックアップ**: データのエクスポート（JSON）とインポート（置き換え/マージ）

### バックアップの取り方・復元の仕方

#### エクスポート（バックアップ）
1. 読書管理アプリのトップ画面を下にスクロール
2. 「データのバックアップ」セクションの「データをエクスポート」をタップ
3. `reading-log-backup-YYYYMMDD-HHmm.json` というファイルがダウンロードされる
4. iPhoneの場合は共有シートからファイルアプリ等に保存可能

#### インポート（復元）
1. 「データをインポート」をタップし、バックアップJSONファイルを選択
2. インポート方式を選択:
   - **置き換え**: 既存データを全て削除し、ファイルの内容に入れ替え（確認ダイアログあり）
   - **マージ**: IDが重複しないデータだけ追加（既存データはそのまま）
3. インポート成功時は追加された冊数・セッション数が表示される

### データ保存
現在はブラウザの localStorage に保存。ストレージ抽象レイヤー（`ReadingStorage` インターフェース）を介してアクセスしているため、バックエンドの差し替えが容易。

## 技術スタック

- Vite + React + TypeScript
- CSS Modules
- react-router-dom
- Firebase Authentication（筋トレアプリのログイン機能）
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
