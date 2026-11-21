import type { Meta, StoryObj } from '@storybook/react'
import { http, HttpResponse } from 'msw'
import { createMockStory } from '@/stories/mocks/createMockStory'
import SpaceTransactionsPage from './Page'
import {
  QUEUE_SECTIONS,
  SPACE_QUEUE_URL,
  toQueuePage,
  UNNAMED_COUNTERPARTY_SECTIONS,
} from './SpaceTransactionQueue.storyData'

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

const ADDRESS_BOOK_URL = /\/v1\/spaces\/[^/]+\/address-book$/

type SavedContact = { name: string; address: string; chainIds: string[] }

// Keeps what the form saves, so the refetch after it names the address in every row
const addressBookHandlers = () => {
  let contacts: SavedContact[] = []
  return [
    http.get(ADDRESS_BOOK_URL, () => HttpResponse.json({ spaceUuid: SPACE_ID, data: contacts, tags: [] })),
    http.put(ADDRESS_BOOK_URL, async ({ request }) => {
      const body = (await request.json()) as { items: SavedContact[] }
      contacts = [...contacts, ...body.items]
      return HttpResponse.json({ spaceUuid: SPACE_ID, data: contacts, tags: [] })
    }),
  ]
}

const unnamedSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  authenticated: true,
  pathname: '/spaces/transactions',
  query: { spaceId: SPACE_ID },
  layout: 'paper',
  shadcn: true,
  handlers: [http.get(SPACE_QUEUE_URL, () => HttpResponse.json(toQueuePage(UNNAMED_COUNTERPARTY_SECTIONS)))],
})

const meta = {
  title: 'Features/Spaces/Transactions/SpaceTransactionsPage',
  component: SpaceTransactionsPage,
  args: { spaceId: SPACE_ID },
  parameters: { ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta<typeof SpaceTransactionsPage>

export default meta
type Story = StoryObj<typeof meta>

/** The Workspace queue: two Safes, a conflict at nonce 57 on Ethereum and a second chain under the first Safe. */
export const Default: Story = {}

/** An admin sees "Add to address book" beside an address the Workspace address book doesn't name. */
export const UnnamedCounterparty: Story = {
  // First match wins, so these go before the default empty address book
  parameters: { ...unnamedSetup.parameters, msw: { handlers: [...addressBookHandlers(), ...unnamedSetup.handlers] } },
  decorators: [unnamedSetup.decorator],
}
