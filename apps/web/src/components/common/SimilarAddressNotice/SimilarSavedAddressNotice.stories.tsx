import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { SimilarSavedAddressNotice } from '.'

const SAVED_ADDRESS = '0x7a3F9effb3CBa71e009951eDcA8008bFb52B9C2E'
const ENTERED_ADDRESS = '0x7A3F2aaF834BE71EcD2d5180e017218939e49C2E'

const setup = createMockStory({ scenario: 'efSafe' })

const meta = {
  title: 'Features/AntiAddressPoisoning/SimilarSavedAddressNotice',
  component: SimilarSavedAddressNotice,
  parameters: { layout: 'padded', ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta<typeof SimilarSavedAddressNotice>

export default meta
type Story = StoryObj<typeof meta>

export const AddressBookContact: Story = {
  args: {
    subject: 'This address',
    enteredAddress: ENTERED_ADDRESS,
    similar: { address: SAVED_ADDRESS, name: 'Treasury', source: 'addressBook' },
  },
}

export const UnnamedSafeInAccounts: Story = {
  args: {
    subject: 'This Safe account',
    enteredAddress: ENTERED_ADDRESS,
    similar: { address: SAVED_ADDRESS, source: 'accounts' },
  },
}
