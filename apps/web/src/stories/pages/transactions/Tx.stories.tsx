import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { http, HttpResponse } from 'msw'
import { createMockStory } from '@/stories/mocks/createMockStory'
import { createMockTransactionDetails, getFixtureData } from '@/stories/mocks/handlers'
import {
  HIDDEN_STORY_NOTE,
  STORY_NOTES,
  withPrivateNotes,
} from '@/features/tx-notes/public/services/privateNotesStoryData'
import TxDetail from '@/pages/transactions/tx'

/**
 * Transaction Detail page - displays a specific transaction.
 * Shows transaction data, confirmations, and execution status.
 */

const meta = {
  title: 'Pages/Core/Transactions/Detail',
  component: TxDetail,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TxDetail>

export default meta
type Story = StoryObj<typeof meta>

// The tx detail page reads the transaction id from the router query and fetches its details.
// The default `txDetailsHandler` (see stories/mocks/handlers) returns a mock for any id: an id containing
// "abc1" yields an awaiting ERC-20 transfer, one containing "exec1" the same transfer executed.
const txDetailStory = (id: string): Story => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'fullPage',
    pathname: '/transactions/tx',
    query: { id },
  })
  return { parameters: { ...setup.parameters }, decorators: [setup.decorator] }
}

export const Default: Story = txDetailStory('multisig_0x1234_0xabc1')

export const Executed: Story = txDetailStory('multisig_0x1234_0xexec1')

// Prototype: private notes. The note sits above the transaction data, for Workspace members only.
const QUEUED_ID = 'multisig_0x1234_0xabc1'
const EXECUTED_ID = 'multisig_0x1234_0xexec1'

const withNote = (story: Story, decorator: ReturnType<typeof withPrivateNotes>): Story => ({
  ...story,
  decorators: [decorator, ...(Array.isArray(story.decorators) ? story.decorators : [])],
})

/** A member of the Workspace reads the proposer's note before signing */
export const PrivateNote: Story = withNote(
  txDetailStory(QUEUED_ID),
  withPrivateNotes(() => ({ notes: { [QUEUED_ID]: STORY_NOTES.invoice() } })),
)

/** The limit, 280 characters */
export const PrivateNoteLong: Story = withNote(
  txDetailStory(QUEUED_ID),
  withPrivateNotes(() => ({ notes: { [QUEUED_ID]: STORY_NOTES.long() } })),
)

/** The note stays on the transaction after it executes */
export const PrivateNoteExecuted: Story = withNote(
  txDetailStory(EXECUTED_ID),
  withPrivateNotes(() => ({ notes: { [EXECUTED_ID]: STORY_NOTES.invoice() } })),
)

/** After a downgrade or the end of a trial: the note is kept, members cannot read it */
export const PrivateNoteHidden: Story = withNote(
  txDetailStory(QUEUED_ID),
  withPrivateNotes({ notes: { [QUEUED_ID]: HIDDEN_STORY_NOTE } }),
)

/** A signer outside the Workspace: no note, and nothing that says one exists. Same as Default. */
export const PrivateNoteNonMember: Story = txDetailStory(QUEUED_ID)

const publicNoteStory = (): Story => {
  const story = txDetailStory(QUEUED_ID)
  const { safeData } = getFixtureData('efSafe')
  const handler = http.get(/\/v1\/chains\/\d+\/transactions\//, () =>
    HttpResponse.json({
      ...createMockTransactionDetails(safeData, QUEUED_ID),
      note: 'Monthly contributor payroll, batch 2 of 3',
    }),
  )
  const handlers = story.parameters?.msw?.handlers ?? []
  return { ...story, parameters: { ...story.parameters, msw: { handlers: [handler, ...handlers] } } }
}

/** A note written before private notes: still readable, labelled public */
export const PublicNote: Story = publicNoteStory()
