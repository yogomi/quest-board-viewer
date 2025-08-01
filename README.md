# Quest Board Viewer

ユーザー管理機能を中心としたWebアプリケーションです。ファンタジー・サイバーパンク系のUIテーマを採用し、ギルドメンバーやクエスト参加者の管理を効率的に行うことができます。

## 主な機能

- 👥 **ユーザー管理**: 登録、編集、削除、一括操作
- 📊 **一覧表示**: ページング対応のユーザー一覧
- 📤 **データ連携**: CSV/Excelファイルでの一括インポート・エクスポート
- 🎨 **テーマシステム**: 複数のUIテーマ（サイバーパンク、ギルド風など）
- 🗺️ **地図表示**: Leafletを使用したインタラクティブマップ
- 🔐 **認証システム**: セキュアなログイン機能

## 技術スタック

- **Frontend**: React 19 + TypeScript
- **UI**: Material-UI (MUI) 6.4
- **地図**: Leaflet + React Leaflet
- **ルーティング**: React Router DOM 7.4
- **ビルド**: Webpack 5 + TypeScript
- **開発**: Browser-sync

## セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール
```bash
# リポジトリのクローン
git clone https://github.com/yogomi/quest-board-viewer.git
cd quest-board-viewer

# 依存関係のインストール
npm install
```

### 開発サーバーの起動
```bash
# 開発モード（ファイル監視）
npm run dev

# Browser-sync開発サーバー（別ターミナル）
npm run serve
```

### ビルド
```bash
# プロダクションビルド
npm run build
```

## 使用方法

### 基本的な使い方

1. **ユーザー一覧の表示**
   - `/quest-board/users` にアクセス
   - ページング、検索、ソート機能を使用

2. **ユーザーの追加**
   - 「ユーザーを追加」ボタンから単体追加
   - 「ユーザー一括追加」からCSV/Excelファイルによる一括追加

3. **一括操作**
   - チェックボックスでユーザーを選択
   - 一括有効化、無効化、削除が可能

4. **データのエクスポート**
   - 「ユーザー一括ダウンロード」でCSVファイルをダウンロード

### API エンドポイント

詳細なAPI仕様は [SPECIFICATION.md](./SPECIFICATION.md) を参照してください。

## プロジェクト構成

```
src/
├── components/          # 共通コンポーネント
├── pages/              # ページコンポーネント
│   ├── auth/           # 認証関連
│   └── users/          # ユーザー管理
├── themes/             # UIテーマ
├── libs/               # 共通ライブラリ
├── types/              # TypeScript型定義
└── providers/          # Reactコンテキスト
```

## テーマシステム

### 利用可能なテーマ

1. **Steppenwolf（サイバーパンク）**
   - ダークベース + ネオンアクセント
   - フリッカーアニメーション効果

2. **Guild（ギルド風）**
   - 和風ファンタジーデザイン
   - アンバー + ブラウン配色

3. **Medieval（中世風）** ※実装予定

### テーマの切り替え

`src/index.tsx` で使用するテーマを変更できます：

```typescript
import { steppenwolfTheme } from 'themes/steppenwolf/';
import { guildTheme } from 'themes/guild/';

// テーマを切り替え
<ThemeProvider theme={guildTheme}>
```

## 開発ガイド

### ディレクトリ構成の規則

- `components/`: 再利用可能なUIコンポーネント
- `pages/`: ルートに対応するページコンポーネント
- `themes/`: MUIテーマ定義
- `types/`: TypeScript型定義
- `libs/`: 共通ユーティリティ関数

### コーディング規約

- TypeScriptの使用を前提
- Material-UIのコンポーネントを積極的に活用
- 関数コンポーネント + Hooksパターンを採用
- CSS-in-JSはEmotionを使用

## ライセンス

ISC License

## 作成者

Makoto Yano

## 詳細仕様

システムの詳細な仕様については [SPECIFICATION.md](./SPECIFICATION.md) を参照してください。