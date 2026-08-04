# 筋トレ記録アプリ（Expo / React Native）

Expo managed workflow + Expo Router + TypeScript strict。
今回は Expo Go で動く範囲の土台。Apple Watch（Live Activity）／ヘルスケア連携／AIアドバイス／
ジム別おすすめは後工程で足す前提の構成にしてある。

## 起動手順

```bash
cd mobile
npm install
npx expo start
```

- ターミナルに QR コードが出る
- **iPhone**: カメラアプリで QR を読む → Expo Go が開く
- **Android**: Expo Go アプリの「Scan QR code」で読む
- PC とスマホを同じ Wi-Fi につなぐこと。つながらないときは `npx expo start --tunnel`

## フォルダ構成

```
app/                  画面（Expo Router）
  _layout.tsx         ルート。起動時にプリセット種目を投入
  (tabs)/_layout.tsx  タブ5つの定義
  (tabs)/index.tsx    ホーム
  (tabs)/log.tsx      記録（ワークアウトタイマー＋前回データ呼び出し）
  (tabs)/exercises.tsx 種目
  (tabs)/calendar.tsx カレンダー
  (tabs)/recovery.tsx 回復
components/           再利用UI
constants/            theme / presets / recovery / muscleMap / categories
utils/                recovery.ts, session.ts, date.ts（純粋関数）
hooks/                useNow.ts（setInterval の後始末込み）
lib/                  storage.ts（AsyncStorage ラッパ）
types/                型定義
```

## データの持ち方

AsyncStorage のキーは3つ。

| キー | 中身 |
| --- | --- |
| `exercises` | `Exercise[]`（プリセット＋自作） |
| `sessions` | `Session[]`（確定したトレーニング記録） |
| `activeSession` | 進行中の `Session`（アプリを閉じても計測が続くように保持） |

**画面から AsyncStorage を直接触らないこと。** 読み書きはすべて `lib/storage.ts` 経由。
将来 Firebase 同期や HealthKit 連携を足すときに、この関数群のシグネチャを保ったまま
中身だけ差し替えられるようにしてある。

## ワークアウトタイマーの作り

- 経過時間は毎回 `現在時刻 - startedAt` で計算する。`setInterval` は再描画のトリガーでしかないので、
  アプリがバックグラウンドに行って `setInterval` が止まっても時間はズレない。
- `setInterval` の後始末は `hooks/useNow.ts` に集約（画面を離れた時点で `clearInterval`）。
- 終了時に `endedAt` と `durationSec` を確定して `sessions` に保存する。
  HealthKit への書き出しは `app/(tabs)/log.tsx` の `finishWorkout` 付近の TODO コメント参照。

## 回復率

- しきい値と時間は `constants/recovery.ts` の `RECOVERY_HOURS` 1か所で調整する。
- 計算は `utils/recovery.ts` の純粋関数。記録0件なら全部位 `null` = 「未実施」（人体図は全身グレー）。
- 人体図の slug は `constants/muscleMap.ts`。react-native-body-highlighter v3.2.0 の `Slug` 型に
  合わせてあるので、ライブラリを上げたときはここを確認すること。

## 後工程のための余白

- `Exercise.videoUrl`：YouTube URL の入力欄はすでにあるが、再生は未実装
- HealthKit / Live Activity：Expo Go では動かないので開発ビルドが必要
- Web で動かしたい場合は `npx expo install react-dom react-native-web @expo/metro-runtime` を追加
