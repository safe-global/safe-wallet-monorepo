import type { Preview } from '@storybook/nextjs'
import React, { useEffect } from 'react'

import { ThemeProvider, CssBaseline } from '@mui/material'
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import createSafeTheme from '../src/components/theme/safeTheme'

import '../src/styles/globals.css'

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
