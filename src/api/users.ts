import { z } from 'zod';
import { apiGet } from 'utils/apiClient';
import { UserPublic, UserListItem } from 'types/users';
import { Paging } from 'types/Paging';

/**
 * @api {GET} /users ユーザー一覧の取得（全ページ走査）
 * @description
 *   - ユーザー一覧をページングで取得するAPIを内部で複数回呼び出し、
 *     全件を収集して { id, name } に正規化して返す。
 *   - ギルドスタッフ／システム管理者権限が必要。
 *   - utils/apiClient 経由で呼び出す（ベースパスは apiClient 側で付与）。
 *   - name は nickname > loginId > id の優先順位で決定する。
 *
 * @request
 *   - クエリストリング（内部利用）:
 *     - from: number（0 始まりのオフセット）
 *     - count: number（1〜1000 のページサイズ、デフォルト 1000）
 *   - バリデーションは zod で実施（レスポンス検証）。
 *   - バリデーション失敗時は Error を throw する。
 *
 * @response
 *   - 例: { success: true, code: '', message: '...', data: { from, count, total, items } }
 *   - エラー時: { success: false, code: '...', message: '...', data: null }
 *
 * @responseExample 成功例
 *   {
 *     "success": true,
 *     "code": "",
 *     "message": "Users retrieved successfully.",
 *     "data": {
 *       "from": 0,
 *       "count": 10,
 *       "total": 50,
 *       "items": [
 *         { "id": "uuid", "loginId": "user123", "nickname": "ユーザー名" }
 *       ]
 *     }
 *   }
 *
 * @responseExample 失敗例
 *   {
 *     "success": false,
 *     "code": "no_permission",
 *     "message": "Guild staff permission required.",
 *     "data": null
 *   }
 *
 * @author viewer
 * @date 2025-08-25
 */

export type ListUsersParams = {
  pageSize?: number;
};

const userItemSchema = z
  .object({
    id: z.string().uuid(),
    loginId: z.string().optional(),
    nickname: z.string().optional(),
    rank: z.number().optional(),
    guildStaff: z.boolean().optional(),
    enabled: z.boolean().optional(),
  })
  .passthrough();

const pagingSchema = z.object({
  from: z.number(),
  count: z.number(),
  total: z.number(),
  items: z.array(userItemSchema),
});

const successResponseSchema = z.object({
  success: z.literal(true),
  code: z.string().optional().nullable(),
  message: z.string(),
  data: pagingSchema,
});

const errorResponseSchema = z.object({
  success: z.literal(false),
  code: z.string(),
  message: z.string(),
  data: z.any().nullable(),
});

type SuccessResponse = z.infer<typeof successResponseSchema>;
type ErrorResponse = z.infer<typeof errorResponseSchema>;

function toUserListItem(raw: z.infer<typeof userItemSchema>): UserListItem {
  const name = raw.nickname || raw.loginId || raw.id;
  return { id: raw.id, name };
}

async function fetchUsersPage(
  from: number,
  count: number
): Promise<Paging<UserPublic>> {
  const qs = new URLSearchParams({
    from: String(from),
    count: String(count),
  });
  // ベースパスは apiClient 側で付与される前提
  const json = (await apiGet<unknown>(`/users?${qs.toString()}`)) as unknown;

  const ok = successResponseSchema.safeParse(json);
  if (ok.success) {
    const data = ok.data.data;
    return {
      from: data.from,
      count: data.count,
      total: data.total,
      items: data.items as unknown as UserPublic[],
    };
  }

  const ng = errorResponseSchema.safeParse(json);
  if (ng.success) {
    throw new Error(ng.data.message || 'Failed to fetch users.');
  }

  throw new Error('Invalid server response when fetching users.');
}

/**
 * 全ユーザー（公開情報）を { id, name } に正規化して返す。
 * - 内部で /users を複数回呼び出し、最後までデータを取得する。
 */
export async function listUsers(
  params: ListUsersParams = {}
): Promise<UserListItem[]> {
  const pageSizeRaw = params.pageSize ?? 1000;
  const pageSize = Math.max(1, Math.min(1000, pageSizeRaw));

  let from = 0;
  let total = Infinity;
  const items: UserListItem[] = [];

  while (from < total) {
    const page = await fetchUsersPage(from, pageSize);
    total = page.total;

    if (!Array.isArray(page.items) || page.items.length === 0) {
      break;
    }

    for (const it of page.items) {
      const parsed = userItemSchema.parse(it);
      items.push(toUserListItem(parsed));
    }

    from += page.count;
    if (page.count <= 0) {
      break;
    }
  }

  return items;
}
