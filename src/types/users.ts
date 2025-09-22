/**
 * サーバーのユーザー公開情報（listUpUsers の items 要素）
 * - サーバー側で humps.camelizeKeys 済みのキーに合わせる
 * - 必要最小限のみ定義し、将来の拡張に備えて optional を許容
 */
export type UserPublic = {
  id: string; // UUID
  loginId?: string;
  nickname?: string;
  rank?: number;
  guildStaff?: boolean;
  enabled?: boolean;
  // ほかにもサーバーが返しうるプロパティは存在するが、ここでは省略
};

/**
 * プルダウン表示用の簡易要素
 * - name は nickname > loginId > id の優先順位で決定
 */
export type UserListItem = {
  id: string;
  loginId: string;
  rank: number;
  guildStaff: boolean;
  enabked: boolean;
  nickname?: string;
};
