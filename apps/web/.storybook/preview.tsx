import type { Preview } from '@storybook/nextjs'
import React, { useEffect } from 'react'

import { ThemeProvider, CssBaseline } from '@mui/material'
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import createSafeTheme from '../src/components/theme/safeTheme'
import { initialize, mswLoader } from 'msw-storybook-addon'

import '../src/styles/globals.css'

// Initialize MSW for API mocking in Storybook
initialize({
  onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
})

// Export decorators for use in individual stories
// These are not applied globally but can be imported and used per-story
export { withLayout, withMockProvider } from './decorators'

const BACKGROUND_COLORS: Record<string, string> = { light: '#ffffff', dark: '#121312' }

// Syncs data-theme attribute and background color with the theme switcher
const ThemeSyncDecorator = (Story: React.ComponentType, context: { globals?: { theme?: string } }) => {
  const themeMode = context.globals?.theme || 'light'
  const backgroundColor = BACKGROUND_COLORS[themeMode] || BACKGROUND_COLORS.light

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
  }, [themeMode])

  return (
    <div style={{ backgroundColor, padding: '1rem' }}>
      <Story />
    </div>
  )
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: { disable: true },
  },

  // MSW loader for API mocking
  loaders: [mswLoader],

  decorators: [
    withThemeFromJSXProvider({
      GlobalStyles: CssBaseline,
      Provider: ThemeProvider,
      themes: {
        light: createSafeTheme('light'),
        dark: createSafeTheme('dark'),
      },
      defaultTheme: 'light',
    }),
    ThemeSyncDecorator,
  ],
}

export default preview
