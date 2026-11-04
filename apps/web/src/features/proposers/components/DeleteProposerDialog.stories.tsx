import type { Meta, StoryObj } from '@storybook/react'
import { userEvent, within } from 'storybook/test'
import { safeFixtures } from '@safe-global/test/msw/fixtures'
import { createMockStory } from '@/stories/mocks'
import DeleteProposerDialog from './DeleteProposerDialog'

const efSafe = safeFixtures.efSafe

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', shadcn: true, pathname: '/settings/setup' })

const meta = {
  title: 'Features/Proposers/DeleteProposerDialog',
  component: DeleteProposerDialog,
  args: {
    proposer: {
      safe: efSafe.address.value,
      delegate: '0x8B2f79E2A9e9C61C71e5eE9152dEa9A05b23e340',
      delegator: efSafe.owners[0].value,
      label: 'Proposer',
    },
  },
  parameters: {
    layout: 'centered',
    ...setup.parameters,
  },
  decorators: [setup.decorator],
} satisfies Meta<typeof DeleteProposerDialog>

export default meta

type Story = StoryObj<typeof meta>

/** The signer who created the proposer can delete it. */
export const Default: Story = {}

/** Only the proposer itself or the signer who created it may delete it. */
export const CreatedBySomeoneElse: Story = {
  args: {
    proposer: { ...meta.args.proposer, delegator: efSafe.owners[1].value },
  },
}

/** The confirmation the creator signs to delete the proposer. */
export const Confirm: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.click(await within(canvasElement).findByTestId('delete-proposer-btn'))
  },
}
