import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addComment,
  deleteQuestApi,
  getQuest,
  listComments,
  listContractors,
  rejectContractor,
} from 'api/quests';
import { rankToAlpha } from 'utils/questRank';
import { QuestStatusChip } from 'components/quests/QuestStatusChip';

export default function QuestDetailPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { questId = '' } = useParams();

  const [tab, setTab] = React.useState(0);
  const [newComment, setNewComment] = React.useState('');

  const { data: quest, isPending, isError, error } = useQuery({
    queryKey: ['quest', questId],
    queryFn: () => getQuest(questId),
    enabled: !!questId,
    staleTime: 30_000,
  });

  const del = useMutation({
    mutationFn: () => deleteQuestApi(questId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quests'] });
      nav('/quest-board/quest/list');
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

  const add = useMutation({
    mutationFn: () => addComment(questId, {
      commentOwnerId: quest?.questOwnerId || '',
      comment: newComment.trim(),
    }),
    onSuccess: () => {
      setNewComment('');
      qc.invalidateQueries({ queryKey: ['quest', questId, 'comments'] });
    },
  });

  const doDelete = () => {
    if (confirm('Delete this quest?')) del.mutate();
  };

  if (isPending) {
    return (
      <Stack alignItems="center" py={4}>
        <CircularProgress />
      </Stack>
    );
  }
  if (isError) {
    return (
      <Alert severity="error">
        {(error as Error)?.message || 'Failed to load.'}
      </Alert>
    );
  }
  if (!quest) return <Alert severity="warning">Not found.</Alert>;

  return (
    <Box p={2}>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Typography variant="h5">{quest.title}</Typography>
        <QuestStatusChip status={quest.status} />
        <Box flex={1} />
        <Button
          variant="outlined"
          component={RouterLink}
          to={`/quest-board/quests/${quest.id}/edit`}
        >
          Edit
        </Button>
        <Button color="error" variant="contained" onClick={doDelete}>
          Delete
        </Button>
      </Stack>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Overview
          </Typography>
          <Stack spacing={1}>
            <Typography>{quest.description}</Typography>
            <Divider />
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Typography variant="body2">
                Rank: {rankToAlpha(quest.rank)}
              </Typography>
              <Typography variant="body2">
                Party required: {quest.partyRequired ? 'Yes' : 'No'}
              </Typography>
              <Typography variant="body2">
                Limit: {new Date(quest.limitDate).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                Reward: {quest.rewordPoint} pt
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
        <CardActions />
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Comments" />
        <Tab label="Contractors" />
      </Tabs>

      {tab === 0 && (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Add a comment"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  size="small"
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={() => {
                    if (!newComment.trim()) return;
                    add.mutate();
                  }}
                >
                  Post
                </Button>
              </Stack>
              <List dense>
                {(comments?.items ?? []).map((c) => (
                  <ListItem
                    key={c.id}
                    secondaryAction={<IconButton edge="end" />}
                  >
                    {c.comment}
                  </ListItem>
                ))}
              </List>
            </Stack>
          </CardContent>
          <CardActions />
        </Card>
      )}

      {tab === 1 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              Contractors
            </Typography>
            <List dense>
              {(contractors?.items ?? []).map((x) => (
                <ListItem
                  key={x.id}
                  secondaryAction={<IconButton edge="end" />}
                >
                  {x.contractorUnitType} - {x.contractorUnitId}
                </ListItem>
              ))}
            </List>
          </CardContent>
          <CardActions />
        </Card>
      )}
    </Box>
  );
}
