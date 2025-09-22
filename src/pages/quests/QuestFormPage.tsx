import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Stack,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Alert,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { jaJP } from '@mui/x-date-pickers/locales';
import dayjs, { Dayjs } from 'libs/dayjs';
import {
  upsertQuestInput,
  createQuest,
  updateQuest,
  getQuest,
  UpsertQuestInputIn
} from 'api/quests';
import { listUsers } from 'api/users';
import { useUserContext } from 'contexts/UserContext';
import {
  nowFloorHourJstIso,
  jstPartsFromIso,
  isoFromJstParts,
  addDaysJstIso,
  approxDaysFromNowJstLabel
} from 'utils/datetime';
import { useTheme } from '@mui/material/styles';
import { rankToAlpha, QUEST_RANK_MAP } from 'utils/questRank';
import { UserPublic } from 'types/users';

type Mode = 'create' | 'edit';
type QuestFormValues = z.input<typeof upsertQuestInput>;

/**
 * 時の選択肢（0-23）
 */
const HOURS = Array.from({ length: 24 }, (_, i) => i);

/**
 * DatePicker 用の背景・枠（透過抑止 + 枠表示）
 */
const PICKER_BG = 'rgba(5, 10, 20, 0.98)';
const PICKER_BORDER = '1px solid rgba(0, 255, 255, 0.4)';

export const QuestFormPage: React.FC = () => {
  const { questId } = useParams();
  const isValidUuid =
    !!questId && z.string().uuid().safeParse(questId).success;
  const mode: Mode = isValidUuid ? 'edit' : 'create';
  const nav = useNavigate();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { user } = useUserContext() as any;
  const isStaff = !!user?.guildStaff || user?.systemAdministrator;

  const nowIso = React.useMemo(() => nowFloorHourJstIso(), []);
  const weekLaterIso = React.useMemo(
    () => addDaysJstIso(nowIso, 7),
    [nowIso]
  );

  // フォーム状態
  const form = useForm<QuestFormValues>({
    resolver: zodResolver(upsertQuestInput),
    defaultValues: {
      questOwnerId: '',
      title: '',
      rank: 9,
      description: '',
      partyRequired: false,
      // 変更: 期限はデフォルトで1週間後
      limitDate: weekLaterIso,
      openCallStartDate: nowIso,
      openCallEndDate: weekLaterIso,
      rewordPoint: 0,
      rewordItems: [],
      videos: [],
      photos: []
    }
  });

  const watchRank = form.watch('rank');

  // オーナー選択用ユーザー一覧
  const usersQ = useQuery({
    queryKey: ['users', 'for-owner-select'],
    queryFn: async () => {
      const res = await listUsers({ from: 0, count: 1000 });
      return res.items || [];
    },
    enabled: isStaff,
    staleTime: 60 * 1000
  });

  // 初期化（編集時は既存値、作成時は既定値）
  React.useEffect(() => {
    if (isValidUuid && questId) {
      getQuest(questId).then((q) => {
        form.reset({
          questOwnerId: q.questOwnerId,
          title: q.title,
          rank: q.rank,
          description: q.description ?? '',
          partyRequired: q.partyRequired,
          // 変更: 未設定時のフォールバックも1週間後
          limitDate: q.limitDate ?? weekLaterIso,
          openCallStartDate: q.openCallStartDate ?? nowIso,
          openCallEndDate: q.openCallEndDate ?? weekLaterIso,
          rewordPoint: q.rewordPoint,
          rewordItems: q.rewordItems,
          videos: q.videos,
          photos: q.photos
        });
      });
    } else {
      form.reset({
        questOwnerId: user?.id ?? '',
        title: '',
        rank: 9,
        description: '',
        partyRequired: false,
        // 変更: デフォルトで1週間後
        limitDate: weekLaterIso,
        openCallStartDate: nowIso,
        openCallEndDate: weekLaterIso,
        rewordPoint: 0,
        rewordItems: [],
        videos: [],
        photos: []
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidUuid, questId, user?.id, nowIso, weekLaterIso]);

  // 一般ユーザーは owner を固定
  React.useEffect(() => {
    if (!isStaff && user?.id) {
      form.setValue('questOwnerId', user.id, { shouldDirty: true });
    }
  }, [form, isStaff, user?.id]);

  // 作成/更新
  const mut = useMutation({
    mutationFn: async (v: UpsertQuestInputIn) => {
      if (mode === 'create') return createQuest(v);
      return updateQuest(questId!, v);
    },
    onSuccess: () => {
      nav(`/quest-board/quest/list`);
    }
  });

  // 選択値・エラー
  const err = form.formState.errors;
  const ownerId = form.watch('questOwnerId');
  const users: UserPublic[] = (usersQ.data as UserPublic[]) ?? [];

  // 日付値
  const limitIso = form.watch('limitDate') ?? weekLaterIso;
  const startIso = form.watch('openCallStartDate') ?? nowIso;
  const endIso = form.watch('openCallEndDate') ?? weekLaterIso;

  const limitParts = jstPartsFromIso(limitIso);
  const startParts = jstPartsFromIso(startIso);
  const endParts = jstPartsFromIso(endIso);

  // 日付 + 時の変更
  const handleDateHourChange = (
    field: 'limitDate' | 'openCallStartDate' | 'openCallEndDate',
    dateStr: string,
    hour: number
  ) => {
    const nextIso = isoFromJstParts(dateStr, hour);
    form.setValue(field, nextIso, { shouldDirty: true });
  };

  const toDayjs = (dateStr: string): Dayjs => dayjs(dateStr, 'YYYY-MM-DD');

  // DatePicker の透過抑止＋枠（ポータル先含め強制）
  const commonPickerSlotProps = {
    popper: {
      disablePortal: false,
      sx: {
        '& .MuiPaper-root': {
          backgroundColor: `${PICKER_BG} !important`,
          backgroundImage: 'none !important',
          backdropFilter: 'none !important',
          border: `${PICKER_BORDER} !important`,
          borderRadius: '8px !important'
        }
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mobilePaper: {
      sx: {
        backgroundColor: `${PICKER_BG} !important`,
        backgroundImage: 'none !important',
        backdropFilter: 'none !important',
        border: `${PICKER_BORDER} !important`,
        borderRadius: '8px !important'
      }
    } as any
  } as const;

  // 相関チェック
  const isEndBeforeStart = dayjs(endIso).isBefore(dayjs(startIso));
  const isEndAfterLimit = dayjs(endIso).isAfter(dayjs(limitIso));

  // ダイアログのクローズ
  const handleClose = () => {
    if (!mut.isPending) {
      nav(-1);
    }
  };

  return (
    <Dialog
      open
      fullWidth
      maxWidth="md"
      fullScreen={fullScreen}
      onClose={handleClose}
      aria-labelledby="quest-form-dialog-title"
    >
      <DialogTitle id="quest-form-dialog-title" sx={{ pr: 6 }}>
        {mode === 'create' ? 'クエストを新規作成' : 'クエストを編集'}
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          disabled={mut.isPending}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale="ja"
        localeText={
          jaJP.components.MuiLocalizationProvider.defaultProps.localeText
        }
      >
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))}>
          <DialogContent dividers>
            <Stack spacing={2}>
              {/* 依頼主 */}
              {isStaff ? (
                <TextField
                  label="依頼主（管理者／スタッフのみ変更可）"
                  select
                  placeholder="ユーザーを選択"
                  value={ownerId}
                  onChange={(e) => 
                    form.setValue('questOwnerId', e.target.value, {
                      shouldDirty: true
                    })
                  }
                  fullWidth
                >
                  {users.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.loginId}
                    </MenuItem>
                  ))}
                </TextField>
              ) : (
                <TextField
                  label="依頼主"
                  placeholder="ログインユーザー"
                  fullWidth
                  value={user?.loginId ?? ''}
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  helperText="一般ユーザーは変更できません"
                />
              )}

              {/* タイトル + ランク */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ sm: 'center' }}
              >
                <TextField
                  label="タイトル"
                  fullWidth
                  {...form.register('title')}
                  error={!!err.title}
                  helperText={(err.title?.message as string) || ''}
                />

                <TextField
                  label="ランク"
                  select
                  value={rankToAlpha(watchRank)}
                  onChange={(e) =>
                    form.setValue('rank', Number(e.target.value), {
                      shouldDirty: true
                    })
                  }
                  sx={{ width: 120 }}
                >
                  {Object.keys(QUEST_RANK_MAP).map((r) => (
                    <MenuItem key={r} value={rankToAlpha(Number(r))}>
                      {rankToAlpha(Number(r))}
                    </MenuItem>
                  ))}
                </TextField>

              </Stack>

              {/* 説明 */}
              <TextField
                label="説明"
                fullWidth
                multiline
                minRows={3}
                {...form.register('description')}
                error={!!err.description}
                helperText={(err.description?.message as string) || ''}
              />

              {/* 期限 */}
              <Stack spacing={1}>
                <Typography variant="subtitle2">
                  クエスト終了期限
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ sm: 'center' }}
                >
                  <DatePicker
                    label="日付"
                    value={toDayjs(limitParts.date)}
                    format="YYYY年M月D日"
                    onChange={(v) => {
                      const dateStr =
                        v && v.isValid()
                          ? v.format('YYYY-MM-DD')
                          : limitParts.date;
                      handleDateHourChange(
                        'limitDate',
                        dateStr,
                        limitParts.hour
                      );
                    }}
                    slotProps={{
                      ...commonPickerSlotProps,
                      textField: {
                        error: !!err.limitDate,
                        helperText:
                          (err.limitDate?.message as string) || '',
                        sx: { minWidth: 200 }
                      }
                    }}
                  />
                  <TextField
                    select
                    label="時"
                    value={limitParts.hour}
                    onChange={(e) =>
                      handleDateHourChange(
                        'limitDate',
                        limitParts.date,
                        Number(e.target.value)
                      )
                    }
                    sx={{ width: 120 }}
                  >
                    {HOURS.map((h) => (
                      <MenuItem key={h} value={h}>
                        {`${h.toString().padStart(2, '0')}時`}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="body2">
                    {approxDaysFromNowJstLabel(limitIso, '期限経過')}
                  </Typography>
                </Stack>
              </Stack>

              {/* 募集開始 */}
              <Stack spacing={1}>
                <Typography variant="subtitle2">
                  クエスト募集開始日時
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ sm: 'center' }}
                >
                  <DatePicker
                    label="日付"
                    value={toDayjs(startParts.date)}
                    format="YYYY年M月D日"
                    onChange={(v) => {
                      const dateStr =
                        v && v.isValid()
                          ? v.format('YYYY-MM-DD')
                          : startParts.date;
                      handleDateHourChange(
                        'openCallStartDate',
                        dateStr,
                        startParts.hour
                      );
                    }}
                    slotProps={{
                      ...commonPickerSlotProps,
                      textField: {
                        error: !!err.openCallStartDate,
                        helperText:
                          (err.openCallStartDate?.message as string) ||
                          '',
                        sx: { minWidth: 200 }
                      }
                    }}
                  />
                  <TextField
                    select
                    label="時"
                    value={startParts.hour}
                    onChange={(e) =>
                      handleDateHourChange(
                        'openCallStartDate',
                        startParts.date,
                        Number(e.target.value)
                      )
                    }
                    sx={{ width: 120 }}
                  >
                    {HOURS.map((h) => (
                      <MenuItem key={h} value={h}>
                        {`${h.toString().padStart(2, '0')}時`}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="body2">
                    {approxDaysFromNowJstLabel(startIso, '開始済み')}
                  </Typography>
                </Stack>
              </Stack>

              {/* 募集終了 */}
              <Stack spacing={1}>
                <Typography variant="subtitle2">
                  クエスト募集終了期限
                </Typography>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1}
                  alignItems={{ sm: 'center' }}
                >
                  <DatePicker
                    label="日付"
                    value={toDayjs(endParts.date)}
                    format="YYYY年M月D日"
                    onChange={(v) => {
                      const dateStr =
                        v && v.isValid()
                          ? v.format('YYYY-MM-DD')
                          : endParts.date;
                      handleDateHourChange(
                        'openCallEndDate',
                        dateStr,
                        endParts.hour
                      );
                    }}
                    slotProps={{
                      ...commonPickerSlotProps,
                      textField: {
                        error: !!err.openCallEndDate,
                        helperText:
                          (err.openCallEndDate?.message as string) ||
                          '',
                        sx: { minWidth: 200 }
                      }
                    }}
                  />
                  <TextField
                    select
                    label="時"
                    value={endParts.hour}
                    onChange={(e) =>
                      handleDateHourChange(
                        'openCallEndDate',
                        endParts.date,
                        Number(e.target.value)
                      )
                    }
                    sx={{ width: 120 }}
                  >
                    {HOURS.map((h) => (
                      <MenuItem key={h} value={h}>
                        {`${h.toString().padStart(2, '0')}時`}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Typography variant="body2">
                    {approxDaysFromNowJstLabel(endIso, '募集終了')}
                  </Typography>
                </Stack>

                {(isEndBeforeStart || isEndAfterLimit) && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    {isEndBeforeStart &&
                      'クエスト募集終了日時は募集開始日時よりも後に設定してください。'}
                    {isEndBeforeStart && isEndAfterLimit && <br />}
                    {isEndAfterLimit &&
                      'クエスト募集終了日時はクエスト終了期限以前に設定してください。'}
                  </Alert>
                )}
              </Stack>

              {/* パーティ必須 */}
              <FormControlLabel
                control={<Checkbox {...form.register('partyRequired')} />}
                label="パーティ必須"
              />

              {/* 報酬 */}
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ sm: 'center' }}
              >
                <TextField
                  label="報酬ポイント"
                  type="number"
                  fullWidth
                  {...form.register('rewordPoint', { valueAsNumber: true })}
                  error={!!err.rewordPoint}
                  helperText={(err.rewordPoint?.message as string) || ''}
                />
                <TextField
                  label="報酬アイテム（カンマ区切り）"
                  fullWidth
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    const arr = val
                      ? val.split(',').map((s) => s.trim())
                      : [];
                    form.setValue('rewordItems', arr, { shouldDirty: true });
                  }}
                />
              </Stack>

              {/* メディア（縦並びに変更） */}
              <Stack spacing={1}>
                <TextField
                  label="動画URL（カンマ区切り）"
                  fullWidth
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    const arr = val
                      ? val.split(',').map((s) => s.trim())
                      : [];
                    form.setValue('videos', arr, { shouldDirty: true });
                  }}
                />
                <TextField
                  label="画像URL（カンマ区切り）"
                  fullWidth
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    const arr = val
                      ? val.split(',').map((s) => s.trim())
                      : [];
                    form.setValue('photos', arr, { shouldDirty: true });
                  }}
                />
              </Stack>

              {/* 送信エラー */}
              {mut.isError && (
                <Alert severity="error">
                  {(mut.error as Error)?.message || '失敗しました。'}
                </Alert>
              )}
            </Stack>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={handleClose}
              variant="outlined"
              disabled={mut.isPending}
              startIcon={<CloseIcon />}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={mut.isPending}
              startIcon={<SaveIcon />}
            >
              {mode === 'create' ? '作成' : '更新'}
            </Button>
          </DialogActions>
        </form>
      </LocalizationProvider>
    </Dialog>
  );
};

export default QuestFormPage;
