import React from 'react';

type Props = {
  q: string;
  status: string;
  onChange: (next: { q: string; status: string }) => void;
  className?: string;
};

export const QuestListFilters: React.FC<Props> = ({
  q,
  status,
  onChange,
  className,
}) => {
  return (
    <div className={className}>
      <input
        aria-label="search"
        placeholder="Search title"
        value={q}
        onChange={(e) => onChange({ q: e.target.value, status })}
      />
      <select
        aria-label="status"
        value={status}
        onChange={(e) => onChange({ q, status: e.target.value })}
      >
        <option value="">All</option>
        <option value="new_quest">New</option>
        <option value="open">Open</option>
        <option value="in_progress">In progress</option>
        <option value="closed">Closed</option>
        <option value="done">Done</option>
      </select>
    </div>
  );
};
