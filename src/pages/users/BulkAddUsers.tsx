/* @jsxImportSource @emotion/react */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { css } from '@emotion/react';
import {
  Container,
  Box,
  Button,
  ButtonGroup,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const containerStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const bulkAddUsersStyle = css`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 400px;
`;

export default function BulkAddUsers() {
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    if (selectedFile) {
      console.log('選択されたファイル:', selectedFile.name);
    }
  };

  const bulkAddUsers = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      alert('ファイルを選択してください。');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`/quest-board/api/v1/user/bulk-add-users`, {
        method: 'POST',
        body: formData,
      });
      const response = await res.json();
      console.log(response);
      if (response.success) {
        console.log('アップロード完了', res);
        navigate(-1);
      } else {
        console.error('アップロード失敗:', response.message || response.code);
        alert(response.message || 'アップロードに失敗しました。');
      }
    } catch (err) {
      console.error('アップロードエラー', err);
      alert('アップロードエラーが発生しました。');
    }
  };

  return (
    <Container css={containerStyle}>
      <Box component="form" css={bulkAddUsersStyle} onSubmit={bulkAddUsers}>
        <input
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          id="upload-file"
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <label htmlFor="upload-file">
          <Button
            variant="contained"
            component="span"
            startIcon={<CloudUploadIcon />}
          >
            ファイルを選択
          </Button>
        </label>
        {file && (
          <Box>
            <Typography variant="body2">ファイル名: {file.name}</Typography>
            <Typography variant="body2">サイズ: {(file.size / 1024).toFixed(2)} KB</Typography>
            <Typography variant="body2">種類: {file.type || '不明'}</Typography>
          </Box>
        )}
        <ButtonGroup>
          <Button type="submit" variant="contained" color="primary">
            アップロード
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            戻る
          </Button>
        </ButtonGroup>
      </Box>
    </Container>
  );
}
