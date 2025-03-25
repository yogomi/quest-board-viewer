import React, { useState } from 'react';
import { useCookies } from 'react-cookie';
import {
  CircularProgress,
} from '@mui/material';

export default function Main() {
  const [cookies, setCookie] = useCookies([
                                  'selectedZaoCloudUnitName',
                                  'selectedScopsOwlFunctionIndex'
                                ]);

  return (
    <CircularProgress />
  );
}
