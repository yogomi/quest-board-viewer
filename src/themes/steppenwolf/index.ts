import { createTheme } from '@mui/material/styles';
import { teal, cyan } from '@mui/material/colors';
import { ColorTranslator } from 'colortranslator';
import { add, times, alpha } from 'libs/color-translator-calculator';

const mainBackgroundColor = new ColorTranslator('rgb(0, 12, 12)');
const normalTextColor = new ColorTranslator('rgb(86, 250, 244)');

const coloredTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: teal,
    secondary: cyan,
    background: {
      default: mainBackgroundColor.RGBA,
      paper: times(normalTextColor, 0.1).RGBA,
    },
    text: {
      primary: normalTextColor.RGBA,
      secondary: alpha(normalTextColor, 0.8).RGBA,
      disabled: alpha(normalTextColor, 0.4).RGBA
    }
  },
});

export const steppenwolfTheme = createTheme(coloredTheme, {
  components: {
    MuiSelect: {
      styleOverrides: {
        icon: {
          color: coloredTheme.palette.text.primary,
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          border: `1px solid ${coloredTheme.palette.text.primary}`
        }
      }
    }
  },
});
