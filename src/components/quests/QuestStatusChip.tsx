import React from 'react';
import { Chip } from '@mui/material';

type Props = {
  status: string;
  size?: 'small' | 'medium';
};

function toColor(status: string):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' {
  switch (status) {
    case 'new_quest':
      return 'info';
    case 'open':
      return 'primary';
    case 'in_progress':
      return 'warning';
    case 'closed':
      return 'secondary';
    case 'done':
      return 'success';
    default:
      return 'default';
  }
}

export const QuestStatusChip: React.FC<Props> = ({
  status,
  size = 'small',
}) => {
  const label = status.replaceAll('_', ' ');
  return <Chip size={size} color={toColor(status)} label={label} />;
};
