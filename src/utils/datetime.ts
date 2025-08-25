/**
 * 日時ユーティリティ（JST基準）
 * - 入出力は基本的に ISO 8601（UTC, Z 付き）文字列
 * - UI 表示や入力は JST（日本時間）で扱う
 * - 「時」単位（分・秒なし）を想定
 */

export const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/**
 * 現在の JST を「時」へ丸め（切り捨て）たうえで UTC ISO を返す
 */
export function nowFloorHourJstIso(): string {
  const nowUtc = Date.now();
  const jst = new Date(nowUtc + JST_OFFSET_MS);
  jst.setUTCMinutes(0, 0, 0);
  const utcMs = jst.getTime() - JST_OFFSET_MS;
  return new Date(utcMs).toISOString();
}

/**
 * UTC ISO（Z 付き）を JST の日付(YYYY-MM-DD) と時(0-23)へ分解
 */
export function jstPartsFromIso(iso: string): { date: string; hour: number } {
  const utc = new Date(iso);
  const jstMs = utc.getTime() + JST_OFFSET_MS;
  const jst = new Date(jstMs);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth() + 1;
  const d = jst.getUTCDate();
  const hour = jst.getUTCHours();
  const date = `${y}-${pad2(m)}-${pad2(d)}`;
  return { date, hour };
}

/**
 * JST の日付(YYYY-MM-DD) と時(0-23)から UTC ISO（Z 付き）を生成
 */
export function isoFromJstParts(date: string, hour: number): string {
  const [y, m, d] = date.split('-').map((v) => Number(v));
  const jstMs = Date.UTC(y, m - 1, d, hour, 0, 0, 0);
  const utcMs = jstMs - JST_OFFSET_MS;
  return new Date(utcMs).toISOString();
}

/**
 * 基準 ISO（UTC）を JST として days 日加算し、UTC ISO を返す
 */
export function addDaysJstIso(baseIso: string, days: number): string {
  const { date, hour } = jstPartsFromIso(baseIso);
  const baseDate = new Date(`${date}T00:00:00Z`);
  const next = new Date(baseDate.getTime() + days * DAY_MS);
  const y = next.getUTCFullYear();
  const m = next.getUTCMonth() + 1;
  const d = next.getUTCDate();
  const nextDate = `${y}-${pad2(m)}-${pad2(d)}`;
  return isoFromJstParts(nextDate, hour);
}

/**
 * 相対時刻の簡易ラベル
 * - 期限切れ（現在より過去）
 * - 1時間以内: 「まもなく」
 * - 24時間未満: 「約N時間後」
 * - それ以外: 「約N日後」
 */
export function approxDaysFromNowJstLabel(iso: string, limitExpiredLabel?: string): string {
  const nowMs = Date.now();
  const targetMs = new Date(iso).getTime();
  const diff = targetMs - nowMs;

  if (diff < 0) {
    return limitExpiredLabel ?? '期限切れ';
  }
  if (diff <= HOUR_MS) {
    return 'まもなく';
  }approxDaysFromNowJstLabel

  const hours = Math.ceil(diff / HOUR_MS);
  if (hours < 24) {
    return `約${hours}時間後`;
  }

  const days = Math.ceil(diff / DAY_MS);
  return `約${days}日後`;
}
