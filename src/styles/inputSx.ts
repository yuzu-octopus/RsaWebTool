import { draculaColors } from '../theme/dracula';
import { MONO_FAMILY } from './shared';

export const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: draculaColors.currentLine,
    color: draculaColors.foreground,
    fontFamily: MONO_FAMILY,
    '& fieldset': { borderColor: draculaColors.comment },
    '&:hover fieldset': { borderColor: draculaColors.purple },
    '&.Mui-focused fieldset': { borderColor: draculaColors.purple },
  },
  '& .MuiInputLabel-root': {
    color: draculaColors.comment,
    fontFamily: MONO_FAMILY,
    '&.Mui-focused': { color: draculaColors.purple },
  },
  '& .MuiInputBase-input': {
    fontFamily: MONO_FAMILY,
  },
  '& .MuiFormHelperText-root': {
    color: draculaColors.comment,
    fontFamily: MONO_FAMILY,
    fontSize: '0.7rem',
    marginLeft: 0,
    marginTop: '2px',
  },
};
