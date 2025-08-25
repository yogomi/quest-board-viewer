import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
  Alert,
  MenuItem
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import Autocomplete from '@mui/material/Autocomplete';
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

type Mode = 'create' | 'edit';
type QuestFormValues = z.input<typeof upsertQuestInput>;

const rankOptions = [
  { label: 'S', value: 100 },
  { label: 'A', value: 15 },
  { label: 'B', value: 14 },
  { label: 'C', value: 13 },
  { label: 'D', value: 12 },
  { label: 'E', value: 11 },
  { label: 'F', value: 10 }
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);

// DatePicker 用のほぼ不透明背景と枠（透過抑止＋枠表示）
const PICKER_BG = 'rgba(5, 10, 20, 0.98)';
const PICKER_BORDER = '1px solid rgba(0, 255, 255, 0.4)';

export const QuestFormPage: React.FC = () => {
  const { questId } = useParams();
  const isValidUuid =
    !!questId && z.uuid().safeParse(questId).success;
  const mode: Mode = isValidUuid ? 'edit' : 'create';
  const nav = useNavigate();

  const { user } = useUserContext() as any;
  const roles: string[] = user?.roles || [];
  const role: string | undefined = user?.role;
  const isPrivileged =
    roles.includes('system_admin') ||
    roles.includes('guild_staff') ||
    role === 'system_admin' ||
    role === 'guild_staff';

  const nowIso = React.useMemo(() => nowFloorHourJstIso(), []);
  const weekLaterIso = React.useMemo(
    () => addDaysJstIso(nowIso, 7),
    [nowIso]
  );

  const form = useForm<QuestFormValues>({
    resolver: zodResolver(upsertQuestInput),
    defaultValues: {
      questOwnerId: '',
      title: '',
      rank: 11,
      description: '',
      partyRequired: false,
      limitDate: weekLaterIso,
      openCallStartDate: nowIso,
      openCallEndDate: weekLaterIso,
      rewordPoint: 0,
      rewordItems: [],
      videos: [],
      photos: []
    }
  });

  const usersQ = useQuery({
    queryKey: ['users', 'for-owner-select'],
    queryFn: async () => {
      const res = await listUsers({ pageSize: 1000 });
      return res || [];
    },
    enabled: isPrivileged,
    staleTime: 60 * 1000
  });

  React.useEffect(() => {
    if (isValidUuid && questId) {
      getQuest(questId).then((q) => {
        form.reset({
          questOwnerId: q.questOwnerId,
          title: q.title,
          rank: q.rank,
          description: q.description ?? '',
          partyRequired: q.partyRequired,
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
        rank: 11,
        description: '',
        partyRequired: false,
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

  React.useEffect(() => {
    if (!isPrivileged && user?.id) {
      form.setValue('questOwnerId', user.id, { shouldDirty: true });
    }
  }, [form, isPrivileged, user?.id]);

  const mut = useMutation({
    mutationFn: async (v: UpsertQuestInputIn) => {
      if (mode === 'create') return createQuest(v);
      return updateQuest(questId!, v);
    },
    onSuccess: (q) => {
      nav(`/quest-board/quests/${q.id}`);
    }
  });

  const err = form.formState.errors;
  const ownerId = form.watch('questOwnerId');
  const userOptions: any[] = (usersQ.data as any[]) ?? [];
  const selectedOwner = userOptions.find((u) => u.id === ownerId) ?? null;

  const limitIso = form.watch('limitDate') ?? weekLaterIso;
  const startIso = form.watch('openCallStartDate') ?? nowIso;
  const endIso = form.watch('openCallEndDate') ?? weekLaterIso;

  const limitParts = jstPartsFromIso(limitIso);
  const startParts = jstPartsFromIso(startIso);
  const endParts = jstPartsFromIso(endIso);

  const handleDateHourChange = (
    field: 'limitDate' | 'openCallStartDate' | 'openCallEndDate',
    dateStr: string,
    hour: number
  ) => {
    const nextIso = isoFromJstParts(dateStr, hour);
    form.setValue(field, nextIso, { shouldDirty: true });
  };

  const toDayjs = (dateStr: string): Dayjs => dayjs(dateStr, 'YYYY-MM-DD');

  // DatePicker の透過抑止＋枠付け（デスクトップ/モバイル）
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

  // 論理チェック（警告条件）
  const isEndBeforeStart = dayjs(endIso).isBefore(dayjs(startIso));
  const isEndAfterLimit = dayjs(endIso).isAfter(dayjs(limitIso));

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>
        {mode === 'create' ? 'クエストを新規作成' : 'クエストを編集'}
      </Typography>

      <LocalizationProvider
        dateAdapter={AdapterDayjs}
        adapterLocale="ja"
        localeText={
          jaJP.components.MuiLocalizationProvider.defaultProps.localeText
        }
      >
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))}>
          <Grid2 container spacing={2}>
            <Grid2 size={{ xs: 12, md: 6 }}>
              {isPrivileged ? (
                <Autocomplete
                  options={userOptions}
                  loading={usersQ.isPending}
                  value={selectedOwner}
                  getOptionLabel={(o) =>
                    (o ? `${o.name ?? '(名称未設定)'}` : '')
                  }
                  onChange={(_, v) => {
                    form.setValue('questOwnerId', v?.id ?? '', {
                      shouldDirty: true
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="依頼主（管理者／スタッフのみ変更可）"
                      placeholder="ユーザーを選択"
                      error={!!err.questOwnerId}
                      helperText={
                        (err.questOwnerId?.message as string) || ''
                      }
                      fullWidth
                    />
                  )}
                />
              ) : (
                <TextField
                  label="依頼主"
                  placeholder="ログインユーザー"
                  fullWidth
                  value={user?.name ?? ''}
                  InputProps={{ readOnly: true }}
                  helperText="一般ユーザーは変更できません"
                />
              )}
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6 }}>
              <TextField
                label="タイトル"
                fullWidth
                {...form.register('title')}
                error={!!err.title}
                helperText={(err.title?.message as string) || ''}
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 3 }}>
              <TextField
                select
                label="ランク"
                fullWidth
                value={form.watch('rank') ?? 11}
                onChange={(e) =>
                  form.setValue('rank', Number(e.target.value), {
                    shouldDirty: true
                  })
                }
                error={!!err.rank}
                helperText={(err.rank?.message as string) || ''}
              >
                {rankOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid2>

            <Grid2 size={{ xs: 12, md: 9 }}>
              <TextField
                label="説明"
                fullWidth
                multiline
                minRows={3}
                {...form.register('description')}
                error={!!err.description}
                helperText={
                  (err.description?.message as string) || ''
                }
              />
            </Grid2>

            {/* クエスト終了期限（カレンダー + 時） */}
            <Grid2 size={{ xs: 12, md: 6 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <DatePicker
                  label="クエスト終了期限"
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
            </Grid2>

            {/* クエスト募集開始日時（カレンダー + 時） */}
            <Grid2 size={{ xs: 12, md: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <DatePicker
                  label="クエスト募集開始日時"
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
            </Grid2>

            {/* クエスト募集終了期限（カレンダー + 時） */}
            <Grid2 size={{ xs: 12, md: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <DatePicker
                  label="クエスト募集終了期限"
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
                        (err.openCallEndDate?.message as string) || '',
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
                    'クエスト募集終了日時は募集開始日時よりも' +
                      '後に設定してください。'}
                  {isEndBeforeStart && isEndAfterLimit && <br />}
                  {isEndAfterLimit &&
                    'クエスト募集終了日時はクエスト終了期限以前に' +
                      '設定してください。'}
                </Alert>
              )}
            </Grid2>

            <Grid2 size={{ xs: 12 }}>
              <FormControlLabel
                control={<Checkbox {...form.register('partyRequired')} />}
                label="パーティ必須"
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 4 }}>
              <TextField
                label="報酬ポイント"
                type="number"
                fullWidth
                {...form.register('rewordPoint', { valueAsNumber: true })}
                error={!!err.rewordPoint}
                helperText={
                  (err.rewordPoint?.message as string) || ''
                }
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 8 }}>
              <TextField
                label="報酬アイテム（カンマ区切り）"
                fullWidth
                onChange={(e) => {
                  const val = e.target.value.trim();
                  const arr = val
                    ? val.split(',').map((s) => s.trim())
                    : [];
                  form.setValue('rewordItems', arr, {
                    shouldDirty: true
                  });
                }}
              />
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6 }}>
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
            </Grid2>

            <Grid2 size={{ xs: 12, md: 6 }}>
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
            </Grid2>
          </Grid2>

          <Stack direction="row" spacing={1} mt={3}>
            <Button type="submit" variant="contained" disabled={mut.isPending}>
              {mode === 'create' ? '作成' : '更新'}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => nav(-1)}
              disabled={mut.isPending}
            >
              キャンセル
            </Button>
          </Stack>

          {mut.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(mut.error as Error)?.message || '失敗しました。'}
            </Alert>
          )}
        </form>
      </LocalizationProvider>
    </Box>
  );
};

export default QuestFormPage;
