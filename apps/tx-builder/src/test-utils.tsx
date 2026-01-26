import { ReactElement } from 'react'
import { ThemeProvider } from 'styled-components'
import { render, RenderResult } from '@testing-library/react'
import { SafeProvider } from '@safe-global/safe-apps-react-sdk'
import { BrowserRouter } from 'react-router-dom'
import StoreProvider from './store'
import SafeThemeProvider from './theme/SafeThemeProvider'

const renderWithProviders = (Components: ReactElement): RenderResult => {
  return render(
    <SafeThemeProvider>
      {(theme) => (
        <ThemeProvider theme={theme}>
          <SafeProvider>
            <StoreProvider>
              <BrowserRouter>{Components}</BrowserRouter>
            </StoreProvider>
          </SafeProvider>
        </ThemeProvider>
      )}
    </SafeThemeProvider>,
  )
}

export * from '@testing-library/react'
export { renderWithProviders as render }
