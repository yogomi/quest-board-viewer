import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  Stack,
  TextField,
  Typography,
  alpha,
  PaletteColor,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatRelativeTime } from 'utils/datetime';

export interface MessageItem {
  id: string;
  comment: string;
  commentOwnerId: string;
  commentOwner?: {
    loginId?: string;
  };
  createdAt: string | Date;
}

interface MessengerProps {
  messages: MessageItem[];
  currentUserId: string | undefined;
  entityId: string;
  addMessageMutation: (
    entityId: string,
    data: { commentOwnerId: string; comment: string },
  ) => Promise<any>;
  queryKey: string[];
  importantUserId?: string;
}

// パレットカラー名を表す型（型安全にアクセスするため）
type ColorName = 'primary' | 'secondary' | 'warning';

export const Messenger: React.FC<MessengerProps> = ({
  messages,
  currentUserId,
  entityId,
  addMessageMutation,
  queryKey,
  importantUserId,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesBoxRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  // スクロール位置が最下部かどうかを確認する関数
  const checkIfAtBottom = () => {
    if (messagesBoxRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesBoxRef.current;
      // 許容誤差を20pxとして、ほぼ最下部にいるかを判定
      const isBottom = scrollTop + clientHeight >= scrollHeight - 20;
      setIsAtBottom(isBottom);
    }
  };

  // 最下部へスクロールする関数
  const scrollToBottom = () => {
    if (messagesBoxRef.current) {
      messagesBoxRef.current.scrollTop = messagesBoxRef.current.scrollHeight;
    }
  };

  const add = useMutation({
    mutationFn: () => addMessageMutation(entityId, {
      commentOwnerId: currentUserId || '',
      comment: newMessage.trim(),
    }),
    onSuccess: () => {
      setNewMessage('');
      qc.invalidateQueries({ queryKey });
      // メッセージ送信後は常に最下部にスクロール
      setTimeout(scrollToBottom, 100);
    },
  });

  // メッセージ送信処理を実行する関数
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    add.mutate();
  };

  // キーボードイベントのハンドラ (エンターで送信)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // フォーム送信防止
      handleSendMessage();
    }
  };

  // スクロールイベントリスナーの設定
  useEffect(() => {
    const messagesBox = messagesBoxRef.current;
    if (messagesBox) {
      messagesBox.addEventListener('scroll', checkIfAtBottom);
      return () => {
        messagesBox.removeEventListener('scroll', checkIfAtBottom);
      };
    }
  }, []);

  // メッセージデータが変更されたときの処理
  useEffect(() => {
    if (messages?.length && isAtBottom) {
      scrollToBottom();
    }
  }, [messages]);

  // 初期表示時に最下部にスクロール
  useEffect(() => {
    setTimeout(scrollToBottom, 100);
  }, []);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* メッセージ一覧 - スクロール可能な領域 */}
      <Box 
        ref={messagesBoxRef}
        sx={{ 
          flex: 1, 
          overflow: 'auto', 
          mb: 2 
        }}
      >
        <List dense sx={{ width: '100%' }}>
          {(messages || []).map((m) => {
            const isOwnMessage = m.commentOwnerId === currentUserId;
            const isImportantUser = m.commentOwnerId === importantUserId;

            // メッセージの色とスタイルを決定 (型安全な変数に格納)
            const messageColor: ColorName = isImportantUser 
              ? 'warning'
              : isOwnMessage ? 'secondary' : 'primary';

            // ユーザー名の表示形式
            const userName = m.commentOwner?.loginId || 'Unknown User';
            const displayName = isImportantUser ? `* ${userName}` : userName;

            return (
              <ListItem
                key={m.id}
                secondaryAction={<IconButton edge="end" />}
                sx={{
                  display: 'flex',
                  justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                  padding: 1,
                }}
              >
                <Stack
                  sx={{
                    width: '80%',
                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    color={messageColor}
                    sx={{
                      marginBottom: '4px',
                      fontSize: '0.85rem',
                      alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                      fontWeight: isImportantUser ? 600 : 400,
                    }}
                  >
                    {displayName}
                  </Typography>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: `${messageColor}.main`,
                      borderRadius: 2,
                      p: 1,
                      mb: 1,
                      maxWidth: '100%',
                      wordBreak: 'break-word',
                      backgroundColor: (theme) => 
                        alpha(
                          theme.palette[messageColor].main, 
                          0.08
                        ),
                    }}
                  >
                    <Typography
                      sx={{
                        color: `${messageColor}.light`,
                        fontWeight: 500,
                      }}
                    >
                      {m.comment}
                    </Typography>
                  </Box>

                  {/* メッセージの送信日時 */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      fontSize: '0.75rem',
                      alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                      mb: 1,
                      opacity: 0.6,
                    }}
                  >
                    {formatRelativeTime(m.createdAt)}
                  </Typography>
                </Stack>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* メッセージ入力部分 */}
      <Box
        sx={{
          p: 2,
          pt: 0,
          borderTop: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <TextField
            label="Type a message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            size="small"
            fullWidth
            multiline
            maxRows={3}
          />
          <Button
            variant="contained"
            onClick={handleSendMessage}
          >
            Send
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};
