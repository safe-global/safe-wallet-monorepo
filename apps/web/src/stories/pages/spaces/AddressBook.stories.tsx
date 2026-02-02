import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
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
