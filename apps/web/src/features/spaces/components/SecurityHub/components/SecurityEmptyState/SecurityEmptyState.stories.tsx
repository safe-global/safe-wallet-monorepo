import type { Meta, StoryObj } from '@storybook/react'
import SecurityEmptyState from './SecurityEmptyState'
import { createMockStory } from '@/stories/mocks'

const setup = createMockStory({ features: { spaces: true }, layout: 'paper', shadcn: true })

const meta = {
  title: 'Features/SecurityHub/SecurityEmptyState',
  tags: ['autodocs', 'skip-visual-test'],
  component: SecurityEmptyState,
  decorators: [setup.decorator],
  parameters: {
    ...setup.parameters,
  },
} satisfies Meta<typeof SecurityEmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
