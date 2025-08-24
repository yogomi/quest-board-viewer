import React from 'react';
import { QuestStatus } from 'types/quest';

type Props = {
  status: QuestStatus | string;
  className?: string;
};

export const QuestStatusBadge: React.FC<Props> = ({
  status,
  className,
}) => {
  const text = status.replaceAll('_', ' ');
  return (
    <span className={className} aria-label={`status: ${text}`}>
      {text}
    </span>
  );
};
