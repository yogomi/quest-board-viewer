import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import {
  steppenwolfTheme,
} from 'themes/steppenwolf/';
import {
  guildTheme,
} from 'themes/guild/';
import { CookiesProvider } from "react-cookie";
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Main from './Main';
import BulkAddUsers from './pages/system/BulkAddUsers';
import Login from 'pages/auth/Login';

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
          <Route path='/quest-board/bulk-add-users' element={<BulkAddUsers />} />
          <Route path='/quest-board/' element={<Main />} />
        </Routes>
      </BrowserRouter>
    </CookiesProvider>
  </ThemeProvider>
);
