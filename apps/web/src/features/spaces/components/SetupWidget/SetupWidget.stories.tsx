import type { Meta, StoryObj } from '@storybook/react'
import SetupWidget from './index'

const meta: Meta<typeof SetupWidget> = {
  title: 'Features/Spaces/SetupWidget',
  component: SetupWidget,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: 'var(--color-background-default, #f4f4f4)', padding: '2rem' }}>
        <div style={{ maxWidth: '560px' }}>
          <Story />
        </div>
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithDismissHandler: Story = {
  args: {
    onDismiss: () => console.log('Dismissed'),
  },
}
