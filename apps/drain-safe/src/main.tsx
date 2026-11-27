import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material'
import { SafeProvider } from '@safe-global/safe-apps-react-sdk'
import { generateMuiTheme } from '@safe-global/theme/generators/mui'
import DMSansRegular from './assets/fonts/DMSansRegular.woff2'
import DMSansBold from './assets/fonts/DMSans700.woff2'
import App from './App'
import AppLoader from './components/AppLoader'

const fonts = `
  @font-face { font-family: 'DM Sans'; font-display: swap; font-weight: 400; src: url(${DMSansRegular}) format('woff2'); }
  @font-face { font-family: 'DM Sans'; font-display: swap; font-weight: 700; src: url(${DMSansBold}) format('woff2'); }
`

const container = document.getElementById('root')
if (!container) throw new Error('Root element not found')

createRoot(container).render(
  <StrictMode>
    <ThemeProvider theme={generateMuiTheme('light')}>
      <CssBaseline />
      <GlobalStyles styles={fonts} />
      <SafeProvider loader={<AppLoader />}>
        <App />
      </SafeProvider>
    </ThemeProvider>
  </StrictMode>,
)
