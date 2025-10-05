import React, { useState } from 'react';
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
  Link,
  List,
  ListItem,
  Stack,
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addComment,
  deleteQuest,
  getQuest,
  listComments,
  listContractors,
  doneQuest,
  closeQuest,
  feedbackQuest,
  restartQuest,
} from 'api/quests';
import { QuestContractor, QuestListItem } from 'types/quests';
import { rankToAlpha } from 'utils/rank';
import { QuestStatusChip } from 'components/quests/QuestStatusChip';
import { useUser } from 'hooks/useUser';
import { Messenger, MessageItem } from 'components/messenger/Messenger';
import ApplicationUpsertDialog from 'components/quests/ApplicationUpsertDialog';
import contractorStatusToJapanese from 'utils/language/contractorStatusToJapanese';

export default function QuestDetailPage() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const { questId = '' } = useParams();
  const { user } = useUser();
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [applicationMode, setApplicationMode] = useState<'create' | 'edit'>('create');
  const [editTargetContractorId, setEditTargetContractorId] =
                                            useState<string | undefined>(undefined);

  const [tab, setTab] = React.useState(0);

  const loggedInUserId = user?.id;

  const { data: quest, isPending, isError, error } = useQuery({
    queryKey: ['quest', questId],
    queryFn: () => getQuest(questId),
    enabled: !!questId,
    staleTime: 30_000,
  });

  const del = useMutation({
    mutationFn: () => deleteQuest(questId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quests'] });
      nav('/quest-board/quest/list');
    },
  });

  const done = useMutation({
    mutationFn: () => doneQuest(questId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quest', questId] });
    },
  });

  const feedback = useMutation({
    mutationFn: () => feedbackQuest(questId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quest', questId] });
    },
  });

  const closeWithSuccess = useMutation({
    mutationFn: () => closeQuest(questId, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quest', questId] });
    },
  });

  const restart = useMutation({
    mutationFn: () => restartQuest(questId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quest', questId] });
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

  const doDelete = () => {
    if (confirm('このクエストを削除しますか？')) del.mutate();
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
        {(error as Error)?.message || '読み込みに失敗しました。'}
      </Alert>
    );
  }
  if (!quest) return <Alert severity="warning">見つかりませんでした。</Alert>;

  const isQuestOwner = quest.questOwnerId === loggedInUserId;
  const isWaitingContractor = [
                                'new_quest',
                                'open_call',
                                'take_quest_requested'
                              ].includes(quest.status);
  const assignedContractor = (() => {
    if (quest.assignedContractorId && quest.assignedContractor) {
      if (quest.assignedContractor.contractorUnitType === 'user' &&
                            quest.assignedContractor.userContractor) {
        return quest.assignedContractor.userContractor.loginId
      }
      if (quest.assignedContractor.contractorUnitType === 'party' &&
                            quest.assignedContractor.partyContractor) {
        return quest.assignedContractor.partyContractor?.partyName;
      }
    }
    return "(未定)";
  })();

  function ContractorItem(contractor: QuestContractor) {
    if (contractor.contractorUnitType === 'user') {
      return (
        <ListItem
          key={contractor.id}
          secondaryAction={<IconButton edge="end" />}
        >
          <Link
            onClick={() => setApplication(true, 'edit', contractor.id)}
          >{contractor.userContractor?.loginId || contractor.contractorUnitId}</Link>
          - {contractorStatusToJapanese(contractor.status)}
          - ユーザー
          - {contractor.userContractor?.rank ? rankToAlpha(contractor.userContractor.rank) : 'N/A'}
          ランク
        </ListItem>
      );
    }
    if (contractor.contractorUnitType === 'party') {
      return (
        <ListItem
          key={contractor.id}
          secondaryAction={<IconButton edge="end" />}
        >
          <Link
            onClick={() => setApplication(true, 'edit', contractor.id)}
          >{contractor.partyContractor?.partyName || contractor.contractorUnitId}</Link>
          - {contractorStatusToJapanese(contractor.status)}
          - パーティー
        </ListItem>
      );
    }
    return (
      <ListItem
        key={contractor.id}
        secondaryAction={<IconButton edge="end" />}
      >
        {contractor.contractorUnitType} - {contractor.contractorUnitId}
      </ListItem>
    );
  }

  function QuestEditButtons({quest}: {quest: QuestListItem}) {
    const isAssignedContractor = (quest.assignedContractor?.userContractor &&
                            quest.assignedContractor?.userContractor?.id === user?.id) ||
                      (quest.assignedContractor?.partyContractor &&
                              quest.assignedContractor?.partyContractor?.leaderId === user?.id);
    if (isQuestOwner) {
      if (['new_quest', 'open_call', 'take_quest_requested'].includes(quest.status)) {
        return (
          <CardActions>
            <Button
              variant="outlined"
              component={RouterLink}
              to={`/quest-board/quests/${quest.id}/edit`}
            >
              編集
            </Button>
            <Button color="error" variant="contained" onClick={doDelete}>
              削除
            </Button>
          </CardActions>
        );
      }
      if (['done'].includes(quest.status) && quest.assignedContractorId) {
        return (
          <CardActions>
            <Button
              variant="contained"
              onClick={() => closeWithSuccess.mutate()}
            >
              完了確認
            </Button>
            <Button
              variant="outlined"
              onClick={() => feedback.mutate()}
            >
              フィードバック
            </Button>
          </CardActions>
        );
      }

      if (quest.status === 'success') {
        return (
          <CardActions>
            <Button
              variant="contained"
              onClick={() => restart.mutate()}
            >
              完了取り消し
            </Button>
          </CardActions>
        );
      }
    } else if (isAssignedContractor) {
      if (['doing', 'feedback'].includes(quest.status)) {
        return (
          <CardActions>
            <Button
              variant="contained"
              onClick={() => done.mutate()}
            >
              完了報告
            </Button>
          </CardActions>
        );
      }
    }
    return null;
  }

  function setApplication(open: boolean, mode: 'create' | 'edit', contractorId?: string) {
    setApplicationMode(mode);
    setApplicationOpen(open);
    setEditTargetContractorId(contractorId);
  }

  function onCloseApplication() {
    setApplicationOpen(false);
    qc.invalidateQueries({ queryKey: ['quest', questId] });
  }

  return (
    <Box p={2}>
      <Stack direction="row" spacing={2} alignItems="center" mb={2}>
        <Typography variant="h5">{quest.title}</Typography>
        <QuestStatusChip status={quest.status} />
        <Box flex={1} />
      </Stack>

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            概要
          </Typography>
          <Stack spacing={1}>
          </Stack>
          <Stack spacing={1}>
            <Typography>{quest.description}</Typography>
            <Divider />
            <Typography>
              請負者: {assignedContractor}
            </Typography>
            <Typography>
              クエストオーナー: {quest.owner.loginId}
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Typography variant="body2">
                ランク: {rankToAlpha(quest.rank)}
              </Typography>
              <Typography variant="body2">
                パーティ必須: {quest.partyRequired ? 'はい' : 'いいえ'}
              </Typography>
              <Typography variant="body2">
                期限: {new Date(quest.limitDate).toLocaleString()}
              </Typography>
              <Typography variant="body2">
                報酬: {quest.rewordPoint} pt
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
        <QuestEditButtons
          quest={quest}
        />
      </Card>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="コメント" />
        <Tab label="応募" />
      </Tabs>

      {tab === 0 && (
        <Card
          variant="outlined"
          sx={{
            height: 'calc(80vh - 200px)',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <CardContent
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              p: 2,
              overflow: 'hidden'
            }}
          >
            <Messenger
              messages={comments?.items as MessageItem[] || []}
              currentUserId={loggedInUserId}
              entityId={questId}
              addMessageMutation={addComment}
              queryKey={['quest', questId, 'comments']}
              importantUserId={quest.questOwnerId}
            />
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              応募一覧
            </Typography>
            {!isQuestOwner && isWaitingContractor && (
              <Button
                variant="outlined"
                onClick={() => setApplication(true, 'create')}
              >
                応募
              </Button>
            )}
            <List dense>
              {(contractors?.items ?? []).map(ContractorItem)}
            </List>
          </CardContent>
          <CardActions />
        </Card>
      )}
      <ApplicationUpsertDialog
        open={applicationOpen}
        mode={applicationMode}
        questId={questId}
        contractorId={editTargetContractorId}
        isQuestOwner={isQuestOwner}
        isWaitingContractor={isWaitingContractor}
        onClose={() => onCloseApplication()}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['quest', questId, 'contractors'] });
          setTab(1);
        }}
      />
    </Box>
  );
}
