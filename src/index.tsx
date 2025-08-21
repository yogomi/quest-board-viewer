import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import {
  steppenwolfTheme,
} from 'themes/steppenwolf/';
import { CookiesProvider } from "react-cookie";
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import TopRightMenu from 'components/TopRightMenu';
import UserSummary from 'pages/users/UserSummary'
import PartyList from 'pages/parties/PartyList'
import PartyDetail from 'pages/parties/PartyDetail'
import AnnouncementList from 'pages/announcements/AnnouncementList'
import AnnouncementDetail from 'pages/announcements/AnnouncementDetail';
import SystemSettings from 'pages/system/SystemSettings';
import BulkAddUsers from 'pages/users/BulkAddUsers';
import Login from 'pages/auth/Login';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

function NotFound() {
  return <h1>Not Found</h1>
}

root.render(
  <React.StrictMode>
    <UserProvider>
      <ThemeProvider theme={steppenwolfTheme}>
        <CssBaseline />
        <CookiesProvider>
          <BrowserRouter>
            <TopRightMenu />
            <Routes>
              <Route path='/quest-board/auth/login' element={<Login />} />
              <Route path='/quest-board/user/summary' element={<UserSummary />} />
              <Route path='/quest-board/user/bulk-add-users' element={<BulkAddUsers />} />
              <Route path='/quest-board/party/list' element={<PartyList />} />
              <Route path='/quest-board/announcement/list' element={<AnnouncementList />} />
              <Route path='/quest-board/announcement/:id' element={<AnnouncementDetail />} />
              <Route path='/quest-board/system/settings' element={<SystemSettings />} />
              <Route path='/quest-board/parties/:id' element={<PartyDetail />} />
              <Route path='*' element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CookiesProvider>
      </ThemeProvider>
    </UserProvider>
  </React.StrictMode>
);
