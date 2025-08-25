import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Alert,
  Link,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCookies } from 'react-cookie';
import { rankToAlpha } from 'utils/questRank';

type QuestItem = {
  id: string;
  title: string;
  rank: number;
  limitDate: string | null;
  createdAt: string;
};

type ListResponse = {
  success: boolean;
  code: string;
  message: string;
  data: {
    from: number;
    count: number;
    total: number;
    items: QuestItem[];
  } | null;
};

// ページ保持用のCookieキー（アナウンス一覧に合わせたUI/挙動）
const COOKIE_PAGE = 'qb_quests_page';
const COOKIE_ROWS = 'qb_quests_rows';
const COOKIE_OPTS = { path: '/', maxAge: 60 * 60 * 24 * 30 };

export default function QuestListPage() {
  const navigate = useNavigate();

  // isStaff チェックは不要（誰でも見られるページ）
  const [cookies, setCookie] = useCookies([COOKIE_PAGE, COOKIE_ROWS]);

  const initialRows = useMemo(() => {
    const r = Number(cookies[COOKIE_ROWS]);
    return Number.isFinite(r) && [10, 20, 50, 100].includes(r) ? r : 20;
  }, [cookies]);

  const initialPage = useMemo(() => {
    const p = Number(cookies[COOKIE_PAGE]);
    return Number.isFinite(p) && p >= 0 ? p : 0;
  }, [cookies]);

  const [rowsPerPage, setRowsPerPage] = useState<number>(initialRows);
  const [page, setPage] = useState<number>(initialPage);
  const [total, setTotal] = useState<number>(0);
  const [items, setItems] = useState<QuestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadQuests = useCallback(
    async (count: number, from: number) => {
      setLoading(true);
      setErrorMsg('');
      try {
        const qs = new URLSearchParams({
          from: String(from),
          count: String(count),
        }).toString();
        const res = await fetch(`/quest-board/api/v1/quests?${qs}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
        const json: ListResponse = await res.json();
        if (!json.success || !json.data) {
          throw new Error(json.message || 'Failed to load quests.');
        }
        const data = json.data;
        const mapped: QuestItem[] = (data.items || []).map((it: any) => ({
          id: it.id ?? it.questId,
          title: it.title ?? '',
          rank: it.rank ?? 0,
          limitDate: it.limitDate ?? null,
          createdAt: it.createdAt ?? '',
        }));
        setItems(mapped);
        setTotal(data.total);

        // 範囲外ページの場合は補正
        const maxPage = Math.max(0, Math.ceil(data.total / count) - 1);
        if (page > maxPage) {
          setPage(maxPage);
          setCookie(COOKIE_PAGE, String(maxPage), COOKIE_OPTS);
        }
      } catch (e: any) {
        setErrorMsg(e?.message || '取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    },
    [page, setCookie]
  );

  useEffect(() => {
    const from = page * rowsPerPage;
    void loadQuests(rowsPerPage, from);
  }, [page, rowsPerPage, loadQuests]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
    setCookie(COOKIE_PAGE, String(newPage), COOKIE_OPTS);
  };

  const handleChangeRowsPerPage = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const next = parseInt(e.target.value, 10);
    setRowsPerPage(next);
    setCookie(COOKIE_ROWS, String(next), COOKIE_OPTS);
    setPage(0);
    setCookie(COOKIE_PAGE, '0', COOKIE_OPTS);
  };

  const formatDateTime = (iso: string | null) => {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h5' sx={{ mb: 2 }}>
        クエスト一覧
      </Typography>

      {/* アナウンス一覧ページと同様の操作列（更新 + 追加） */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant='outlined'
          onClick={() => loadQuests(rowsPerPage, page * rowsPerPage)}
        >
          更新
        </Button>
        <Button
          variant='contained'
          onClick={() => navigate('/quest-board/quests/new')}
        >
          クエスト追加
        </Button>
      </Box>

      {errorMsg && <Alert severity='error' sx={{ mb: 2 }}>{errorMsg}</Alert>}

      {loading ? (
        <CircularProgress />
      ) : (
        <React.Fragment>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>タイトル</TableCell>
                <TableCell>ランク</TableCell>
                <TableCell>期限</TableCell>
                <TableCell>作成日時</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((q) => (
                <TableRow key={q.id} hover>
                  <TableCell>
                    <Link
                      component='button'
                      onClick={() => navigate(`/quest-board/quests/${q.id}`)}
                      underline='hover'
                    >
                      {q.title || '(無題)'}
                    </Link>
                  </TableCell>
                  <TableCell>{rankToAlpha(q.rank)}</TableCell>
                  <TableCell>{formatDateTime(q.limitDate)}</TableCell>
                  <TableCell>{formatDateTime(q.createdAt)}</TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant='body2' color='text.secondary'>
                      クエストは見つかりませんでした。
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50, 100]}
            component='div'
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </React.Fragment>
      )}
    </Box>
  );
}
