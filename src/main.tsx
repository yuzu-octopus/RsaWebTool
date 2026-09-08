import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import 'astryx-dracula/tokens.css';
import 'astryx-dracula/theme.css';
import { Theme } from '@astryxdesign/core/theme';
import { astryxDraculaTheme } from 'astryx-dracula';
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Theme theme={astryxDraculaTheme} mode="dark">
      <App />
    </Theme>
  </StrictMode>,
)
