import type { Preview } from '@storybook/react'
import type { ReactRenderer } from '@storybook/react'
import { useEffect } from 'react'

import { ThemeProvider, CssBaseline } from '@mui/material'
import { withThemeFromJSXProvider } from '@storybook/addon-themes'
import createSafeTheme from '../src/components/theme/safeTheme'

import '../src/styles/globals.css'

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
    withThemeFromJSXProvider<ReactRenderer>({
      GlobalStyles: CssBaseline,
      Provider: ThemeProvider,
      themes: {
        light: createSafeTheme('light'),
        dark: createSafeTheme('dark'),
      },
      defaultTheme: 'light',
    }),
    // Ensure data-theme attribute is set on the HTML element to override prefers-color-scheme
    (Story, context) => {
      useEffect(() => {
        const theme = context.globals.theme || 'light'
        document.documentElement.setAttribute('data-theme', theme)
      }, [context.globals.theme])

      return Story()
    },
  ],
}

export default preview
