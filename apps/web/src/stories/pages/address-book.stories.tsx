import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import AddressBook from '@/pages/address-book'

/**
 * Address Book page - manages saved addresses for quick access.
 * Allows users to save, edit, and remove frequently used addresses.
 */

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'fullPage',
  pathname: '/address-book',
})

const meta = {
  title: 'Pages/Core/AddressBook',
  component: AddressBook,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof AddressBook>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
