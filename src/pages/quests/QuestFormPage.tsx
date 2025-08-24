import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  upsertQuestInput,
  createQuest,
  updateQuest,
  getQuest,
  UpsertQuestInputIn,
} from 'api/quest';

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
  }, [mode, questId]);

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

  return (
    <section>
      <h1>{mode === 'create' ? 'New Quest' : 'Edit Quest'}</h1>
      <form
        onSubmit={form.handleSubmit((v) => mut.mutate(v))}
        style={{ display: 'grid', gap: 12 }}
      >
        <label>
          Owner ID
          <input
            {...form.register('questOwnerId')}
            placeholder="UUID"
            required
          />
        </label>
        <label>
          Title
          <input {...form.register('title')} required />
        </label>
        <label>
          Rank
          <input
            type="number"
            {...form.register('rank', { valueAsNumber: true })}
            min={0}
            max={16}
          />
        </label>
        <label>
          Description
          <textarea {...form.register('description')} />
        </label>
        <label>
          Party required
          <input type="checkbox" {...form.register('partyRequired')} />
        </label>
        <label>
          Limit date (ISO)
          <input {...form.register('limitDate')} />
        </label>
        <label>
          Open call start (ISO)
          <input {...form.register('openCallStartDate')} />
        </label>
        <label>
          Open call end (ISO)
          <input {...form.register('openCallEndDate')} />
        </label>
        <label>
          Reward points
          <input
            type="number"
            {...form.register('rewordPoint', { valueAsNumber: true })}
            min={0}
          />
        </label>
        <label>
          Reward items (comma separated)
          <input
            onChange={(e) => {
              const val = e.target.value.trim();
              const arr = val ? val.split(',').map((s) => s.trim()) : [];
              form.setValue('rewordItems', arr, { shouldDirty: true });
            }}
          />
        </label>
        <label>
          Videos (comma separated URLs)
          <input
            onChange={(e) => {
              const val = e.target.value.trim();
              const arr = val ? val.split(',').map((s) => s.trim()) : [];
              form.setValue('videos', arr, { shouldDirty: true });
            }}
          />
        </label>
        <label>
          Photos (comma separated URLs)
          <input
            onChange={(e) => {
              const val = e.target.value.trim();
              const arr = val ? val.split(',').map((s) => s.trim()) : [];
              form.setValue('photos', arr, { shouldDirty: true });
            }}
          />
        </label>

        <footer style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={mut.isPending}>
            {mode === 'create' ? 'Create' : 'Update'}
          </button>
          <button
            type="button"
            onClick={() => nav(-1)}
            disabled={mut.isPending}
          >
            Cancel
          </button>
        </footer>

        {mut.isError && (
          <p role="alert">{(mut.error as Error)?.message || 'Failed.'}</p>
        )}
      </form>
    </section>
  );
};
