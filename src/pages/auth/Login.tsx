/* @jsxImportSource @emotion/react */
import React, { useState, useEffect } from 'react';
import { css } from '@emotion/react';
import { useCookies } from 'react-cookie';
import {
  Container,
  CircularProgress,
  Box,
  Typography,
  TextField,
  CardActions,
  Button,
  ButtonGroup,
} from '@mui/material';

const containerStyle = css`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const loginFormStyle = css`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  max-width: 400px;
`;

export default function Login() {
  const [cookies, setCookie] = useCookies([
                                  'selectedZaoCloudUnitName',
                                  'selectedScopsOwlFunctionIndex'
                                ]);
  const [csrfToken, setCsrfToken] = useState<string>('');

  const login = (event: React.FormEvent<HTMLFormElement>) => {
    
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const formJson = Object.fromEntries((formData as any).entries());
    const authData = {
      loginId: formJson.userId,
      passwordDigest: formJson.password,
      callbackUrl: '/quest-board/user/summary',
      csrfToken: csrfToken,
    }

    fetch(`/quest-board/api/v1/auth/callback/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(authData),
    })
      .then(res => {
        console.log(res)
        window.location.href = res.url;
      });
  }

  const getCsrfToken = () => {
    fetch(`/quest-board/api/v1/auth/csrf`, {
        method: 'GET',
    })
      .then(res => res.json())
      .then(response => {
        console.log(response);
        if (!response.hasOwnProperty('csrfToken')) {
          throw 'Cannot get csrf token.'
        }
        setCsrfToken(response['csrfToken']);
      })
  }

  useEffect(getCsrfToken, []);

  if (csrfToken === '') {
    return <CircularProgress />;
  } else {
    return (
      <Container css={containerStyle}>
        <Box component="form" css={loginFormStyle} onSubmit={login} >
          <TextField label="ユーザーID" name="userId" variant="outlined" required />
          <TextField label="パスワード" name="password" variant="outlined" required />
          <ButtonGroup>
            <Button type="submit">ログイン</Button>
            <Button type="submit">新規登録</Button>
          </ButtonGroup>
        </Box>
      </Container>
    );
  }
}
