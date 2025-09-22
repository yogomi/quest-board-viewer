/* パーティー関連のAPI操作をまとめたモジュール */

import { z } from 'zod';
import { apiGet } from 'utils/apiClient';

import { PartyListItem } from 'types/parties';
import { Paging } from 'types/Paging';

export const listPartiesQuery = z.object({
  from: z.coerce.number().int().nonnegative().default(0),
  count: z.coerce.number().int().positive().lte(1000).default(20),
  leaderIdFilter: z.uuid().optional(),
  memberIdFilter: z.uuid().optional(),
});
export type ListPartiesQuery = z.infer<typeof listPartiesQuery>;

export async function listParties(
  q: Partial<ListPartiesQuery>
): Promise<Paging<PartyListItem>> {
  const params = listPartiesQuery.parse(q);
  return apiGet<Paging<PartyListItem>>('/parties', params);
}
