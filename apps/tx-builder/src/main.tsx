import { createRoot } from 'react-dom/client'
import { SafeProvider } from '@safe-global/safe-apps-react-sdk'
import { BrowserRouter } from 'react-router-dom'

import GlobalStyles from './global'
import App from './App'
import StoreProvider from './store'
import SafeThemeProvider from './theme/SafeThemeProvider'
import { ThemeProvider } from 'styled-components'

const container = document.getElementById('root')

if (!container) {
  throw new Error('Root element not found')
}

const root = createRoot(container)

root.render(
  <>
    <GlobalStyles />
    <SafeThemeProvider>
      {(theme) => (
        <ThemeProvider theme={theme}>
          <SafeProvider>
            <StoreProvider>
              <BrowserRouter basename={import.meta.env.BASE_URL}>
                <App />
              </BrowserRouter>
            </StoreProvider>
          </SafeProvider>
        </ThemeProvider>
      )}
    </SafeThemeProvider>
  </>,
)
