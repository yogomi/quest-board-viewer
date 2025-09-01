/* サーバーのレスポンスに合わせた型定義（camelCase） */

export type QuestStatus =
  | 'new_quest'
  | 'open'
  | 'in_progress'
  | 'closed'
  | 'done';

export type PlayerUnitType = 'user' | 'party' | 'unit';

export type QuestListItem = {
  id: string;
  questOwnerId: string;
  title: string;
  rank: number;
  status: QuestStatus | string;
  description?: string | null;
  partyRequired: boolean;
  limitDate: string;
  openCallStartDate?: string | null;
  openCallEndDate?: string | null;
  assignedTargetId?: string | null;
  assignedTargetType?: PlayerUnitType | string;
  rewordPoint: number;
  rewordItems: string[];
  videos: string[];
  photos: string[];
  createdAt: string;
  updatedAt: string;
};

export type Quest = QuestListItem;

export type QuestComment = {
  id: string;
  questId: string;
  commentOwnerId: string;
  comment: string | null;
  commentOwner: {
    loginId: string;
  },
  createdAt: string;
  updatedAt: string;
};

export type ContractorStatus =
  | 'request'
  | 'accepted'
  | 'rejected'
  | string;

export type QuestContractor = {
  id: string;
  questId: string;
  contractorUnitId: string;
  contractorUnitType: PlayerUnitType | string;
  comment: string | null;
  status: ContractorStatus;
  createdAt: string;
  updatedAt: string;
};
