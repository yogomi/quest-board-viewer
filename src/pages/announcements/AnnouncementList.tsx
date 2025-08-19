import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { useUser } from 'hooks/useUser';
import { useNavigate } from 'react-router-dom';
import AnnouncementUpsertDialog, { AnnouncementFormValues } from 'components/announcements/AnnouncementUpsertDialog';

export type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  importance: 'low' | 'normal' | 'high';
  expiresAt: string | null;
  notifiedByMail: boolean;
  notifiedByPush: boolean;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    login_id: string;
    email: string;
  };
};

type ListResponse = {
  success: boolean;
  code: string;
  message: string;
  data: {
    from: number;
    count: number;
    total: number;
    items: AnnouncementItem[];
  };
};

export default function AnnouncementList() {
  const { user } = useUser();
  const navigate = useNavigate();
  const isStaff = !!user?.guildStaff || user?.systemAdministrator;

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const loadAnnouncements = useCallback(async (count: number, from: number) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/quest-board/api/v1/announcements?from=${from}&count=${count}`);
      const json: ListResponse = await res.json();
      if (json.success) {
        setAnnouncements(json.data.items);
        setTotal(json.data.total);
      } else {
        setErrorMsg(json.message || 'Failed to fetch announcements.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements(rowsPerPage, page * rowsPerPage);
  }, [loadAnnouncements, rowsPerPage, page]);

  const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleCreateSuccess = (newId: string) => {
    // 再読込
    loadAnnouncements(rowsPerPage, page * rowsPerPage);
    // 直後に詳細へ遷移したい場合は下記をコメントアウト解除
    // navigate(`/quest-board/announcement/${newId}`);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant='h5' sx={{ mb: 2 }}>アナウンス一覧</Typography>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Button
          variant='outlined'
          onClick={() => loadAnnouncements(rowsPerPage, page * rowsPerPage)}
        >
          更新
        </Button>
        {isStaff && (
          <Button variant='contained' onClick={() => setCreateOpen(true)}>
            アナウンス追加
          </Button>
        )}
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
                <TableCell>重要度</TableCell>
                <TableCell>期限</TableCell>
                <TableCell>作成者</TableCell>
                <TableCell>作成日時</TableCell>
                <TableCell>本文</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {announcements.map(a => {
                const expired = a.expiresAt ? new Date(a.expiresAt) < new Date() : false;
                return (
                  <TableRow key={a.id} hover>
                    <TableCell
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/quest-board/announcement/${a.id}`)}
                    >
                      <Link
                        component='button'
                        underline='hover'
                        color='inherit'
                        sx={{ fontWeight: 'bold' }}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          navigate(`/quest-board/announcement/${a.id}`);
                        }}
                      >
                        {a.title}
                      </Link>
                      {expired && (
                        <span style={{ color: '#f44336', marginLeft: 4 }}>(期限切れ)</span>
                      )}
                    </TableCell>
                    <TableCell>{a.importance}</TableCell>
                    <TableCell>
                      {a.expiresAt ? new Date(a.expiresAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      {a.creator
                        ? `${a.creator.login_id} (${a.creator.email})`
                        : '-'}
                    </TableCell>
                    <TableCell>{new Date(a.createdAt).toLocaleString()}</TableCell>
                    <TableCell style={{ whiteSpace: 'pre-wrap', maxWidth: 400 }}>
                      {a.message}
                    </TableCell>
                  </TableRow>
                );
              })}
              {announcements.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align='center'>
                    データがありません。
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component='div'
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
          />
        </React.Fragment>
      )}

      {isStaff && (
        <AnnouncementUpsertDialog
          open={createOpen}
          mode='create'
            onClose={() => setCreateOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </Box>
  );
}
