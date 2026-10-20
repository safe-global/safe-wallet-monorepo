import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import ManageSignersFlow from './index'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', shadcn: true })

const meta = {
  title: 'Components/TxFlow/ManageSigners',
  component: ManageSignersFlow,
  decorators: [setup.decorator],
  parameters: { layout: 'fullscreen', ...setup.parameters },
} satisfies Meta<typeof ManageSignersFlow>

export default meta
type Story = StoryObj<typeof meta>

export const AddSigner: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByTestId('add-new-signer'))
  },
}
