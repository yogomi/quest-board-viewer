import React from 'react';
import {
  Link as RouterLink,
  useNavigate,
  useParams,
} from 'react-router-dom';
import {
  Box,
  Stack,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
} from 'api/quests';
import { Quest } from 'types/quests';
import { QuestStatusChip } from 'components/quests/QuestStatusChip';

export const QuestDetailPage: React.FC = () => {
  const { questId = '' } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
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
        <Button
          color="error"
          variant="contained"
          onClick={() => {
            if (confirm('Delete this quest?')) del.mutate();
          }}
        >
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
              <Typography variant="body2">Rank: {quest.rank}</Typography>
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
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={() => removeComment.mutate(c.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <ListItemText
                      primary={c.comment}
                      secondary={new Date(c.createdAt).toLocaleString()}
                    />
                  </ListItem>
                ))}
              </List>
            </Stack>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card variant="outlined">
          <CardContent>
            <List dense>
              {(contractors?.items ?? []).map((x) => (
                <ListItem
                  key={x.id}
                  secondaryAction={
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => accept.mutate(x.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() => reject.mutate(x.id)}
                      >
                        Reject
                      </Button>
                    </Stack>
                  }
                >
                  <ListItemText
                    primary={`${x.contractorUnitType} - ${x.contractorUnitId}`}
                    secondary={`status: ${x.status}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
          <CardActions />
        </Card>
      )}
    </Box>
  );
};
