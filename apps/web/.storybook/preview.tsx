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
const ThemeSyncDecorator = (
  Story: React.ComponentType,
  context: { globals?: { theme?: string }; parameters?: { layout?: string } },
) => {
  const themeMode = context.globals?.theme || 'light'
  const backgroundColor = BACKGROUND_COLORS[themeMode] || BACKGROUND_COLORS.light
  // Skip padding for fullscreen layouts (page-level stories)
  const isFullscreen = context.parameters?.layout === 'fullscreen'

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode)
  }, [themeMode])

  return (
    <div style={{ backgroundColor, padding: isFullscreen ? 0 : '1rem' }}>
      <Story />
    </div>
  )
}

/** Safe{Wallet} viewport presets for responsive testing */
const SAFE_VIEWPORTS = {
  mobile: {
    name: 'Mobile',
    styles: {
      width: '375px',
      height: '667px',
    },
    type: 'mobile' as const,
  },
  tablet: {
    name: 'Tablet',
    styles: {
      width: '768px',
      height: '1024px',
    },
    type: 'tablet' as const,
  },
  desktop: {
    name: 'Desktop',
    styles: {
      width: '1280px',
      height: '800px',
    },
    type: 'desktop' as const,
  },
  desktopWide: {
    name: 'Desktop Wide',
    styles: {
      width: '1920px',
      height: '1080px',
    },
    type: 'desktop' as const,
  },
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
    viewport: {
      viewports: SAFE_VIEWPORTS,
      defaultViewport: 'desktop',
    },
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
