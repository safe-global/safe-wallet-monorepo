import type { Preview } from '@storybook/react-vite'
import React, { useEffect } from 'react'

// Brand vars + semantic tokens + the scoped preflight — the exact stylesheet the apps load.
import '../src/styles/index.css'
import { ShadcnProvider } from '../src/components/ShadcnProvider'

/**
 * Canvas colours mirror the card/paper surface components actually sit on
 * (`--color-background-paper`): light #fff, dark #1c1c1c. Transparent controls (the default
 * Input, a ghost Button) rely on this paper fill to be visible; the muted page background
 * (`--color-background-main`) belongs to full-page stories, which live in the app Storybook.
 */
const BACKGROUND_COLORS: Record<string, string> = { light: '#ffffff', dark: '#1c1c1c' }

/** Keeps `data-theme` (read by the brand vars) in step with the toolbar's theme switcher. */
const ThemeSyncDecorator = (
  Story: React.ComponentType,
  context: { globals?: { theme?: string }; parameters?: { layout?: string } },
) => {
  const themeMode = context.globals?.theme || 'light'
  const backgroundColor = BACKGROUND_COLORS[themeMode] || BACKGROUND_COLORS.light
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

/** Safe{Wallet} viewport presets, matching the app Storybook so widths are comparable. */
const SAFE_VIEWPORTS = {
  mobile: { name: 'Mobile', styles: { width: '375px', height: '667px' }, type: 'mobile' as const },
  tablet: { name: 'Tablet', styles: { width: '768px', height: '1024px' }, type: 'tablet' as const },
  desktop: { name: 'Desktop', styles: { width: '1280px', height: '800px' }, type: 'desktop' as const },
  desktopWide: { name: 'Desktop Wide', styles: { width: '1920px', height: '1080px' }, type: 'desktop' as const },
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
        method: 'alphabetical',
        order: [
          // The designer-facing reading order: what the tokens are, then the curated showcase,
          // then the exhaustive per-component references.
          'Foundations',
          ['Overview', 'Colour', 'Typography', 'Spacing & radius'],
          'Design System',
          ['Overview', 'Buttons', 'Text Fields', 'Dropdowns', 'Search', 'Tables', 'Cards', 'Tabs', 'Dialog', 'Tooltip'],
          'Presets',
          'UI',
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

  decorators: [
    // Every design-system component must render inside a `.shadcn-scope` — the tokens are not
    // defined on `:root`. This mirrors what AppProviders does in the app.
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
