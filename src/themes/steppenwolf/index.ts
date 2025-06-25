import { createTheme } from '@mui/material/styles';
import { green, pink, blue } from '@mui/material/colors';
import { ColorTranslator } from 'colortranslator';
import { alpha } from 'libs/color-translator-calculator';

const baseBg = new ColorTranslator('rgb(5, 10, 20)');
const neonText = new ColorTranslator('rgb(0, 255, 255)');
const accentText = new ColorTranslator('rgb(255, 0, 255)');

const coloredTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: blue,
    secondary: green,
    error: pink,
    background: {
      default: baseBg.RGBA,
      paper: alpha(neonText, 0.05).RGBA,
    },
    text: {
      primary: neonText.RGBA,
      secondary: alpha(neonText, 0.8).RGBA,
      disabled: alpha(neonText, 0.5).RGBA,
    },
  },
});

export const steppenwolfTheme = createTheme(coloredTheme, {
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '@global': {
          '@keyframes flicker': {
            '0%, 100%': { opacity: 1 },
            '50%': { opacity: 0.85 },
            '70%': { opacity: 1 },
            '85%': { opacity: 0.9 },
          },
          body: {
            backgroundColor: baseBg.RGBA,
            color: neonText.RGBA,
            fontFamily: "'Orbitron', 'Helvetica Neue', sans-serif", // サイバー感のあるフォント
            animation: 'flicker 2.5s infinite ease-in-out',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#00ffff',
          border: `1px solid ${neonText.HEX}`,
          backgroundColor: alpha(neonText, 0.08).RGBA,
          '&:hover': {
            backgroundColor: alpha(neonText, 0.2).RGBA,
          },
          textShadow: '0 0 5px #00ffff, 0 0 10px #00ffff',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderColor: neonText.HEX,
          backgroundColor: alpha(neonText, 0.05).RGBA,
          color: neonText.RGBA,
        },
        notchedOutline: {
          borderColor: alpha(neonText, 0.6).RGBA,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: neonText.RGBA,
        },
      },
    },
  },
});

