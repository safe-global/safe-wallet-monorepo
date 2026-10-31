import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { http, HttpResponse } from 'msw'
import { within } from 'storybook/test'
import type { SpaceAddressBookDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { createMockStory } from '@/stories/mocks'
import { MOCK_SPACE_ID } from '@/stories/mocks/ids'
import SpaceAddressBook from '@/pages/spaces/address-book'

/**
 * Space Address Book page - shared address book for a Space.
 * Collaborative address management within a Space.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  layout: 'fullPage',
  pathname: '/spaces/address-book',
  features: { spaces: true },
  query: { spaceId: '1' },
})

const meta = {
  title: 'Pages/Spaces/AddressBook',
  component: SpaceAddressBook,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof SpaceAddressBook>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

const contact = (name: string, address: string, chainIds: string[]) => ({
  name,
  address,
  chainIds,
  tagIds: [],
  createdBy: 'alice@example.com',
  createdByUserId: 1,
  lastUpdatedBy: 'alice@example.com',
  lastUpdatedByUserId: 1,
  createdAt: '2026-01-15T10:00:00.000Z',
  updatedAt: '2026-01-15T10:00:00.000Z',
})

const addressBook: SpaceAddressBookDto = {
  spaceUuid: MOCK_SPACE_ID,
  tags: [],
  data: [
    contact('Treasury', '0xA77DE01e157f9f57C7c4A326eeEaf0BDD2CFcD01', ['1', '137']),
    contact('Payroll', '0xB63F3D0a4a7eFd1d0c08A9ef17C5e5d3DbBDE867', ['1']),
    contact('Exchange deposit', '0x5eD8Cee6b63b1c6AFce3AD7c92f4fD7E1B8fAd9F', ['1']),
  ],
}

const spaceAddressBookHandler = http.get(/\/v1\/spaces\/[^/]+\/address-book$/, () => HttpResponse.json(addressBook))

export const WithContacts: Story = {
  parameters: { msw: { handlers: [spaceAddressBookHandler, ...defaultSetup.handlers] } },
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Treasury', undefined, { timeout: 10_000 })
  },
}
