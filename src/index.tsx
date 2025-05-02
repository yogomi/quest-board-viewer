import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import {
  steppenwolfTheme,
} from 'themes/steppenwolf/';
import { CookiesProvider } from "react-cookie";
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Main from './Main';
import Login from 'pages/Login';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

function NotFound() {
  return <h1>Not Found</h1>
}

root.render(
  <ThemeProvider theme={steppenwolfTheme}>
    <CssBaseline />
    <CookiesProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/quest-board/auth/login' element={<Login />} />
          <Route path='/quest-board/users' element={<Main />} />
          <Route path='/quest-board/' element={<Main />} />
        </Routes>
      </BrowserRouter>
    </CookiesProvider>
  </ThemeProvider>
);
