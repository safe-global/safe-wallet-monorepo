import type { Preview } from '@storybook/nextjs'
import React, { useEffect } from 'react'

import { ThemeProvider, CssBaseline } from '@mui/material'
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import createSafeTheme from '../src/components/theme/safeTheme'

import '../src/styles/globals.css'

// Component wrapper to sync data-theme attribute with Storybook's theme switcher
// This ensures CSS variables (which rely on [data-theme="dark"]) update correctly
const DataThemeWrapper = ({ children, themeMode }: { children: React.ReactNode; themeMode: string }) => {
  useEffect(() => {
    // Set data-theme attribute on document.documentElement to match Storybook's theme
    document.documentElement.setAttribute('data-theme', themeMode)
  }, [themeMode])

  return React.createElement(React.Fragment, null, children)
}

// Decorator to sync data-theme attribute with Storybook's theme switcher
const DataThemeDecorator = (Story: React.ComponentType<any>, context: { globals?: { theme?: string } }) => {
  const themeMode = context.globals?.theme || 'light'

  return React.createElement(DataThemeWrapper, { themeMode, children: React.createElement(Story) })
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
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
