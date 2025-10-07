import { z } from 'zod';
import { apiGet } from 'utils/apiClient';
import { UserPublic } from 'types/users';
import { Paging } from 'types/Paging';
import { apiPost } from 'utils/apiClient';


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

export const addUserInput = z.object({
  loginId: z.string().min(1).max(64),
  newEmail: z.string().email().max(255),
  passwordCrypted: z.string().min(8).max(1024),
});
type AddUserInput = z.infer<typeof addUserInput>;

export async function addUser(input: z.infer<typeof addUserInput>): Promise<{ userId: string }> {
  const body = addUserInput.parse(input);
  return apiPost<{ userId: string }, AddUserInput>('/users', body);
}
