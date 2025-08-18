import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useUser } from 'hooks/useUser';
import PartyEditDialog, { PartyEditableFields } from 'components/parties/PartyEditDialog';

type UserInfo = {
  id: string;
  loginId: string;
};

type PartyDetailData = {
  id: string;
  partyName: string;
  leaderId: string;
  maxNumberOfMembers: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
  leader: UserInfo;
  members: UserInfo[];
  pendingMembers: UserInfo[];
};

export default function PartyDetail() {
  const { id: partyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [party, setParty] = useState<PartyDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();
  const userId = user?.id;

  // 編集ダイアログ状態
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (partyId) {
      fetch(`/quest-board/api/v1/parties/${partyId}`)
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setParty(json.data);
          } else {
            setError(json.message || '取得に失敗しました。');
          }
        })
        .catch(() => setError('取得に失敗しました。'));
    }
  }, [partyId]);

  const isLeader = party?.leaderId === userId;
  const isMember = !!party?.members.some(m => m.id === userId);
  const isPending = !!party?.pendingMembers.some(m => m.id === userId);

  const reloadParty = () => {
    if (!partyId) return;
    fetch(`/quest-board/api/v1/parties/${partyId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setParty(json.data);
        }
      });
  };

  const handleJoinRequest = () => {
    if (!partyId) return;
    fetch(`/quest-board/api/v1/parties/${partyId}/join-request`, { method: 'PUT' })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          reloadParty();
        } else {
          alert(json.message || '参加申請の送信に失敗しました。');
        }
      })
      .catch(() => alert('参加申請の送信に失敗しました。'));
  };

  const handleApprove = (targetUserId: string) => {
    if (!partyId) return;
    fetch(`/quest-board/api/v1/parties/${partyId}/join-request/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: targetUserId }),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          reloadParty();
        } else {
          alert(json.message || '許可に失敗しました。');
        }
      })
      .catch(() => alert('許可に失敗しました。'));
  };

  const handleReject = (targetUserId: string) => {
    if (!partyId) return;
    fetch(`/quest-board/api/v1/parties/${partyId}/join-request/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: targetUserId }),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          reloadParty();
        } else {
          alert(json.message || '却下に失敗しました。');
        }
      })
      .catch(() => alert('却下に失敗しました。'));
  };

  // 統合 API を利用した離脱（自分自身） / 除名（リーダーによる他メンバー）
  const callRemoveMemberApi = (targetUserId: string) => {
    if (!partyId) return;
    fetch(`/quest-board/api/v1/parties/${partyId}/members/${targetUserId}`, {
      method: 'DELETE',
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          if (targetUserId === userId && !isLeader) {
            alert('パーティーを離脱しました。');
            navigate('/quest-board/party/list');
          } else {
            // メンバー除名後はローカル state を更新
            setParty(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                members: prev.members.filter(m => m.id !== targetUserId),
                updatedAt: new Date().toISOString(),
              };
            });
          }
        } else {
          alert(`[${json.code}] ${json.message || '操作に失敗しました。'}`);
        }
      })
      .catch(() => alert('通信エラーが発生しました。'));
  };

  const handleLeaveParty = () => {
    if (!userId) return;
    if (!confirm('パーティーを離脱します。よろしいですか？')) return;
    callRemoveMemberApi(userId);
  };

  const handleKickMember = (targetUserId: string) => {
    if (!confirm('対象メンバーを除名します。よろしいですか？')) return;
    callRemoveMemberApi(targetUserId);
  };

  const handleDisband = () => {
    if (!partyId) return;
    if (!confirm('本当にこのパーティーを解散しますか？')) return;
    fetch(`/quest-board/api/v1/parties/${partyId}`, {
      method: 'DELETE',
    }).then(() => {
      alert('パーティーを解散しました。');
      navigate('/quest-board/party/list');
    });
  };

  const openEdit = () => {
    if (!party) return;
    setEditOpen(true);
  };

  const editableSnapshot = (): PartyEditableFields | null => {
    if (!party) return null;
    return {
      partyName: party.partyName,
      description: party.description ?? '',
      maxNumberOfMembers: party.maxNumberOfMembers,
    };
  };

  const handleUpdated = (updated: any) => {
    // updateParty API の返却 (camelCase party) を既存構造へマージ
    setParty(prev => {
      if (!prev) return updated;
      return {
        ...prev,
        ...updated,
      };
    });
  };

  if (error) return <p>{error}</p>;
  if (!party) return <p>読み込み中...</p>;

  return (
    <div>
      <h2>パーティー詳細</h2>
      <p><strong>ID:</strong> {party.id}</p>
      <p><strong>名前:</strong> {party.partyName}</p>
      <p><strong>概要:</strong> {party.description || '(なし)'}</p>
      <p><strong>リーダー:</strong> {party.leader.loginId}</p>
      <p><strong>最大人数:</strong> {party.maxNumberOfMembers}</p>
      <p><strong>作成日時:</strong> {new Date(party.createdAt).toLocaleString()}</p>
      <p><strong>更新日時:</strong> {new Date(party.updatedAt).toLocaleString()}</p>

      {isLeader && (
        <div style={{ marginTop: 8, marginBottom: 16, display: 'flex', gap: 8 }}>
          <Button variant='outlined' onClick={openEdit}>
            編集
          </Button>
          <Button variant='contained' color='error' onClick={handleDisband}>
            パーティー解散
          </Button>
        </div>
      )}

      <h3>メンバー一覧</h3>
      <ul>
        {party.members.map(m => (
          <li key={m.id} style={{ marginBottom: 4 }}>
            {m.loginId} ({m.id})
            {isLeader && m.id !== party.leaderId && (
              <Button
                size='small'
                variant='outlined'
                color='error'
                style={{ marginLeft: 8 }}
                onClick={() => handleKickMember(m.id)}
              >
                除名
              </Button>
            )}
          </li>
        ))}
      </ul>

      <h3>参加申請中</h3>
      <ul>
        {party.pendingMembers.map(m => (
          <li key={m.id} style={{ marginBottom: 4 }}>
            {m.loginId} ({m.id})
            {isLeader && (
              <>
                <Button
                  size='small'
                  variant='contained'
                  color='primary'
                  style={{ marginLeft: 8 }}
                  onClick={() => handleApprove(m.id)}
                >
                  許可
                </Button>
                <Button
                  size='small'
                  variant='outlined'
                  color='secondary'
                  style={{ marginLeft: 4 }}
                  onClick={() => handleReject(m.id)}
                >
                  却下
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div style={{ marginTop: '2rem', display: 'flex', gap: 12 }}>
        {!isMember && !isPending && (
          <Button variant='contained' color='primary' onClick={handleJoinRequest}>
            参加申請
          </Button>
        )}

        {isMember && !isLeader && (
          <Button variant='outlined' color='secondary' onClick={handleLeaveParty}>
            パーティー離脱
          </Button>
        )}
      </div>

      <PartyEditDialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        partyId={party.id}
        initialValues={editableSnapshot()}
        onUpdated={handleUpdated}
      />
    </div>
  );
}
