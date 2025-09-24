/* サーバーのレスポンスに合わせた型定義（camelCase） */

import { UserListItem } from './users';
import { PartyListItem } from './parties';

export type QuestStatus =
  | 'new_quest'
  | 'open_call'
  | 'take_quest_requested'
  | 'doing'
  | 'done'
  | 'success'
  | 'failed'
  | 'pending'
  | 'feedback';

export type PlayerUnitType = 'user' | 'party';

export type QuestListItem = {
  id: string;
  questOwnerId: string;
  owner: {
    id: string;
    loginId: string;
    nickname?: string | null;
  }
  title: string;
  rank: number;
  status: QuestStatus | string;
  description?: string | null;
  partyRequired: boolean;
  assignedContractorId?: string | null;
  assignedContractor?: {
    id: string;
    contractorUnitType: string;
    userContractor?: {
      id: string;
      loginId: string;
      nickname?: string | null;
    };
    partyContractor?: {
      id: string;
      partyName: string;
    };
  } | null;
  limitDate: string;
  openCallStartDate?: string | null;
  openCallEndDate?: string | null;
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
    nickname?: string | null;
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
  contractorUnitType: PlayerUnitType;
  userContractor?: UserListItem;
  partyContractor?: PartyListItem;
  comment: string | null;
  status: ContractorStatus;
  createdAt: string;
  updatedAt: string;
};
