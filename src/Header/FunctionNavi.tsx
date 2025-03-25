import React, {useState} from 'react';
import {
  List,
  ListItemButton,
  ListItemText,
  Menu,
  MenuItem
} from '@mui/material';
import SimpleLavel from 'types/SimpleLavel';
import { CookiesProvider } from "react-cookie";
import { useCookies } from 'react-cookie';

export default function FunctionNavi({
    scopsOwlFunctions,
    selectedScopsOwlFunctionIndex,
    setSelectedScopsOwlFunctionIndex
  }: {
    scopsOwlFunctions: SimpleLavel[],
    selectedScopsOwlFunctionIndex: number,
    setSelectedScopsOwlFunctionIndex: React.Dispatch<React.SetStateAction<number>>
  }) {
  const [cookies, setCookie] = useCookies([
                                  'selectedScopsOwlFunctionIndex'
                                ]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClickListItem = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (
    event: React.MouseEvent<HTMLElement>,
    index: number,
  ) => {
    setSelectedScopsOwlFunctionIndex(index);
    setCookie("selectedScopsOwlFunctionIndex", index);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <List
        component="nav"
        aria-label="Function Select"
        sx={{ bgcolor: 'background.paper' }}
      >
        <ListItemButton
          id="function-select-button"
          aria-haspopup="listbox"
          aria-controls="function-menu"
          aria-label="select function"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClickListItem}
        >
          <ListItemText
            primary="機能"
            secondary={scopsOwlFunctions[selectedScopsOwlFunctionIndex].description}
          />
        </ListItemButton>
      </List>
      <Menu
        id="function-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'function-select-button',
          role: 'listbox',
        }}
      >
        {scopsOwlFunctions.map((option, index) => (
          <MenuItem
            key={option.description}
            disabled={index === selectedScopsOwlFunctionIndex}
            selected={index === selectedScopsOwlFunctionIndex}
            onClick={(event) => handleMenuItemClick(event, index)}
          >
            {option.description}
          </MenuItem>
        ))}
      </Menu>
    </div>
  );
}
