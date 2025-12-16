import type { Meta, StoryObj } from '@storybook/react'
import { StoreDecorator } from '@/stories/storeDecorator'
import HnSignupFlow from './HnSignupFlow'

const meta = {
  component: HnSignupFlow,
  title: 'Features/Hypernative/HnSignupFlow',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <StoreDecorator initialState={{}}>
        <Story />
      </StoreDecorator>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Complete multi-step signup flow for Hypernative Guardian. Features a stepper component for navigation (hidden on the intro step). Automatically adapts to light and dark themes. Use the theme switcher in the toolbar to toggle between themes.',
      },
    },
  },
} satisfies Meta<typeof HnSignupFlow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    open: true,
    onClose: () => console.log('Signup flow closed'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'The complete signup flow starting with the intro step. Click "Get started" to proceed to the next step.',
      },
    },
  },
}
