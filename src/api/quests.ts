/* クエスト関連 API 呼び出し。Zod で送信値を検証。 */
import { z } from 'zod';
import { apiGet, apiPost, apiPatch, apiDelete, apiPut } from 'utils/apiClient';
import {
  Quest,
  QuestListItem,
  QuestComment,
  QuestContractor,
} from 'types/quests';

import { Paging } from 'types/Paging';

export const listQuestsQuery = z.object({
  from: z.coerce.number().int().nonnegative().default(0),
  count: z.coerce.number().int().positive().lte(1000).default(20),
});
export type ListQuestsQuery = z.infer<typeof listQuestsQuery>;

export async function listQuests(
  q: Partial<ListQuestsQuery>
): Promise<Paging<QuestListItem>> {
  const params = listQuestsQuery.parse({
    from: q.from ?? 0,
    count: q.count ?? 20,
  });
  return apiGet<Paging<QuestListItem>>('/quests', params);
}

type DataQuest = {
  quest: Quest;
}

export async function getQuest(questId: string): Promise<Quest> {
  const dataQuest = await apiGet<DataQuest>(`/quests/${questId}`);
  return dataQuest.quest;
}

/* 作成/更新スキーマ */
export const upsertQuestInput = z.object({
  questOwnerId: z.uuid(),
  title: z.string().min(1).max(255),
  rank: z.number().min(0).max(16),
  description: z.string().max(5120).optional().nullable(),
  partyRequired: z.boolean().default(false),
  limitDate: z.iso.datetime(),
  openCallStartDate: z.iso.datetime().nullable().optional(),
  openCallEndDate: z.iso.datetime().nullable().optional(),
  rewordPoint: z.number().min(0).max(1073741824).default(0),
  rewordItems: z.array(z.string().max(128)).default([]),
  videos: z.array(z.string().max(256)).default([]),
  photos: z.array(z.string().max(256)).default([]),
});
/* 出力型（サーバーへ送る最終形）と入力型（フォームから受ける形）を分離 */
export type UpsertQuestInputOut = z.output<typeof upsertQuestInput>;
export type UpsertQuestInputIn = z.input<typeof upsertQuestInput>;

export async function createQuest(
  input: UpsertQuestInputIn
): Promise<Quest> {
  const body = upsertQuestInput.parse(input);
  return apiPost<Quest, UpsertQuestInputOut>('/quests', body);
}

/* 更新は部分更新を前提とし、partial().parse で検証 */
export async function updateQuest(
  questId: string,
  input: Partial<UpsertQuestInputIn>
): Promise<Quest> {
  const parsed = upsertQuestInput.partial().parse(input);
  return apiPatch<Quest, Partial<UpsertQuestInputOut>>(
    `/quests/${questId}`,
    parsed
  );
}

export async function deleteQuest(questId: string): Promise<{
  deleted: boolean;
}> {
  return apiDelete<{ deleted: boolean }>(`/quests/${questId}`);
}

export async function doneQuest(questId: string): Promise<Quest> {
  return apiPut<Quest, {}>(`/quests/${questId}/done`, {});
}

export async function closeQuest(questId: string, success: boolean): Promise<Quest> {
  return apiPut<Quest, {}>(`/quests/${questId}/close?success=${success}`, {});
}

export async function feedbackQuest(questId: string): Promise<Quest> {
  return apiPut<Quest, {}>(`/quests/${questId}/feedback`, {});
}

export async function restartQuest(questId: string): Promise<Quest> {
  return apiPut<Quest, {}>(`/quests/${questId}/restart`, {});
}

/* コメント */
export const upsertCommentInput = z.object({
  commentOwnerId: z.uuid(),
  comment: z.string().max(5120),
});
export type UpsertCommentInput = z.infer<typeof upsertCommentInput>;

export async function listComments(
  questId: string,
  from = 0,
  count = 20
): Promise<Paging<QuestComment>> {
  return apiGet<Paging<QuestComment>>(
    `/quests/${questId}/comments`,
    { from, count }
  );
}

export async function addComment(
  questId: string,
  input: UpsertCommentInput
): Promise<QuestComment> {
  const body = upsertCommentInput.parse(input);
  return apiPost<QuestComment, UpsertCommentInput>(
    `/quests/${questId}/comments`,
    body
  );
}

export async function updateComment(
  questId: string,
  commentId: string,
  input: Partial<UpsertCommentInput>
): Promise<QuestComment> {
  const body = upsertCommentInput.partial().parse(input);
  return apiPatch<QuestComment, Partial<UpsertCommentInput>>(
    `/quests/${questId}/comments/${commentId}`,
    body
  );
}

export async function deleteCommentApi(
  questId: string,
  commentId: string
): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(
    `/quests/${questId}/comments/${commentId}`
  );
}

/* 請負者 */
export const upsertContractorInput = z.object({
  contractorUnitId: z.uuid(),
  contractorUnitType: z.enum(['user', 'party']),
  comment: z.string().max(5120).optional().nullable(),
});
export type UpsertContractorInput = z.infer<typeof upsertContractorInput>;

export async function getContractor(
  questId: string,
  contractorId: string
): Promise<QuestContractor> {
  const data = await apiGet<{ contractor: QuestContractor }>(
    `/quests/${questId}/contractors/${contractorId}`
  );
  return data.contractor;
}

export async function listContractors(
  questId: string,
  from = 0,
  count = 20
): Promise<Paging<QuestContractor>> {
  return apiGet<Paging<QuestContractor>>(
    `/quests/${questId}/contractors`,
    { from, count }
  );
}

export async function addContractor(
  questId: string,
  input: UpsertContractorInput
): Promise<QuestContractor> {
  const body = upsertContractorInput.parse(input);
  return apiPost<QuestContractor, UpsertContractorInput>(
    `/quests/${questId}/contractors`,
    body
  );
}

export async function updateContractor(
  questId: string,
  contractorId: string,
  input: Partial<UpsertContractorInput>
): Promise<QuestContractor> {
  const body = upsertContractorInput.partial().parse(input);
  return apiPatch<QuestContractor, Partial<UpsertContractorInput>>(
    `/quests/${questId}/contractors/${contractorId}`,
    body
  );
}

export async function deleteContractor(
  questId: string,
  contractorId: string
): Promise<{ deleted: boolean }> {
  return apiDelete<{ deleted: boolean }>(
    `/quests/${questId}/contractors/${contractorId}`
  );
}

export async function acceptContractor(
  questId: string,
  contractorId: string
): Promise<QuestContractor> {
  return apiPut<QuestContractor, {}>(
    `/quests/${questId}/contractors/${contractorId}/accept`,
    {}
  );
}

export async function rejectContractor(
  questId: string,
  contractorId: string
): Promise<QuestContractor> {
  return apiPut<QuestContractor, {}>(
    `/quests/${questId}/contractors/${contractorId}/reject`,
    {}
  );
}
