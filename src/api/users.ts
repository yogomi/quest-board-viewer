import { z } from 'zod';
import { apiGet } from 'utils/apiClient';
import { UserPublic } from 'types/users';
import { Paging } from 'types/Paging';


export const listUsersQuery = z.object({
  from: z.coerce.number().int().nonnegative().default(0),
  count: z.coerce.number().int().positive().lte(1000).default(20),
});
export type ListUsersQuery = z.infer<typeof listUsersQuery>;

export async function listUsers(
  q: Partial<ListUsersQuery>
): Promise<Paging<UserPublic>> {
  const params = listUsersQuery.parse({
    from: q.from ?? 0,
    count: q.count ?? 20,
  });
  return apiGet<Paging<UserPublic>>('/users', params);
}
