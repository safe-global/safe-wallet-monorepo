import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory, getFixtureData } from '@/stories/mocks'
import ReplaceOwnerFlow from './index'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', shadcn: true })

const { safeData } = getFixtureData('efSafe')

const meta = {
  title: 'Components/TxFlow/ReplaceOwner',
  component: ReplaceOwnerFlow,
  decorators: [setup.decorator],
  parameters: { layout: 'fullscreen', ...setup.parameters },
} satisfies Meta<typeof ReplaceOwnerFlow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { address: safeData.owners[0].value },
}
