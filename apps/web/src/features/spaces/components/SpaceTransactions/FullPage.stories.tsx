import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { createMockStory } from '@/stories/mocks/createMockStory'
import {
  HIDDEN_STORY_NOTE,
  STORY_NOTES,
  withPrivateNotes,
} from '@/features/tx-notes/public/services/privateNotesStoryData'
import SpaceTransactionsPage from './Page'
import { QUEUE_SECTIONS, SPACE_QUEUE_URL, TX_DETAILS_HANDLER, toQueuePage } from './SpaceTransactionQueue.storyData'

const SPACE_ID = '1'

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  authenticated: true,
  pathname: '/spaces/transactions',
  query: { spaceId: SPACE_ID },
  layout: 'fullPage',
  handlers: [http.get(SPACE_QUEUE_URL, () => HttpResponse.json(toQueuePage(QUEUE_SECTIONS)))],
})

// Prototype: the Workspace queue with private notes, in the app's full page with its sidebar.
const meta = {
  title: 'Pages/Spaces/Transactions',
  component: SpaceTransactionsPage,
  args: { spaceId: SPACE_ID },
  parameters: { layout: 'fullscreen', ...setup.parameters, msw: { handlers: [TX_DETAILS_HANDLER, ...setup.handlers] } },
  decorators: [setup.decorator],
} satisfies Meta<typeof SpaceTransactionsPage>

export default meta
type Story = StoryObj<typeof meta>

const NOTED = ['a-1-56', 'a-1-57a', 'b-1-4']

/** Three of five transactions carry a note */
export const PrivateNotes: Story = {
  decorators: [
    withPrivateNotes(() => ({
      notes: { [NOTED[0]]: STORY_NOTES.invoice(), [NOTED[1]]: STORY_NOTES.pressure(), [NOTED[2]]: STORY_NOTES.long() },
    })),
  ],
}

/** After a downgrade or the end of a trial: the notes are kept, members cannot read them */
export const PrivateNotesHidden: Story = {
  decorators: [withPrivateNotes({ notes: Object.fromEntries(NOTED.map((txId) => [txId, HIDDEN_STORY_NOTE])) })],
}
