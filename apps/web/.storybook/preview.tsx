import type { Preview } from '@storybook/nextjs'
import React, { useEffect } from 'react'

import { ThemeProvider, CssBaseline } from '@mui/material'
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import createSafeTheme from '../src/components/theme/safeTheme'

import '../src/styles/globals.css'

const BACKGROUND_COLORS: Record<string, string> = { light: '#ffffff', dark: '#121312' }

// Syncs data-theme attribute and background color with Storybook's theme switcher
const DataThemeWrapper = ({ children, themeMode }: { children: React.ReactNode; themeMode: string }) => {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
    document.body.style.backgroundColor = BACKGROUND_COLORS[themeMode] || BACKGROUND_COLORS.light
  }, [themeMode])

  return <>{children}</>
}

const DataThemeDecorator = (Story: React.ComponentType, context: { globals?: { theme?: string } }) => {
  const themeMode = context.globals?.theme || 'light'
  return (
    <DataThemeWrapper themeMode={themeMode}>
      <Story />
    </DataThemeWrapper>
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
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#121312' },
      ],
    },
  },

  initialGlobals: {
    backgrounds: { value: 'light' },
  },

  decorators: [
    // First, apply the theme provider
    withThemeFromJSXProvider({
      GlobalStyles: CssBaseline,
      Provider: ThemeProvider,
      themes: {
        light: createSafeTheme('light'),
        dark: createSafeTheme('dark'),
      },
      defaultTheme: 'light',
    }),
    // Then, sync the data-theme attribute for CSS variables
    DataThemeDecorator,
  ],
}

export default preview
