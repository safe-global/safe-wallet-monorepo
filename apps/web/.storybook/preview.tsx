import type { Preview } from '@storybook/nextjs'
import React, { useEffect } from 'react'

import { initialize, mswLoader } from 'msw-storybook-addon'

import '../src/styles/globals.css'
import { ShadcnProvider } from './shadcn'

// Initialize MSW for API mocking in Storybook
initialize({
  onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
})

// Export decorators for use in individual stories
// These are not applied globally but can be imported and used per-story
export { withMockProvider } from './decorators'

// Canvas colors mirror the shadcn --background token per mode so bg-background elements
// never render as visible patches against the canvas.
const BACKGROUND_COLORS: Record<string, string> = { light: '#ffffff', dark: '#000000' }

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
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  parameters: {
    options: {
      storySort: {
        // Alphabetical within groups; explicit `order` entries below keep their curated order.
        method: 'alphabetical',
        order: [
          'Pages',
          [
            'Core',
            ['Home', 'Balances', 'Transactions', 'AddressBook', 'Settings'],
            'DeFi',
            ['Swap', 'Bridge', 'Stake', 'Earn'],
            'Apps',
            'Onboarding',
            ['Welcome', 'NewSafe', 'MyAccounts', 'UserSettings', 'SpacesList'],
            'Spaces',
            'Static',
            ['Error', 'Legal', 'Handlers'],
          ],
          'UI',
          'Components',
          'Features',
        ],
      },
    },
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
    // All components are shadcn now — wrap every story in the shadcn provider.
    (Story, context) => {
      const themeMode = (context.globals?.theme as 'light' | 'dark') || 'light'
      return (
        <ShadcnProvider dark={themeMode === 'dark'}>
          <Story />
        </ShadcnProvider>
      )
    },
    ThemeSyncDecorator,
  ],
}

export default preview
