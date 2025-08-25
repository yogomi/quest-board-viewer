import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProd = process.env.NODE_ENV === 'production';

export default {
  mode: isProd ? 'production' : 'development',
  entry: './src/index.tsx',
  output: {
    path: path.resolve(__dirname, 'public/static'),
    filename: 'main.bundle.js',
    clean: false
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        // MUI の ESM サブパス（@mui/material/... 等）の
        // fully specified エラーを回避
        test: /\.m?js$/,
        resolve: { fullySpecified: false }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })]
  },
  // MUI v6 は ES2018+ 前提、ES5 ターゲットは避ける
  target: ['web'],
  devtool: isProd ? false : 'source-map',
  stats: 'errors-warnings'
};
