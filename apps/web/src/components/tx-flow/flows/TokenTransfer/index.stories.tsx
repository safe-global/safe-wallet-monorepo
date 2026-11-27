import type { Meta, StoryObj } from '@storybook/react'
import { expect, waitFor, within } from 'storybook/test'
import { TokenType } from '@safe-global/store/gateway/types'
import { safeFormatUnits } from '@safe-global/utils/utils/formatters'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { createMockStory } from '@/stories/mocks/createMockStory'
import { getFixtureData } from '@/stories/mocks/handlers'
import { newRecipientAnalysisHandler } from '@/stories/mocks/handlers'
import TokenTransferFlow from './index'
import { withPrivateNotes } from '@/features/tx-notes/public/services/privateNotesStoryData'

const setup = createMockStory({ scenario: 'efSafe', wallet: 'owner', shadcn: true })

const RECIPIENT = '0x6a5602335a878ADDCa4BF63a050E34946B56B5bC'

const { balancesData } = getFixtureData('efSafe')

const ether = balancesData.items.find(({ tokenInfo }) => tokenInfo.type === TokenType.NATIVE_TOKEN)

const meta = {
  title: 'Components/TxFlow/TokenTransfer',
  component: TokenTransferFlow,
  decorators: [setup.decorator],
  parameters: {
    layout: 'fullscreen',
    ...setup.parameters,
    msw: { handlers: [newRecipientAnalysisHandler, ...setup.handlers] },
  },
} satisfies Meta<typeof TokenTransferFlow>

export default meta
type Story = StoryObj<typeof meta>

export const FilledWithMaxEther: Story = {
  args: {
    recipients: [
      {
        recipient: RECIPIENT,
        tokenAddress: ZERO_ADDRESS,
        amount: ether ? safeFormatUnits(ether.balance, ether.tokenInfo.decimals) : '',
      },
    ],
  },
  // The prefilled form validates after mount, and Safe Shield analyses the recipient:
  // wait for both results, not the interim disabled button or the loading skeleton
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const next = await canvas.findByRole('button', { name: 'Next' })
    await waitFor(() => expect(next).toBeEnabled())
    await canvas.findByText('New recipient')
    // Safe Shield keeps its skeleton row for 500ms after the first result
    await waitFor(() => expect(canvasElement.querySelector('[data-slot="skeleton"]')).toBeNull())
  },
}

// Prototype: private notes on the Review step, full screen. `initialStep` opens the flow there with the form filled.
const REVIEW_ARGS = {
  recipients: [{ recipient: RECIPIENT, tokenAddress: ZERO_ADDRESS, amount: '1' }],
  initialStep: 1,
}

const reviewStory = (...decorators: NonNullable<Story['decorators']>[]): Story => ({
  args: REVIEW_ARGS,
  decorators: decorators.flat(),
})

/** Signed in to a Workspace on Pro: the proposer can leave a private note */
export const ReviewPrivateNote: Story = reviewStory()

/** Two signers of the Safe are not members of the Workspace */
export const ReviewPrivateNoteOutsideSigners: Story = reviewStory(withPrivateNotes({ outsideSigners: 2 }))

/** Wallet connected, not signed in to the Workspace */
export const ReviewPrivateNoteSignedOut: Story = reviewStory(withPrivateNotes({ access: 'signedOut' }))

/** The Workspace's plan has no private notes */
export const ReviewPrivateNoteLocked: Story = reviewStory(withPrivateNotes({ access: 'lockedPlan' }))

/** The Safe is in no Workspace */
export const ReviewPrivateNoteNoWorkspace: Story = reviewStory(withPrivateNotes({ access: 'noWorkspace' }))
