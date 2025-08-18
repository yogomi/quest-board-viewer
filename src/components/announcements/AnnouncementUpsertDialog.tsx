import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Alert,
  Box,
} from '@mui/material';

export type AnnouncementFormValues = {
  title: string;
  message: string;
  importance: 'low' | 'normal' | 'high';
  expiresAt: string | null; // ISO文字列 or null
  notifiedByMail: boolean;
  notifiedByPush: boolean;
};

type Mode = 'create' | 'edit';

interface AnnouncementUpsertDialogProps {
  open: boolean;
  mode: Mode;
  announcementId?: string;
  initialValues?: AnnouncementFormValues;
  onClose: () => void;
  onSuccess: (updatedId: string) => void;
}

const defaultValues: AnnouncementFormValues = {
  title: '',
  message: '',
  importance: 'normal',
  expiresAt: null,
  notifiedByMail: false,
  notifiedByPush: false,
};

export default function AnnouncementUpsertDialog({
  open,
  mode,
  announcementId,
  initialValues,
  onClose,
  onSuccess,
}: AnnouncementUpsertDialogProps) {

  const [values, setValues] = useState<AnnouncementFormValues>(initialValues || defaultValues);
  const [expiresLocal, setExpiresLocal] = useState<string>(''); // datetime-local 用
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 初期化
  useEffect(() => {
    if (open) {
      const v = initialValues ? { ...initialValues } : { ...defaultValues };
      setValues(v);
      if (v.expiresAt) {
        // datetime-local はローカルタイムの YYYY-MM-DDThh:mm 形式
        const d = new Date(v.expiresAt);
        const tzOffset = d.getTimezoneOffset() * 60000;
        const localISO = new Date(d.getTime() - tzOffset).toISOString().slice(0,16);
        setExpiresLocal(localISO);
      } else {
        setExpiresLocal('');
      }
      setErrorMsg(null);
      setSubmitting(false);
    }
  }, [open, initialValues]);

  const handleChange = (field: keyof AnnouncementFormValues, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const disabled = !values.title.trim() || !values.message.trim() || submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setSubmitting(true);
    setErrorMsg(null);

    let expiresAtISO: string | null = null;
    if (expiresLocal.trim()) {
      const d = new Date(expiresLocal);
      if (!isNaN(d.getTime())) {
        expiresAtISO = d.toISOString();
      }
    }

    const payload: any = {
      title: values.title,
      message: values.message,
      importance: values.importance,
      notifiedByMail: values.notifiedByMail,
      notifiedByPush: values.notifiedByPush,
      expiresAt: expiresAtISO, // null のままの場合は期限解除としたい => mode=edit で expiresLocal 空なら null を送る
    };

    if (!expiresLocal) {
      payload.expiresAt = null;
    }

    try {
      if (mode === 'create') {
        const res = await fetch('/quest-board/api/v1/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data && json.data.announcementId) {
          onSuccess(json.data.announcementId);
          onClose();
        } else {
          setErrorMsg(json.message || 'Failed to create.');
        }
      } else {
        if (!announcementId) {
          setErrorMsg('announcementId is missing.');
          return;
        }
        const res = await fetch(`/quest-board/api/v1/announcements/${announcementId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json.success && json.data) {
          onSuccess(announcementId);
          onClose();
        } else {
          setErrorMsg(json.message || 'Failed to update.');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network or unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => !submitting && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === 'create' ? 'アナウンス追加' : 'アナウンス編集'}
      </DialogTitle>
      <DialogContent dividers>
        {errorMsg && <Alert severity='error' sx={{ mb: 2 }}>{errorMsg}</Alert>}
        <Box
          component='form'
          id='announcement-upsert-form'
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          <TextField
            label='タイトル'
            required
            value={values.title}
            inputProps={{ maxLength: 255 }}
            onChange={e => handleChange('title', e.target.value)}
          />
          <TextField
            label='本文'
            required
            multiline
            minRows={4}
            value={values.message}
            inputProps={{ maxLength: 1000 }}
            onChange={e => handleChange('message', e.target.value)}
          />
          <FormControl fullWidth>
            <InputLabel id='importance-label'>重要度</InputLabel>
            <Select
              labelId='importance-label'
              label='重要度'
              value={values.importance}
              onChange={e => handleChange('importance', e.target.value)}
            >
              <MenuItem value='low'>low</MenuItem>
              <MenuItem value='normal'>normal</MenuItem>
              <MenuItem value='high'>high</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label='有効期限 (空で解除)'
            type='datetime-local'
            value={expiresLocal}
            onChange={e => setExpiresLocal(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.notifiedByMail}
                  onChange={e => handleChange('notifiedByMail', e.target.checked)}
                />
              }
              label='メール通知フラグ'
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={values.notifiedByPush}
                  onChange={e => handleChange('notifiedByPush', e.target.checked)}
                />
              }
              label='プッシュ通知フラグ'
            />
          </FormGroup>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()} disabled={submitting}>閉じる</Button>
        <Button
          type='submit'
          form='announcement-upsert-form'
          variant='contained'
          disabled={disabled}
        >
          {submitting
            ? (mode === 'create' ? '作成中...' : '更新中...')
            : (mode === 'create' ? '作成' : '更新')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
