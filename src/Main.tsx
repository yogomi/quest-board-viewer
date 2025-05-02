import React, { useState } from 'react';
import { useCookies } from 'react-cookie';
import {
  CircularProgress,
} from '@mui/material';

import UserSummary from 'pages/users/UserSummary'

export default function Main() {
  const [cookies, setCookie] = useCookies([
                                  'selectedZaoCloudUnitName',
                                  'selectedScopsOwlFunctionIndex'
                                ]);

  return (
    <React.Fragment>
      <UserSummary />
    </React.Fragment>
  );
}
