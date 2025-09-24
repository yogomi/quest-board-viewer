import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button,
  Alert,
  Box,
} from '@mui/material';
import {
  getContractor,
  addContractor,
  updateContractor,
  acceptContractor,
  rejectContractor,
} from 'api/quests';
import { listParties } from 'api/parties';
import { PartyListItem } from 'types/parties';
import { useUser } from 'hooks/useUser';

export type ApplicationFormValues = {
  contractorUnitId: string;
  contractorUnitType: 'user' | 'party';
  comment?: string | null;
};

type Mode = 'create' | 'edit';

interface ApplicationUpsertDialogProps {
  open: boolean;
  mode: Mode;
  contractorId?: string;
  questId: string;
  isQuestOwner: boolean;
  isWaitingContractor: boolean;
  onClose: () => void;
  onSuccess: (updatedId: string) => void;
}

export default function ApplicationUpsertDialog({
  open,
  mode,
  contractorId,
  questId,
  isQuestOwner,
  isWaitingContractor,
  onClose,
  onSuccess,
}: ApplicationUpsertDialogProps) {

  const { user } = useUser();

  const defaultValues: ApplicationFormValues = {
    contractorUnitId: user?.id || '',
    contractorUnitType: 'user',
    comment: '',
  };
  const [values, setValues] = useState<ApplicationFormValues>(defaultValues);
  const [parties, setParties] = useState<PartyListItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isContractorOwner, setIsContractorOwner] = useState(false);

  const isGuildStaff = user?.guildStaff || false;

  // 初期化
  useEffect(() => {
    if (open) {
      setValues(defaultValues);
    }
    const leaderId = user?.id;
    if (leaderId !== undefined) {
      listParties({ from: 0, count: 100, leaderIdFilter: leaderId }).then((partiesData) => {
        if (open) {
          setParties(partiesData.items);
          setErrorMsg(null);
          setSubmitting(false);
          if (mode === 'edit' && contractorId) {
            const isOwner = partiesData.items.some(p => p.id === values.contractorUnitId);
            if (values.contractorUnitType === 'user' && values.contractorUnitId === user?.id) {
              setIsContractorOwner(true);
            } else if (values.contractorUnitType === 'party' && isOwner) {
              setIsContractorOwner(true);
            } else {
              setIsContractorOwner(false);
            }
          }
        }

        if (contractorId && mode === 'edit') {
          // 編集モードなら既存データを取得してセット
          getContractor(questId, contractorId).then((data) => {
            if (open) {
              const v = {
                contractorUnitId: data.contractorUnitId,
                contractorUnitType: data.contractorUnitType,
                comment: data.comment || '',
              };
              setValues(v);
              setErrorMsg(null);
              setSubmitting(false);
              if (data.contractorUnitType === 'user' && data.contractorUnitId === user?.id) {
                setIsContractorOwner(true);
              } else {
                const isOwner = parties.some(p => p.id === data.contractorUnitId);
                if (data.contractorUnitType === 'party' && isOwner) {
                  setIsContractorOwner(true);
                } else {
                  setIsContractorOwner(false);
                }
              }
            }
          }).catch((e) => {
            setErrorMsg('応募内容の取得に失敗しました。');
            console.error(e);
          });
        }

      }).catch((e) => {;
        setErrorMsg('Partiesの取得に失敗しました。');
        console.error(e);
      });
    }
  }, [open, questId, contractorId, user?.id]);

  const handleChange = (field: keyof ApplicationFormValues, value: any) => {
    if (field === 'contractorUnitId') {
      const unitType = (value === user?.id) ? 'user' : 'party';
      setValues(prev => ({ ...prev, contractorUnitId: value, contractorUnitType: unitType }));
      return;
    }
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const disabled = !values.contractorUnitId.trim() || !values.contractorUnitType.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    setSubmitting(true);
    setErrorMsg(null);

    const payload: any = {
      contractorUnitId: values.contractorUnitId,
      contractorUnitType: values.contractorUnitType,
      comment: values.comment || '',
    };

    try {
      if (mode === 'create') {
        try {
          const quest_contractor = await addContractor(questId, payload);
          onSuccess(quest_contractor.id);
          onClose();
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to create.');
        }
      } else {
        if (!contractorId) {
          setErrorMsg('contractorId is missing.');
          return;
        }

        try {
          const quest_contractor = await updateContractor(questId, contractorId, payload);
          onSuccess(quest_contractor.id);
          onClose();
        } catch (err: any) {
          setErrorMsg(err || 'Failed to create.');
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network or unexpected error.');
    } finally {
      setSubmitting(false);
    }
  };

  function Buttons() {
    if (mode === 'create') {
      return (
        <Button
          type='submit'
          form='contractor-upsert-form'
          variant='contained'
          disabled={disabled}
        >
          {submitting ? '作成中' : '作成'}
        </Button>
      );
    } else if (isContractorOwner && mode === 'edit') {
      return (
        <Button
          type='submit'
          form='contractor-upsert-form'
          variant='contained'
          disabled={disabled}
        >
          {submitting ? '更新中' : '更新'}
        </Button>
      );
    } else if (isQuestOwner && (isWaitingContractor || isGuildStaff) && mode === 'edit') {
      const accept = async () => {
        try {
          const quest_contractor = await acceptContractor(questId, contractorId!);
          onSuccess(quest_contractor.id);
          onClose();
        } catch (e) {
          console.error(e);
          setErrorMsg('応募の承認に失敗しました。');
        }
      }

      const reject = async () => {
        try {
          const quest_contractor = await rejectContractor(questId, contractorId!);
          onSuccess(quest_contractor.id);
          onClose();
        } catch (e) {
          console.error(e);
          setErrorMsg('応募の拒否に失敗しました。');
        }
      }

      return (
        <React.Fragment>
          <Button
            onClick={accept}
          >承認</Button>
          <Button
            onClick={reject}
          >拒否</Button>
        </React.Fragment>
      );
    }
    return null;
  }

  return (
    <Dialog open={open} onClose={() => !submitting && onClose()} fullWidth maxWidth="sm">
      <DialogTitle>
        {mode === 'create' ? '新規応募' : '応募内容編集'}
      </DialogTitle>
      <DialogContent dividers>
        {errorMsg && <Alert severity='error' sx={{ mb: 2 }}>{errorMsg}</Alert>}
        <Box
          component='form'
          id='contractor-upsert-form'
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}
        >
          {mode === 'create' ? (
            <TextField
              label="応募者"
              select
              placeholder="ユーザーで応募。またはパーティーで応募"
              value={values.contractorUnitId}
              onChange={(e) => handleChange('contractorUnitId', e.target.value)}
              fullWidth
            >
              <MenuItem value={user?.id || ''} key={user?.id || ''}>
                {user?.name} (ユーザー)
              </MenuItem>
              {parties?.map((party: PartyListItem) => (
                <MenuItem value={party.id} key={party.id}>
                  {party.partyName} (パーティー)
                </MenuItem>
              ))}
            </TextField>
            ) : null
          }
          <TextField
            label='応募メッセージ'
            multiline
            minRows={4}
            value={values.comment}
            disabled={mode === 'edit' && !isContractorOwner}
            slotProps={{ htmlInput: {maxLength: 5120} }}
            onChange={e => handleChange('comment', e.target.value)}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Buttons />
        <Button onClick={() => onClose()} disabled={submitting}>閉じる</Button>
      </DialogActions>
    </Dialog>
  );
}
