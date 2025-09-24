/**
 * @file 数値ランクとアルファベット表記の対応辞書とユーティリティ
 * 仕様（ビュー側の想定）:
 *   10 -> F
 *    9 -> E
 *    8 -> D
 *    7 -> C
 *    6 -> B
 *    5 -> A
 *    4 -> S（Aの次の番号）
 *   上記以外 -> F（フォールバック）
 *
 * 備考:
 *   サーバ側のスキーマは 0..16 を想定しているため、この割当は範囲内です。
 */

export type RankAlpha = 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

/* 数値 -> アルファベットの対応辞書（変更時はここを修正） */
export const RANK_MAP: Readonly<Record<number, RankAlpha>> =
  Object.freeze({
    10: 'F',
    9: 'E',
    8: 'D',
    7: 'C',
    6: 'B',
    5: 'A',
    4: 'S',
  });

/**
 * 数値ランクをアルファベット表記に変換する
 * @param rank 数値ランク
 * @returns アルファベット表記（該当なしは 'F'）
 */
export function rankToAlpha(rank: number): RankAlpha {
  return RANK_MAP[rank] ?? 'F';
}
