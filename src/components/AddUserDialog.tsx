import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import {addUser} from 'api/users';

interface AddUserDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (userId: string, newEmail: string) => void;
}

export default function AddUserDialog({
  open,
  onClose,
  onSuccess,
}: AddUserDialogProps) {
  const [loginId, setLoginId] = useState<string>('');
  const [newEmail, setNewEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleAddUser = async () => {
    const newUser = {
      loginId,
      newEmail,
      passwordCrypted: password, // Base64エンコード（簡易的な暗号化）
    };

    console.log(newUser);
    try {
      const result = await addUser(newUser)
      onSuccess(result.userId, newUser.newEmail);
      onClose();
    } catch (error) {
      console.error('Error adding user:', error);
      // エラーハンドリング（例: エラーメッセージの表示）
      alert('ユーザーの追加に失敗しました。');
    }
  }
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>ユーザー新規登録</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="User Name"
          type="text"
          fullWidth
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Email"
          type="email"
          fullWidth
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Password"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAddUser} color="primary" variant="contained">
          作成
        </Button>
      </DialogActions>
    </Dialog>
  );
}
