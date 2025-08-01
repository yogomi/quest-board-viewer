# Quest Board Viewer 仕様書

## 1. システム概要

Quest Board Viewerは、ユーザー管理機能を中心としたWebアプリケーションです。ギルドやクエストボードをテーマとしたファンタジー・サイバーパンク系のUIデザインを採用し、ユーザーの登録、管理、一括操作を行うことができます。

### 1.1 プロジェクト情報
- **プロジェクト名**: quest-board-viewer
- **バージョン**: 1.0.0
- **作成者**: Makoto Yano
- **ライセンス**: ISC

## 2. 技術仕様

### 2.1 フロントエンド技術スタック
- **フレームワーク**: React 19.0.0
- **言語**: TypeScript 5.8.2
- **UIライブラリ**: Material-UI (MUI) 6.4.8
- **ルーティング**: React Router DOM 7.4.0
- **地図表示**: Leaflet 1.9.4 + React Leaflet 5.0.0
- **スタイリング**: Emotion 11.14.0
- **状態管理**: React Cookies 8.0.1

### 2.2 開発・ビルドツール
- **バンドラー**: Webpack 5.98.0
- **開発サーバー**: Browser-sync 3.0.3
- **TypeScript設定**: tsconfig.json
- **CSS処理**: css-loader 7.1.2, style-loader 4.0.0

### 2.3 プロジェクト構成
```
src/
├── components/          # 共通コンポーネント
│   └── CyberMap.tsx    # 地図表示コンポーネント
├── pages/              # ページコンポーネント
│   ├── auth/
│   │   └── Login.tsx   # ログインページ
│   └── users/
│       ├── UserSummary.tsx     # ユーザー一覧ページ
│       └── BulkAddUsers.tsx    # ユーザー一括追加ページ
├── themes/             # UIテーマ
│   ├── guild/          # ギルドテーマ
│   ├── medieval/       # 中世風テーマ
│   └── steppenwolf/    # サイバーパンクテーマ
├── libs/               # 共通ライブラリ
│   └── color-translator-calculator/
├── types/              # 型定義
├── providers/          # コンテキストプロバイダー
├── Header/             # ヘッダーコンポーネント
├── Main.tsx            # メインコンポーネント
└── index.tsx           # エントリーポイント
```

## 3. 機能仕様

### 3.1 ユーザー管理機能

#### 3.1.1 ユーザー一覧表示
- **機能**: システムに登録されているユーザーの一覧を表形式で表示
- **表示項目**:
  - ユーザーID
  - ログインID
  - ニックネーム
  - ランク
  - 有効/無効ステータス
  - ギルドスタッフ権限
  - プライベート情報登録状況
  - 作成日時
- **ページング**: 10, 25, 50, 100, 500, 1000件/ページ
- **選択機能**: チェックボックスによる複数選択

#### 3.1.2 ユーザー追加
- **単体追加**: ダイアログ形式でのユーザー登録
  - ログインID（必須）
  - パスワード（必須）
  - メールアドレス（必須）
- **一括追加**: CSVファイルまたはExcelファイルからの一括登録
  - 対応形式: .csv, .xlsx
  - アップロード後、一覧画面に戻る

#### 3.1.3 ユーザー操作
- **一括有効化**: 選択したユーザーを一括で有効化
- **一括無効化**: 選択したユーザーを一括で無効化
- **一括削除**: 選択したユーザーを一括で削除
- **CSVダウンロード**: ユーザーデータのCSV形式での一括ダウンロード

### 3.2 認証機能
- **ログイン画面**: `/quest-board/auth/login`
- **認証方式**: next-auth 4.24.11を使用

### 3.3 地図表示機能
- **CyberMap コンポーネント**: Leafletを使用した地図表示
- **デフォルト位置**: 東京（35.6895, 139.6917）
- **ズームレベル**: 13
- **地図タイル**: OpenStreetMap

## 4. API仕様

### 4.1 エンドポイント一覧

#### 4.1.1 ユーザー関連API
```
GET  /quest-board/api/v1/users?from={offset}&count={limit}
POST /quest-board/api/v1/users
PUT  /quest-board/api/v1/user/bulk-enable-users
PUT  /quest-board/api/v1/user/bulk-disable-users
DELETE /quest-board/api/v1/users
POST /quest-board/api/v1/user/bulk-add-users
GET  /quest-board/api/v1/user/download-users-data
```

#### 4.1.2 ユーザー一覧取得
- **URL**: `GET /quest-board/api/v1/users`
- **パラメータ**:
  - `from`: 取得開始位置（数値）
  - `count`: 取得件数（数値）
- **レスポンス**:
```json
{
  "data": {
    "users": [
      {
        "id": "string",
        "loginId": "string",
        "nickname": "string",
        "rank": "number",
        "guildStaff": "boolean",
        "privateInformationRegistered": "boolean",
        "auth_type": "string",
        "referralId": "string",
        "comment": "string",
        "partyId": "string",
        "enabled": "string",
        "createdAt": "Date",
        "updatedAt": "Date"
      }
    ],
    "totalCount": "number"
  }
}
```

#### 4.1.3 ユーザー作成
- **URL**: `POST /quest-board/api/v1/users`
- **リクエストボディ**:
```json
{
  "loginId": "string",
  "passwordDigest": "string",
  "newEmail": "string"
}
```

#### 4.1.4 一括操作
- **一括有効化**: `PUT /quest-board/api/v1/user/bulk-enable-users`
- **一括無効化**: `PUT /quest-board/api/v1/user/bulk-disable-users`
- **一括削除**: `DELETE /quest-board/api/v1/users`
- **リクエストボディ**:
```json
{
  "ids": ["string", "string", ...]
}
```

#### 4.1.5 ファイル操作
- **一括追加**: `POST /quest-board/api/v1/user/bulk-add-users`
  - Content-Type: multipart/form-data
  - ファイルフィールド: `file`
- **CSVダウンロード**: `GET /quest-board/api/v1/user/download-users-data`
  - レスポンス: CSV形式のファイル

## 5. UI仕様

### 5.1 テーマシステム
アプリケーションは3つのテーマを提供：

#### 5.1.1 Steppenwolf テーマ（サイバーパンク）
- **ベースカラー**: ダークテーマ（rgb(5, 10, 20)）
- **アクセントカラー**: ネオンシアン（rgb(0, 255, 255)）、マゼンタ（rgb(255, 0, 255)）
- **フォント**: 'Orbitron', 'Helvetica Neue', sans-serif
- **特殊効果**: フリッカーアニメーション、テキストシャドウ

#### 5.1.2 Guild テーマ（ギルド）
- **ベースカラー**: ダークテーマ（grey[900]）
- **アクセントカラー**: アンバー、ブラウン
- **フォント**: "Shippori Mincho B1", "Noto Serif JP", serif
- **スタイル**: 和風・ファンタジー調

#### 5.1.3 Medieval テーマ（中世風）
- 詳細実装待ち

### 5.2 ページレイアウト

#### 5.2.1 ユーザー一覧ページ（/quest-board/users）
- **ヘッダー**: 更新ボタン、一括操作ボタン群
- **操作エリア**: ユーザー追加、一括追加、CSVダウンロードボタン
- **テーブル**: ソート可能なユーザー一覧表
- **フッター**: ページネーション

#### 5.2.2 ユーザー一括追加ページ（/quest-board/user/bulk-add-users）
- **中央配置**: ファイルアップロードフォーム
- **ファイル選択**: ドラッグ&ドロップ対応
- **ファイル情報**: 名前、サイズ、種類表示
- **アクション**: アップロード、戻るボタン

#### 5.2.3 ログインページ（/quest-board/auth/login）
- 詳細実装待ち

## 6. データ構造

### 6.1 ユーザーデータ型
```typescript
type UserData = {
  id: string;                              // ユーザーID
  loginId: string;                         // ログインID
  nickname: string;                        // ニックネーム
  rank: number;                           // ランク
  guildStaff: boolean;                    // ギルドスタッフ権限
  privateInformationRegistered: boolean;   // プライベート情報登録
  auth_type: string;                      // 認証タイプ
  referralId: string;                     // 紹介者ID
  comment: string;                        // コメント
  partyId: string;                        // パーティID
  enabled: string;                        // 有効/無効ステータス
  createdAt: Date;                        // 作成日時
  updatedAt: Date;                        // 更新日時
}
```

## 7. 状態管理

### 7.1 Cookie管理
React Cookiesを使用して以下の状態を永続化：
- `userSummary_page`: ユーザー一覧の現在ページ
- `userSummary_rowsPerPage`: ユーザー一覧の1ページあたりの表示件数
- `selectedZaoCloudUnitName`: 選択されたクラウドユニット名
- `selectedScopsOwlFunctionIndex`: 選択されたSCOPS Owl機能インデックス

### 7.2 コンポーネント状態
- ユーザー選択状態（Set<string>）
- ページング状態
- ファイルアップロード状態

## 8. ルーティング

### 8.1 ルート定義
```typescript
/quest-board/auth/login      → Login コンポーネント
/quest-board/users           → Main コンポーネント（UserSummary表示）
/quest-board/user/bulk-add-users → BulkAddUsers コンポーネント
/quest-board/               → Main コンポーネント（デフォルト）
```

## 9. 開発・デプロイメント

### 9.1 開発コマンド
```bash
npm run dev      # 開発モード（ファイル監視）
npm run serve    # Browser-sync開発サーバー起動
npm run build    # プロダクションビルド
```

### 9.2 ビルド設定
- **Webpack設定**: webpack.config.js
- **TypeScript設定**: tsconfig.json
- **Browser-sync設定**: bs-config.js
- **出力先**: public/static/main.bundle.js

### 9.3 フォント設定
HTMLにGoogle Fontsの読み込みを設定：
- Sawarabi Mincho（和風）
- Noto Serif JP（日本語セリフ）

## 10. セキュリティ

### 10.1 認証
- next-auth ライブラリを使用
- セッション管理はCookieベース

### 10.2 API セキュリティ
- CORS設定
- Content-Type バリデーション
- ファイルアップロード制限（.csv, .xlsx のみ）

## 11. パフォーマンス

### 11.1 最適化
- Webpack による JavaScript バンドル最適化
- 画像リソースの自動最適化
- Leaflet CSS の効率的な読み込み

### 11.2 ページング
- サーバーサイドページング対応
- 1ページあたり最大1000件まで設定可能

## 12. 今後の拡張予定

### 12.1 機能拡張
- クエスト管理機能
- ギルド管理機能
- 地図上でのクエスト配置機能
- リアルタイム通知機能

### 12.2 技術改善
- Server-Side Rendering (SSR) 対応
- PWA（Progressive Web App）化
- 国際化（i18n）対応
- テストカバレッジの向上

---

*この仕様書は Quest Board Viewer v1.0.0 時点での内容です。*
*最終更新日: 2024年8月1日*