/**
 * Party related types
 */

/**
 * パーティの基本情報を表す型
 */
export type Party = {
  id: string;
  partyName: string;
  description: string | null;
  leaderId: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * パーティリスト表示用の簡略化された型
 */
export type PartyListItem = {
  id: string;
  partyName: string;
  memberCount: number;
  isOwner: boolean;
  createdAt: string;
};
