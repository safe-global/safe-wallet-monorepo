import type { Preview, ReactRenderer } from '@storybook/react-vite'
import { withThemeByClassName } from '@storybook/addon-themes'
import './storybook.css'

const preview: Preview = {
  decorators: [
    withThemeByClassName<ReactRenderer>({
      themes: { light: '', dark: 'dark' },
      defaultTheme: 'light',
    }),
  ],
  parameters: {
    options: {
      storySort: { order: ['UI'] },
    },
  },
}

export default preview
