import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/ja';

// Day.js 設定（JST をデフォルトタイムゾーンに設定）
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Tokyo');

// 日本語ロケールを適用
dayjs.locale('ja');

export type { Dayjs } from 'dayjs';
export default dayjs;
