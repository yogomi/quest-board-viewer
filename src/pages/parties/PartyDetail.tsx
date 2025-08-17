import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import { useUser } from 'hooks/useUser';

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
  const { id } = useParams<{ id: string }>();
  const [party, setParty] = useState<PartyDetailData | null>(null);
  const [error, setError] = useState<boolean>(false);
  const { user } = useUser();
  const userId = user?.id;

  useEffect(() => {
    if (id) {
      fetch(`/quest-board/api/v1/parties/${id}`)
        .then(res => res.json())
        .then(json => {
          if (json.success) {
            setParty(json.data);
          } else {
            setError(true);
          }
        })
        .catch(() => setError(true));
    }
  }, [id]);

  const isLeader = party?.leaderId === userId;
  const isMember = party?.members.some(m => m.id === userId);
  const isPending = party?.pendingMembers.some(m => m.id === userId);

  const handleJoinRequest = () => {
    // 参加申請APIを呼ぶ想定
    fetch(`/quest-board/api/v1/parties/${id}/join-request`, {
      method: 'PUT',
    }).then(res => res.json())
      .then(json => {
        if (json.success) {
          location.reload();
        } else {
          alert('参加申請の送信に失敗しました。');
        }
      })
      .catch(() => alert('参加申請の送信に失敗しました。'))
      .then(() => location.reload());
  };


  const handleApprove = (userId: string) => {
    fetch(`/quest-board/api/v1/parties/${id}/join-request/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          location.reload();
        } else {
          alert('許可に失敗しました。');
        }
      })
      .catch(() => alert('許可に失敗しました。'));
  };

  const handleReject = (userId: string) => {
    fetch(`/quest-board/api/v1/parties/${id}/join-request/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          location.reload();
        } else {
          alert('却下に失敗しました。');
        }
      })
      .catch(() => alert('却下に失敗しました。'));
  };

  const handleLeaveParty = () => {
    fetch(`/quest-board/api/v1/parties/${id}/leave`, {
      method: 'POST',
    }).then(() => location.reload());
  };

  const handleDisband = () => {
    if (!confirm('本当にこのパーティーを解散しますか？')) return;
    fetch(`/quest-board/api/v1/parties/${id}`, {
      method: 'DELETE',
    }).then(() => {
      alert('パーティーを解散しました。');
      window.location.href = '/quest-board/party/list';
    });
  };

  if (error) return <p>取得に失敗しました。</p>;
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

      <h3>メンバー一覧</h3>
      <ul>
        {party.members.map(m => (
          <li key={m.id}>{m.loginId} ({m.id})</li>
        ))}
      </ul>

      <h3>参加申請中</h3>
      <ul>
        {party.pendingMembers.map(m => (
          <li key={m.id}>
            {m.loginId} ({m.id})
            {isLeader && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  style={{ marginLeft: 8 }}
                  onClick={() => handleApprove(m.id)}
                >
                  許可
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="secondary"
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

      <div style={{ marginTop: '2rem' }}>
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

        {isLeader && (
          <Button variant='contained' color='error' onClick={handleDisband}>
            パーティー解散
          </Button>
        )}
      </div>
    </div>
  );
}
