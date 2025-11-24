import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import HnSignupIntro from './HnSignupIntro'

const meta = {
  component: HnSignupIntro,
  title: 'Features/Hypernative/HnSignupIntro',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <Story />
      </StoreDecorator>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The intro step of the Hypernative Guardian signup flow. Supports both light and dark modes. Use the theme switcher in the toolbar to toggle between themes.',
      },
    },
  },
} satisfies Meta<typeof HnSignupIntro>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    onGetStarted: () => console.log('Get started clicked'),
    onClose: () => console.log('Close clicked'),
  },
}
