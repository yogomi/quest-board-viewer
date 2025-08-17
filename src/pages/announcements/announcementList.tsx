import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useUser } from 'hooks/useUser';

type AnnouncementCreator = {
  id: string;
  login_id: string;
  email: string;
};

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
  creator?: AnnouncementCreator;
};

type ListResponse = {
  success: boolean;
  code: string;
  message: string;
  data: {
    from: number;
    count: number;
    total: number;
    announcements: AnnouncementItem[];
  };
};

function AddAnnouncementDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [importance, setImportance] = useState<'low' | 'normal' | 'high'>('normal');
  const [expiresAt, setExpiresAt] = useState<string>(''); // datetime-local
  const [notifiedByMail, setNotifiedByMail] = useState(false);
  const [notifiedByPush, setNotifiedByPush] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setMessage('');
    setImportance('normal');
    setExpiresAt('');
    setNotifiedByMail(false);
    setNotifiedByPush(false);
    setErrorMsg(null);
  };

  const handleClose = () => {
    if (!submitting) {
      onClose();
      reset();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg(null);

    // expiresAt (datetime-local) を ISO8601 へ
    let expiresAtISO: string | undefined = undefined;
    if (expiresAt.trim()) {
      const d = new Date(expiresAt);
      if (!isNaN(d.getTime())) {
        expiresAtISO = d.toISOString();
      }
    }

    const payload: any = {
      title,
      message,
      importance,
      notifiedByMail,
      notifiedByPush,
    };
    if (expiresAtISO) payload.expiresAt = expiresAtISO;

    try {
      const res = await fetch('/quest-board/api/v1/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        onCreated();
        handleClose();
      } else {
        setErrorMsg(json.message || 'Failed to create announcement.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Network or unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='sm'>
      <DialogTitle>アナウンス追加</DialogTitle>
      <DialogContent dividers>
        {errorMsg && <Alert severity='error' sx={{ mb: 2 }}>{errorMsg}</Alert>}
        <Box
          component='form'
          onSubmit={handleSubmit}
          noValidate
          id='add-announcement-form'
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <TextField
            label='タイトル'
            required
            value={title}
            onChange={e => setTitle(e.target.value)}
            inputProps={{ maxLength: 255 }}
          />
            <TextField
              label='本文'
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              inputProps={{ maxLength: 1000 }}
              multiline
              minRows={4}
            />
          <FormControl fullWidth>
            <InputLabel id='importance-label'>重要度</InputLabel>
            <Select
              labelId='importance-label'
              label='重要度'
              value={importance}
              onChange={e => setImportance(e.target.value as any)}
            >
              <MenuItem value='low'>low</MenuItem>
              <MenuItem value='normal'>normal</MenuItem>
              <MenuItem value='high'>high</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label='有効期限 (任意)'
            type='datetime-local'
            value={expiresAt}
            onChange={e => setExpiresAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={notifiedByMail}
                  onChange={e => setNotifiedByMail(e.target.checked)}
                />
              }
              label='メール通知'
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={notifiedByPush}
                  onChange={e => setNotifiedByPush(e.target.checked)}
                />
              }
              label='プッシュ通知'
            />
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>閉じる</Button>
        <Button
          type='submit'
          form='add-announcement-form'
          variant='contained'
          disabled={submitting || !title.trim() || !message.trim()}
        >
          {submitting ? '送信中...' : '作成'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function AnnouncementList() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  console.log('AnnouncementList rendered', { user });
  const isStaff = !!user?.guildStaff || user?.systemAdministrator;

  const loadAnnouncements = useCallback(async (count: number, from: number) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/quest-board/api/v1/announcements?from=${from}&count=${count}`, {
        method: 'GET',
      });
      const json: ListResponse = await res.json();
      if (json.success) {
        setAnnouncements(json.data.announcements);
        setTotal(json.data.total);
      } else {
        setErrorMsg(json.message || 'Failed to fetch announcements.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnnouncements(rowsPerPage, page * rowsPerPage);
  }, [loadAnnouncements, rowsPerPage, page]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
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
          <Button
            variant='contained'
            onClick={() => setAddDialogOpen(true)}
          >
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
                      {expired && <span style={{ color: '#f44336', marginLeft: 4 }}>(期限切れ)</span>}
                    </TableCell>
                    <TableCell>
                      {a.importance}
                    </TableCell>
                    <TableCell>
                      {a.expiresAt ? new Date(a.expiresAt).toLocaleString() : '-'}
                    </TableCell>
                    <TableCell>
                      {a.creator
                        ? `${a.creator.login_id} (${a.creator.email})`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {new Date(a.createdAt).toLocaleString()}
                    </TableCell>
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

      <AddAnnouncementDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onCreated={() => loadAnnouncements(rowsPerPage, page * rowsPerPage)}
      />
    </Box>
  );
}
