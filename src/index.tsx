import React from 'react';
import ReactDOM from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import {
  steppenwolfTheme,
} from 'themes/steppenwolf/';
import { CookiesProvider } from "react-cookie";
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import QuestListPage from 'pages/quests/QuestListPage';
import QuestDetailPage from 'pages/quests/QuestDetailPage';
import QuestFormPage from 'pages/quests/QuestFormPage';


const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const qc = new QueryClient();

function NotFound() {
  return <h1>Not Found</h1>
}

root.render(
  <React.StrictMode>
    <UserProvider>
      <QueryClientProvider client={qc}>
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
                <Route path="/quest-board/quest/list" element={<QuestListPage />} />
                <Route path="/quest-board/quests/new" element={<QuestFormPage />} />
                <Route
                  path="/quest-board/quests/:questId"
                  element={<QuestDetailPage />}
                />
                <Route
                  path="/quest-board/quests/:questId/edit"
                  element={<QuestFormPage />}
                />
              </Routes>
            </BrowserRouter>
          </CookiesProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </UserProvider>
  </React.StrictMode>
);
