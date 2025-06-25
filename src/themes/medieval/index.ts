import { createTheme } from '@mui/material/styles';
import { amber, deepOrange, grey, green } from '@mui/material/colors';
import { ColorTranslator } from 'colortranslator';
import { alpha } from 'libs/color-translator-calculator';

const parchment = new ColorTranslator('rgb(242, 233, 210)');
const inkBrown = new ColorTranslator('rgb(60, 42, 30)');
const deepLeafGreen = new ColorTranslator('rgb(50, 80, 50)');

export const medievalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: deepOrange, // ろうそく・封蝋の赤
    secondary: green,     // 森林や薬草
    background: {
      default: parchment.RGBA,
      paper: alpha(parchment, 0.96).RGBA,
    },
    text: {
      primary: inkBrown.RGBA, // 羽ペンのインク色
      secondary: alpha(inkBrown, 0.7).RGBA,
      disabled: alpha(inkBrown, 0.4).RGBA,
    },
    divider: grey[400],
  },
  typography: {
    fontFamily: `'Cormorant Garamond', 'Georgia', serif`,
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    button: { textTransform: 'none' }, // ボタン文字を中世風に抑制
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: `1px solid ${grey[400]}`,
          borderRadius: '12px',
          padding: '1rem',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          backgroundColor: amber[700],
          color: '#fff',
          '&:hover': {
            backgroundColor: amber[800],
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          backgroundColor: alpha(parchment, 0.5).RGBA,
        },
      },
    },
  },
});
