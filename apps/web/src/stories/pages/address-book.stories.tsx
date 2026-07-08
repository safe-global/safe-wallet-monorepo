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
  store: {
    // Seed entries so the table, search, and row actions actually render
    addressBook: {
      '1': {
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045': 'Vitalik',
        '0x8675B754342754A30A2AeF474D114d8460bca19b': 'Treasury Safe',
        '0x1234567890123456789012345678901234567890': 'Payroll',
        '0x9fC3dc011b461664c835F2527fffb1169b3C213e': 'Grants Safe',
      },
    },
  },
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
