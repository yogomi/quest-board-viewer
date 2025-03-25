import React, {useState, useEffect} from 'react';
import {
  Select,
  SelectChangeEvent,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { useCookies } from 'react-cookie';
import SimpleLavel from 'types/SimpleLavel';
import FunctionNavi from './FunctionNavi';
import { GlobalStyles } from "@mui/material";

export default function Header({
    questBoardFunctions,
  }: {
    questBoardFunctions: SimpleLavel[],

  }) {
  const [cookies, setCookie] = useCookies(['selectedZaoCloudUnitName']);
  const [hasData, setHasData] = useState<boolean>(false);

  return (
    <React.Fragment>
      <GlobalStyles
        styles={{
          header: {
            display: 'flex',
            '& :first-of-type': { 'marginRight': 'auto' },
            margin: '10px',
          }
        }}
      />
      <header>
      </header>
    </React.Fragment>
  );
}
