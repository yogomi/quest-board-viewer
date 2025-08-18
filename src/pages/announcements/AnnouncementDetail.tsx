import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Stack,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from 'hooks/useUser';
import AnnouncementUpsertDialog, { AnnouncementFormValues } from 'components/announcements/AnnouncementUpsertDialog';

type AnnouncementDetailData = {
  id: string;
  title: string;
  message: string;
  importance: 'low' | 'normal' | 'high';
  expiresAt: string | null;
  notifiedByMail: boolean;
  notifiedByPush: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    loginId: string;
    email: string;
  } | null;
};

type GetResponse = {
  success: boolean;
  code: string;
  message: string;
  data: {
    announcement: AnnouncementDetailData;
  } | null;
};

export default function AnnouncementDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const isStaff = !!user?.guildStaff || user?.systemAdministrator;

  const [loading, setLoading] = useState(true);
  const [announcement, setAnnouncement] = useState<AnnouncementDetailData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/quest-board/api/v1/announcements/${id}`);
      const json: GetResponse = await res.json();
      if (json.success && json.data) {
        setAnnouncement(json.data.announcement);
      } else {
        setErrorMsg(json.message || 'Failed to fetch announcement.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Network error.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      const res = await fetch(`/quest-board/api/v1/announcements/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        navigate('/quest-board/announcement/list');
      } else {
        setErrorMsg(json.message || 'Failed to delete announcement.');
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('Network error.');
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const openEdit = () => {
    setEditOpen(true);
  };

  const handleEditSuccess = () => {
    // 更新後再取得
    loadDetail();
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (errorMsg) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity='error' sx={{ mb: 2 }}>{errorMsg}</Alert>
        <Button variant='outlined' onClick={() => navigate('/quest-board/announcement/list')}>
          一覧へ戻る
        </Button>
      </Box>
    );
  }

  if (!announcement) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity='warning'>データが見つかりません。</Alert>
        <Button variant='outlined' onClick={() => navigate('/quest-board/announcement/list')}>
          一覧へ戻る
        </Button>
      </Box>
    );
  }

  const expired = announcement.expiresAt
    ? new Date(announcement.expiresAt) < new Date()
    : false;

  const editInitialValues: AnnouncementFormValues = {
    title: announcement.title,
    message: announcement.message,
    importance: announcement.importance,
    expiresAt: announcement.expiresAt,
    notifiedByMail: announcement.notifiedByMail,
    notifiedByPush: announcement.notifiedByPush,
  };

  return (
    <Box sx={{ p: 2, maxWidth: 900 }}>
      <Typography variant='h5' sx={{ mb: 1 }}>
        {announcement.title}
      </Typography>
      <Stack direction='row' spacing={1} sx={{ mb: 2 }}>
        <Chip
          label={`importance: ${announcement.importance}`}
          color={
            announcement.importance === 'high'
              ? 'error'
              : announcement.importance === 'normal'
              ? 'primary'
              : 'default'
          }
          size='small'
        />
        {announcement.expiresAt && (
          <Chip
            label={
              expired
                ? `期限切れ: ${new Date(announcement.expiresAt).toLocaleString()}`
                : `期限: ${new Date(announcement.expiresAt).toLocaleString()}`
            }
            color={expired ? 'warning' : 'default'}
            size='small'
          />
        )}
        {announcement.notifiedByMail && <Chip label='mail通知フラグ' size='small' />}
        {announcement.notifiedByPush && <Chip label='push通知フラグ' size='small' />}
      </Stack>

      <Typography variant='body2' sx={{ color: 'text.secondary', mb: 2 }}>
        作成日時: {new Date(announcement.createdAt).toLocaleString()} / 更新日時: {new Date(announcement.updatedAt).toLocaleString()}
      </Typography>
      <Typography variant='body2' sx={{ color: 'text.secondary', mb: 2 }}>
        作成者: {announcement.creator
          ? `${announcement.creator.loginId} (${announcement.creator.email})`
          : '-'}
      </Typography>

      <Box
        sx={{
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace',
          bgcolor: 'background.paper',
          p: 2,
          borderRadius: 1,
          border: theme => `1px solid ${theme.palette.divider}`,
          mb: 3,
        }}
      >
        {announcement.message}
      </Box>

      <Stack direction='row' spacing={2}>
        <Button
          variant='outlined'
          onClick={() => navigate('/quest-board/announcement/list')}
        >
          一覧へ戻る
        </Button>
        {isStaff && (
          <>
            <Button
              variant='contained'
              color='primary'
              onClick={openEdit}
            >
              編集
            </Button>
            <Button
              variant='contained'
              color='error'
              onClick={() => setDeleteDialogOpen(true)}
            >
              削除
            </Button>
          </>
        )}
      </Stack>

      {/* 削除確認 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>アナウンス削除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            このアナウンスを削除します。よろしいですか？
          </DialogContentText>
          {errorMsg && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {errorMsg}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            キャンセル
          </Button>
            <Button
              onClick={handleDelete}
              color='error'
              variant='contained'
              disabled={deleting}
            >
              {deleting ? '削除中...' : '削除する'}
            </Button>
        </DialogActions>
      </Dialog>

      {/* 編集ダイアログ */}
      {isStaff && (
        <AnnouncementUpsertDialog
          open={editOpen}
          mode='edit'
          announcementId={announcement.id}
          initialValues={editInitialValues}
          onClose={() => setEditOpen(false)}
          onSuccess={() => {
            setEditOpen(false);
            loadDetail();
          }}
        />
      )}
    </Box>
  );
}
