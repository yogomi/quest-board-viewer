import React from 'react';
import { IconButton, Menu, MenuItem } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

export default function TopRightMenu() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (open) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = (path?: string) => {
    setAnchorEl(null);
    if (path) navigate(path);
  };

  const handleLogout = async () => {
    console.log('logout');
    try {
      const csrfRes = await fetch(`/quest-board/api/v1/auth/csrf`, {
          method: 'GET',
      });
      const csrfResJson = await csrfRes.json();
      const res = await fetch('/quest-board/api/v1/auth/signout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(csrfResJson),
      });
      window.location.href = '/quest-board/auth/login';
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div style={{ position: 'absolute', top: 16, right: 16 }}>
      <IconButton
        aria-label="menu"
        aria-controls="nav-menu"
        aria-haspopup="true"
        color="primary"
        onClick={handleClick}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </IconButton>
      <Menu
        id="nav-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => handleClose()}
      >
        <MenuItem onClick={() => handleClose('/quest-board/user/summary')}>ユーザー一覧</MenuItem>
        <MenuItem onClick={() => handleClose('/quest-board/quest/list')}>クエスト一覧</MenuItem>
        <MenuItem onClick={() => handleClose('/quest-board/party/list')}>パーティー一覧</MenuItem>
        <MenuItem onClick={() => handleClose('/quest-board/announcement/list')}>アナウンス一覧</MenuItem>
        <MenuItem onClick={() => handleClose('/quest-board/system/settings')}>システム管理</MenuItem>
        <MenuItem onClick={() => handleLogout()}>ログアウト</MenuItem>
      </Menu>
    </div>
  );
}
