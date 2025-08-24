import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { listQuests } from 'api/quest';
import { QuestListItem } from 'types/quest';
import { QuestStatusBadge } from 'components/quests/QuestStatusBadge';
import { QuestListFilters } from 'components/quests/QuestListFilters';

function usePaging() {
  const [sp, setSp] = useSearchParams();
  const from = Number(sp.get('from') || 0);
  const count = Number(sp.get('count') || 20);
  function set(next: { from?: number; count?: number }) {
    const n = new URLSearchParams(sp);
    if (next.from !== undefined) n.set('from', String(next.from));
    if (next.count !== undefined) n.set('count', String(next.count));
    setSp(n, { replace: true });
  }
  return { from, count, set };
}

export const QuestListPage: React.FC = () => {
  const { from, count, set } = usePaging();
  const [filter, setFilter] = React.useState({ q: '', status: '' });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['quests', from, count],
    queryFn: () => listQuests({ from, count }),
    staleTime: 30_000,
  });

  const items = React.useMemo(() => {
    const src = data?.items ?? [];
    return src.filter((x) => {
      const okQ = filter.q
        ? x.title.toLowerCase().includes(filter.q.toLowerCase())
        : true;
      const okS = filter.status ? x.status === filter.status : true;
      return okQ && okS;
    });
  }, [data, filter]);

  return (
    <section>
      <header style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Quests</h1>
        <div style={{ marginLeft: 'auto' }}>
          <Link to="/quest-board/quest/new">New Quest</Link>
        </div>
      </header>

      <QuestListFilters
        q={filter.q}
        status={filter.status}
        onChange={setFilter}
        className="quest-filters"
      />

      {isLoading && <p>Loading...</p>}
      {isError && (
        <p role="alert">{(error as Error)?.message || 'Failed to load.'}</p>
      )}

      {!isLoading && items.length === 0 && <p>No quests.</p>}

      <ul>
        {items.map((q: QuestListItem) => (
          <li key={q.id}>
            <Link to={`/quest-board/quests/${q.id}`}>{q.title}</Link>{' '}
            <QuestStatusBadge status={q.status} />{' '}
            <span>Rank: {q.rank}</span>{' '}
            <span>Limit: {new Date(q.limitDate).toLocaleString()}</span>
          </li>
        ))}
      </ul>

      <footer style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => set({ from: Math.max(0, from - count) })}
          disabled={from <= 0}
        >
          Prev
        </button>
        <button
          onClick={() => set({ from: from + count })}
          disabled={!!data && from + count >= data.total}
        >
          Next
        </button>
        <span>
          {data ? `${from + 1} - ${from + items.length} / ${data.total}` : ''}
        </span>
      </footer>
    </section>
  );
};
