import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getQuest,
  deleteQuestApi,
  listComments,
  addComment,
  deleteCommentApi,
  listContractors,
  acceptContractor,
  rejectContractor,
} from 'api/quest';
import { Quest } from 'types/quest';
import { QuestStatusBadge } from 'components/quests/QuestStatusBadge';

export const QuestDetailPage: React.FC = () => {
  const { questId = '' } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: quest, isLoading, isError, error } = useQuery({
    queryKey: ['quest', questId],
    queryFn: () => getQuest(questId),
    enabled: !!questId,
    staleTime: 30_000,
  });

  const del = useMutation({
    mutationFn: () => deleteQuestApi(questId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quests'] });
      nav('/quest-board/quests');
    },
  });

  const { data: comments } = useQuery({
    queryKey: ['quest', questId, 'comments'],
    queryFn: () => listComments(questId, 0, 50),
    enabled: !!questId,
  });

  const { data: contractors } = useQuery({
    queryKey: ['quest', questId, 'contractors'],
    queryFn: () => listContractors(questId, 0, 50),
    enabled: !!questId,
  });

  const [newComment, setNewComment] = React.useState('');

  const add = useMutation({
    mutationFn: () =>
      addComment(questId, {
        commentOwnerId: quest?.questOwnerId || '',
        comment: newComment,
      }),
    onSuccess: () => {
      setNewComment('');
      qc.invalidateQueries({ queryKey: ['quest', questId, 'comments'] });
    },
  });

  const removeComment = useMutation({
    mutationFn: (commentId: string) => deleteCommentApi(questId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quest', questId, 'comments'] });
    },
  });

  const accept = useMutation({
    mutationFn: (cid: string) => acceptContractor(questId, cid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quest', questId, 'contractors'] });
    },
  });

  const reject = useMutation({
    mutationFn: (cid: string) => rejectContractor(questId, cid),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quest', questId, 'contractors'] });
    },
  });

  if (isLoading) return <p>Loading...</p>;
  if (isError) {
    return <p role="alert">{(error as Error)?.message || 'Failed.'}</p>;
  }
  if (!quest) return <p>Not found.</p>;

  return (
    <section>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>{quest.title}</h1>
        <QuestStatusBadge status={quest.status} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Link to={`/quest-board/quests/${quest.id}/edit`}>Edit</Link>
          <button
            onClick={() => {
              if (confirm('Delete this quest?')) del.mutate();
            }}
          >
            Delete
          </button>
        </div>
      </header>

      <article>
        <p>{quest.description}</p>
        <dl>
          <dt>Rank</dt>
          <dd>{quest.rank}</dd>
          <dt>Party required</dt>
          <dd>{quest.partyRequired ? 'Yes' : 'No'}</dd>
          <dt>Limit</dt>
          <dd>{new Date(quest.limitDate).toLocaleString()}</dd>
          <dt>Reward</dt>
          <dd>{quest.rewordPoint} pt</dd>
        </dl>
      </article>

      <hr />

      <section>
        <h2>Comments</h2>
        <ul>
          {(comments?.items ?? []).map((c) => (
            <li key={c.id}>
              <span>{c.comment}</span>{' '}
              <button onClick={() => removeComment.mutate(c.id)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div>
          <input
            placeholder="Add a comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            onClick={() => {
              if (!newComment.trim()) return;
              add.mutate();
            }}
          >
            Post
          </button>
        </div>
      </section>

      <hr />

      <section>
        <h2>Contractors</h2>
        <ul>
          {(contractors?.items ?? []).map((x) => (
            <li key={x.id}>
              <span>{x.contractorUnitType}</span>{' '}
              <span>{x.contractorUnitId}</span>{' '}
              <strong>{x.status}</strong>{' '}
              <button onClick={() => accept.mutate(x.id)}>Accept</button>
              <button onClick={() => reject.mutate(x.id)}>Reject</button>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
};
