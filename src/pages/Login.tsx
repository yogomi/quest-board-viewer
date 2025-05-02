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

const loginFormStyle = css`
    display: flex;
    align-items: center;
    flex-direction: column;
    margin: 0 auto;
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
    console.log(formJson)
    const authData = {
      loginId: formJson.userId,
      passwordDigest: formJson.password,
      callbackUrl: '/quest-board/users',
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
        console.log(res.url)
        window.location.href = res.url;
      });
  }

  const getCsrfToken = () => {
    fetch(`/quest-board/api/v1/auth/csrf`, {
        method: 'GET',
    })
      .then(res => res.json())
      .then(response => {
        if (!response.hasOwnProperty('csrfToken')) {
          throw 'Cannot get csrf token.'
        }
        setCsrfToken(response['csrfToken']);
      })
  }

  useEffect(getCsrfToken, []);

  const logout = async () => {
    console.log('logout');
    await fetch('/quest-board/api/v1/auth/signout', {
      method: 'POST',
      credentials: 'include', // ★ これが重要
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ csrfToken }),
    });
    // await fetch('/quest-board/api/v1/auth/signout?callbackUrl=/quest-board/users', { method: 'GET' });
    // window.location.href = '/quest-board/auth/login';
  }

  if (csrfToken === '') {
    return <CircularProgress />;
  } else {
    return (
      <Container>
        <Box component="form" css={loginFormStyle} onSubmit={login} >
          <TextField label="ユーザーID" name="userId" variant="outlined" required />
          <TextField label="パスワード" name="password" variant="outlined" required />
          <ButtonGroup>
            <Button type="submit">ログイン</Button>
            <Button type="submit">新規登録</Button>
            <Button onClick={logout}>ログアウト</Button>
          </ButtonGroup>
        </Box>
      </Container>
    );
  }
}
