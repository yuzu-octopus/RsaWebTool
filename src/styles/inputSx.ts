import { draculaColors } from '../theme/dracula';

export const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: draculaColors.currentLine,
    color: draculaColors.foreground,
    fontFamily: "'JetBrains Mono', monospace",
    '& fieldset': { borderColor: draculaColors.comment },
    '&:hover fieldset': { borderColor: draculaColors.purple },
    '&.Mui-focused fieldset': { borderColor: draculaColors.purple },
  },
  '& .MuiInputLabel-root': {
    color: draculaColors.comment,
    fontFamily: "'JetBrains Mono', monospace",
    '&.Mui-focused': { color: draculaColors.purple },
  },
  '& .MuiInputBase-input': {
    fontFamily: "'JetBrains Mono', monospace",
  },
};
