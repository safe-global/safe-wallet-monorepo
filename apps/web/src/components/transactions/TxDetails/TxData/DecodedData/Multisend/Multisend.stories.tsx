import type { Meta, StoryObj } from '@storybook/react'
import { faker } from '@faker-js/faker'
import { createMockStory } from '@/stories/mocks'
import { multiSendTxDataBuilder } from '@/tests/builders/dataDecoded'
import Multisend from '.'

faker.seed(1002)

const setup = createMockStory({ shadcn: true })

const meta = {
  title: 'Components/Transactions/Multisend',
  component: Multisend,
  decorators: [setup.decorator],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
  args: {
    txData: multiSendTxDataBuilder().build(),
  },
} satisfies Meta<typeof Multisend>

export default meta
type Story = StoryObj<typeof meta>

/** The Transaction Builder batch QA uses to cover all ABI types, collapsed. */
export const AllAbiTypes: Story = {}

export const AllAbiTypesExpanded: Story = {
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    await userEvent.click(within(canvasElement).getByTestId('expande-all-btn'))
  },
}

export const Compact: Story = {
  args: {
    compact: true,
  },
}
