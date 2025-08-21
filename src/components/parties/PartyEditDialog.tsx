import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  Stack,
} from '@mui/material';

export type PartyEditableFields = {
  partyName: string;
  description?: string;
  maxNumberOfMembers: number;
};

export interface PartyEditDialogProps {
  open: boolean;
  onClose: () => void;
  partyId: string;
  initialValues: PartyEditableFields | null;
  // PATCH 成功後にサーバーから戻る最新 party オブジェクトを渡す
  onUpdated: (updated: any) => void;
}

interface ApiError {
  code: string;
  message: string;
}

const PartyEditDialog: React.FC<PartyEditDialogProps> = ({
  open,
  onClose,
  partyId,
  initialValues,
  onUpdated,
}) => {
  const [partyName, setPartyName] = useState('');
  const [description, setDescription] = useState('');
  const [maxNumberOfMembers, setMaxNumberOfMembers] = useState<number>(8);

  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open && initialValues) {
      setPartyName(initialValues.partyName ?? '');
      setDescription(initialValues.description ?? '');
      setMaxNumberOfMembers(initialValues.maxNumberOfMembers ?? 8);
      setApiError(null);
      setValidationError(null);
    }
  }, [open, initialValues]);

  const validate = useCallback((): boolean => {
    if (partyName.trim().length === 0) {
      setValidationError('パーティー名は必須です。');
      return false;
    }
    if (partyName.length > 32) {
      setValidationError('パーティー名は32文字以内です。');
      return false;
    }
    if (description.length > 5120) {
      setValidationError('概要は5120文字以内です。');
      return false;
    }
    if (!Number.isInteger(maxNumberOfMembers) || maxNumberOfMembers < 1 || maxNumberOfMembers > 50) {
      setValidationError('最大人数は1〜50の整数で指定してください。');
      return false;
    }
    setValidationError(null);
    return true;
  }, [partyName, description, maxNumberOfMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!initialValues) return;
    if (!validate()) return;

    // 差分抽出
    const payload: Partial<PartyEditableFields> = {};
    if (partyName !== initialValues.partyName) payload.partyName = partyName;
    if ((description ?? '') !== (initialValues.description ?? '')) payload.description = description;
    if (maxNumberOfMembers !== initialValues.maxNumberOfMembers) payload.maxNumberOfMembers = maxNumberOfMembers;

    if (Object.keys(payload).length === 0) {
      setValidationError('変更がありません。');
      return;
    }

    setSubmitting(true);
    setApiError(null);
    try {
      const res = await fetch(`/quest-board/api/v1/parties/${partyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        onUpdated(json.data); // data はサーバーで camelize 済み party
        onClose();
      } else {
        setApiError({ code: json.code, message: json.message ?? '更新に失敗しました。' });
      }
    } catch (err: any) {
      setApiError({ code: 'network_error', message: 'ネットワークエラーが発生しました。' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !submitting && onClose()} fullWidth maxWidth='sm'>
      <form onSubmit={handleSubmit}>
        <DialogTitle>パーティー編集</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {validationError && <Alert severity='warning'>{validationError}</Alert>}
            {apiError && <Alert severity='error'>[{apiError.code}] {apiError.message}</Alert>}
            <TextField
              label='パーティー名'
              value={partyName}
              required
              inputProps={{ maxLength: 32 }}
              onChange={e => setPartyName(e.target.value)}
              disabled={submitting}
              fullWidth
            />
            <TextField
              label='概要'
              value={description}
              inputProps={{ maxLength: 5120 }}
              onChange={e => setDescription(e.target.value)}
              disabled={submitting}
              fullWidth
              multiline
              minRows={3}
            />
            <TextField
              label='最大人数'
              type='number'
              value={maxNumberOfMembers}
              onChange={e => setMaxNumberOfMembers(Number(e.target.value))}
              disabled={submitting}
              inputProps={{ min: 1, max: 50 }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>キャンセル</Button>
            <Button type='submit' variant='contained' disabled={submitting}>
              {submitting ? '更新中...' : '更新'}
            </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PartyEditDialog;
