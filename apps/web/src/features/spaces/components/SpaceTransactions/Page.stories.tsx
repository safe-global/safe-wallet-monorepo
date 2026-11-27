import type { Meta, StoryObj } from '@storybook/react'
import { delay, http, HttpResponse } from 'msw'
import { createMockStory } from '@/stories/mocks/createMockStory'
import SpaceTransactionsPage from './Page'
import { QUEUE_SECTIONS, SPACE_QUEUE_URL, TX_DETAILS_HANDLER, toQueuePage } from './SpaceTransactionQueue.storyData'
import {
  HIDDEN_STORY_NOTE,
  STORY_NOTES,
  withPrivateNotes,
} from '@/features/tx-notes/public/services/privateNotesStoryData'

const SPACE_ID = '1'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  authenticated: true,
  pathname: '/spaces/transactions',
  query: { spaceId: SPACE_ID },
  layout: 'paper',
  shadcn: true,
  handlers: [http.get(SPACE_QUEUE_URL, () => HttpResponse.json(toQueuePage(QUEUE_SECTIONS)))],
})

const meta = {
  title: 'Features/Spaces/Transactions/SpaceTransactionsPage',
  component: SpaceTransactionsPage,
  args: { spaceId: SPACE_ID },
  // Ahead of the defaults, which already answer every transaction details request
  parameters: { ...setup.parameters, msw: { handlers: [TX_DETAILS_HANDLER, ...setup.handlers] } },
  decorators: [setup.decorator],
} satisfies Meta<typeof SpaceTransactionsPage>

export default meta
type Story = StoryObj<typeof meta>

/** The Workspace queue: two Safes, a conflict at nonce 57 on Ethereum and a second chain under the first Safe. */
export const Default: Story = {}

/**
 * A search is loading: the last queue stays on screen, dimmed and inert, with an "Updating results…" status.
 * The searched queue never answers, so the screenshot holds this state.
 */
export const UpdatingResults: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get(SPACE_QUEUE_URL, async ({ request }) => {
          if (new URL(request.url).searchParams.has('search')) await delay('infinite')
          return HttpResponse.json(toQueuePage(QUEUE_SECTIONS))
        }),
        ...setup.handlers,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    const canvas = within(canvasElement)
    await canvas.findByTestId('space-queue-body', {}, { timeout: 5000 })
    await userEvent.type(canvas.getByRole('textbox', { name: 'Search transactions' }), 'treasury')
    await canvas.findByText('Updating results…', {}, { timeout: 3000 })
  },
}

// Prototype: private notes, by the table's width. Under 1050px a note's icon sits in Details; from 1050px it has a Note
// column; from 1880px the column shows the note's text. The note is always in the icon's tooltip.
const QUEUE_NOTES = () => ({
  'a-1-56': STORY_NOTES.invoice(),
  'a-1-57a': STORY_NOTES.pressure(),
  'b-1-4': STORY_NOTES.long(),
})

/** Three of five transactions carry a note */
export const PrivateNotes: Story = { decorators: [withPrivateNotes(() => ({ notes: QUEUE_NOTES() }))] }

/** The first note's tooltip, opened by hovering its icon */
export const PrivateNoteOpen: Story = {
  decorators: [withPrivateNotes(() => ({ notes: QUEUE_NOTES() }))],
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    const canvas = within(canvasElement)
    const [note] = await canvas.findAllByTestId('queue-note', {}, { timeout: 10000 })
    await userEvent.hover(note)
    await within(document.body).findByText('Private note · off-chain', {}, { timeout: 3000 })
  },
}

/**
 * Extra-wide: from a 1880px panel the Note column widens and shows the note's text, cut at two lines.
 * Needs a window about 1950px wide; narrower, it looks like PrivateNotes.
 */
export const PrivateNotesExtraWide: Story = {
  decorators: [withPrivateNotes(() => ({ notes: QUEUE_NOTES() }))],
  parameters: { viewport: { defaultViewport: 'responsive' } },
  tags: ['skip-visual-test'],
}

/** After a downgrade or the end of a trial: the notes are kept, members cannot read them */
export const PrivateNotesHidden: Story = {
  decorators: [
    withPrivateNotes({
      notes: { 'a-1-56': HIDDEN_STORY_NOTE, 'a-1-57a': HIDDEN_STORY_NOTE, 'b-1-4': HIDDEN_STORY_NOTE },
    }),
  ],
}
