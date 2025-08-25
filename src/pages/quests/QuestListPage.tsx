import React from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Alert,
  CircularProgress,
  ButtonGroup,
} from '@mui/material';
import { listQuests } from 'api/quests';
import { QuestListItem } from 'types/quests';
import { QuestStatusChip } from 'components/quests/QuestStatusChip';

function usePaging() {
  const [sp, setSp] = useSearchParams();
  const from = Number(sp.get('from') || 0);
  const count = Number(sp.get('count') || 20);
  const set = (next: { from?: number; count?: number }) => {
    const n = new URLSearchParams(sp);
    if (next.from !== undefined) n.set('from', String(next.from));
    if (next.count !== undefined) n.set('count', String(next.count));
    setSp(n, { replace: true });
  };
  return { from, count, set };
}

export const QuestListPage: React.FC = () => {
  const { from, count, set } = usePaging();
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('');

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['quests', from, count],
    queryFn: () => listQuests({ from, count }),
    staleTime: 30_000,
  });

  const items = React.useMemo(() => {
    const src = data?.items ?? [];
    return src.filter((x) => {
      const okQ = q ? x.title.toLowerCase().includes(q.toLowerCase()) : true;
      const okS = status ? x.status === status : true;
      return okQ && okS;
    });
  }, [data, q, status]);

  return (
    <Box p={2}>
      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography variant="h5">Quests</Typography>
        <Box flex={1} />
        <Button
          variant="contained"
          component={RouterLink}
          to="/quest-board/quests/new"
        >
          New Quest
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
        <TextField
          label="Search title"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="quest-status-label">Status</InputLabel>
          <Select
            labelId="quest-status-label"
            value={status}
            label="Status"
            onChange={(e) => setStatus(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="new_quest">New</MenuItem>
            <MenuItem value="open">Open</MenuItem>
            <MenuItem value="in_progress">In progress</MenuItem>
            <MenuItem value="closed">Closed</MenuItem>
            <MenuItem value="done">Done</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {isPending && (
        <Stack alignItems="center" py={4}>
          <CircularProgress />
        </Stack>
      )}
      {isError && (
        <Alert severity="error">
          {(error as Error)?.message || 'Failed to load.'}
        </Alert>
      )}

      {!isPending && (items?.length ?? 0) === 0 && (
        <Alert severity="info">No quests.</Alert>
      )}

      {!!items?.length && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Rank</TableCell>
                <TableCell>Limit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((q: QuestListItem) => (
                <TableRow key={q.id} hover>
                  <TableCell>
                    <Button
                      component={RouterLink}
                      to={`/quest-board/quests/${q.id}`}
                    >
                      {q.title}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <QuestStatusChip status={q.status} />
                  </TableCell>
                  <TableCell align="right">{q.rank}</TableCell>
                  <TableCell>
                    {new Date(q.limitDate).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Stack direction="row" alignItems="center" spacing={2} mt={2}>
        <ButtonGroup>
          <Button
            onClick={() => set({ from: Math.max(0, from - count) })}
            disabled={from <= 0}
          >
            Prev
          </Button>
          <Button
            onClick={() => set({ from: from + count })}
            disabled={!!data && from + count >= data.total}
          >
            Next
          </Button>
        </ButtonGroup>
        <Typography variant="body2" color="text.secondary">
          {data ? `${from + 1} - ${from + (items?.length ?? 0)} / ${data.total}`
            : ''}
        </Typography>
      </Stack>
    </Box>
  );
};
