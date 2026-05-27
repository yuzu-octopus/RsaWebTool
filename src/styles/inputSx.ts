import { draculaColors } from '../theme/dracula';
import { FONT_FAMILY } from './shared';

export const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: draculaColors.currentLine,
    color: draculaColors.foreground,
    fontFamily: FONT_FAMILY,
    '& fieldset': { borderColor: draculaColors.comment },
    '&:hover fieldset': { borderColor: draculaColors.purple },
    '&.Mui-focused fieldset': { borderColor: draculaColors.purple },
  },
  '& .MuiInputLabel-root': {
    color: draculaColors.comment,
    fontFamily: FONT_FAMILY,
    '&.Mui-focused': { color: draculaColors.purple },
  },
  '& .MuiInputBase-input': {
    fontFamily: FONT_FAMILY,
  },
  '& .MuiFormHelperText-root': {
    color: draculaColors.comment,
    fontFamily: FONT_FAMILY,
    fontSize: '0.7rem',
    marginLeft: 0,
    marginTop: '2px',
  },
};
