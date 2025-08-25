import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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
} from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import {
  upsertQuestInput,
  createQuest,
  updateQuest,
  getQuest,
  UpsertQuestInputIn,
} from 'api/quests';

type Mode = 'create' | 'edit';
type QuestFormValues = z.input<typeof upsertQuestInput>;

export const QuestFormPage: React.FC = () => {
  const { questId } = useParams();
  const mode: Mode = questId ? 'edit' : 'create';
  const nav = useNavigate();

  const form = useForm<QuestFormValues>({
    resolver: zodResolver(upsertQuestInput),
    defaultValues: {
      questOwnerId: '',
      title: '',
      rank: 1,
      description: '',
      partyRequired: false,
      limitDate: new Date().toISOString(),
      openCallStartDate: null,
      openCallEndDate: null,
      rewordPoint: 0,
      rewordItems: [],
      videos: [],
      photos: [],
    },
  });

  React.useEffect(() => {
    if (mode === 'edit' && questId) {
      getQuest(questId).then((q) => {
        form.reset({
          questOwnerId: q.questOwnerId,
          title: q.title,
          rank: q.rank,
          description: q.description ?? '',
          partyRequired: q.partyRequired,
          limitDate: q.limitDate,
          openCallStartDate: q.openCallStartDate ?? null,
          openCallEndDate: q.openCallEndDate ?? null,
          rewordPoint: q.rewordPoint,
          rewordItems: q.rewordItems,
          videos: q.videos,
          photos: q.photos,
        });
      });
    }
  }, [mode, questId]); // eslint-disable-line react-hooks/exhaustive-deps

  const mut = useMutation({
    mutationFn: async (v: UpsertQuestInputIn) => {
      if (mode === 'create') {
        return createQuest(v);
      } else {
        return updateQuest(questId!, v);
      }
    },
    onSuccess: (q) => {
      nav(`/quest-board/quests/${q.id}`);
    },
  });

  const err = form.formState.errors;

  return (
    <Box p={2}>
      <Typography variant="h5" mb={2}>
        {mode === 'create' ? 'New Quest' : 'Edit Quest'}
      </Typography>

      <form onSubmit={form.handleSubmit((v) => mut.mutate(v))}>
        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              label="Owner ID"
              placeholder="UUID"
              fullWidth
              {...form.register('questOwnerId')}
              error={!!err.questOwnerId}
              helperText={(err.questOwnerId?.message as string) || ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              label="Title"
              fullWidth
              {...form.register('title')}
              error={!!err.title}
              helperText={(err.title?.message as string) || ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 3 }}>
            <TextField
              label="Rank"
              type="number"
              fullWidth
              {...form.register('rank', { valueAsNumber: true })}
              error={!!err.rank}
              helperText={(err.rank?.message as string) || ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 9 }}>
            <TextField
              label="Description"
              fullWidth
              multiline
              minRows={3}
              {...form.register('description')}
              error={!!err.description}
              helperText={(err.description?.message as string) || ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              label="Limit date (ISO)"
              fullWidth
              {...form.register('limitDate')}
              error={!!err.limitDate}
              helperText={(err.limitDate?.message as string) || ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 3 }}>
            <TextField
              label="Open call start (ISO)"
              fullWidth
              {...form.register('openCallStartDate')}
              error={!!err.openCallStartDate}
              helperText={(err.openCallStartDate?.message as string) || ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 3 }}>
            <TextField
              label="Open call end (ISO)"
              fullWidth
              {...form.register('openCallEndDate')}
              error={!!err.openCallEndDate}
              helperText={(err.openCallEndDate?.message as string) || ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 12 }}>
            <FormControlLabel
              control={<Checkbox {...form.register('partyRequired')} />}
              label="Party required"
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <TextField
              label="Reward points"
              type="number"
              fullWidth
              {...form.register('rewordPoint', { valueAsNumber: true })}
              error={!!err.rewordPoint}
              helperText={(err.rewordPoint?.message as string) || ''}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 8 }}>
            <TextField
              label="Reward items (comma separated)"
              fullWidth
              onChange={(e) => {
                const val = e.target.value.trim();
                const arr = val ? val.split(',').map((s) => s.trim()) : [];
                form.setValue('rewordItems', arr, { shouldDirty: true });
              }}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              label="Videos (comma separated URLs)"
              fullWidth
              onChange={(e) => {
                const val = e.target.value.trim();
                const arr = val ? val.split(',').map((s) => s.trim()) : [];
                form.setValue('videos', arr, { shouldDirty: true });
              }}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <TextField
              label="Photos (comma separated URLs)"
              fullWidth
              onChange={(e) => {
                const val = e.target.value.trim();
                const arr = val ? val.split(',').map((s) => s.trim()) : [];
                form.setValue('photos', arr, { shouldDirty: true });
              }}
            />
          </Grid2>
        </Grid2>

        <Stack direction="row" spacing={1} mt={3}>
          <Button type="submit" variant="contained" disabled={mut.isPending}>
            {mode === 'create' ? 'Create' : 'Update'}
          </Button>
          <Button
            type="button"
            variant="outlined"
            onClick={() => nav(-1)}
            disabled={mut.isPending}
          >
            Cancel
          </Button>
        </Stack>

        {mut.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {(mut.error as Error)?.message || 'Failed.'}
          </Alert>
        )}
      </form>
    </Box>
  );
};
