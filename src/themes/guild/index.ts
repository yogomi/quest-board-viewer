import { createTheme } from '@mui/material/styles';
import { amber, brown, grey } from '@mui/material/colors';

export const guildTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: amber,
    secondary: brown,
    background: {
      default: grey[900],
      paper: grey[800],
    },
    text: {
      primary: amber[100],
      secondary: amber[200],
      disabled: grey[500],
    },
  },
  typography: {
    fontFamily: `"Shippori Mincho B1", "Noto Serif JP", serif`,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 500 },
    body1: { fontWeight: 400 },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: `1px solid ${brown[800]}`,
          borderRadius: '8px',
          boxShadow: 'inset 0 0 5px ${brown[900]}',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: '6px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: grey[800],
          borderRadius: '6px',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: brown[700],
          },
        },
        input: {
          color: amber[100],
        },
      },
    },
  },
});
