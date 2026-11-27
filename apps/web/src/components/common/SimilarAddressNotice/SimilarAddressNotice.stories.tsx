import type { Meta, StoryObj } from '@storybook/react'
import { createMockStory } from '@/stories/mocks'
import { SimilarAddressNotice, SimilarAddressTooltip } from '.'

const SAVED_ADDRESS = '0x7a3F9effb3CBa71e009951eDcA8008bFb52B9C2E'
const ENTERED_ADDRESS = '0x7A3F2aaF834BE71EcD2d5180e017218939e49C2E'

const setup = createMockStory({ scenario: 'efSafe' })

const meta = {
  title: 'Features/AntiAddressPoisoning/SimilarAddressNotice',
  component: SimilarAddressNotice,
  parameters: { layout: 'padded', ...setup.parameters },
  decorators: [setup.decorator],
} satisfies Meta<typeof SimilarAddressNotice>

export default meta
type Story = StoryObj<typeof meta>

/** Hover the name to compare the entered address with the saved one. */
export const AddressBookContact: Story = {
  args: {
    children: (
      <>
        This address is similar to{' '}
        <SimilarAddressTooltip name="Treasury" savedAddress={SAVED_ADDRESS} enteredAddress={ENTERED_ADDRESS} /> in your
        address book.
      </>
    ),
  },
}

export const SafeAccount: Story = {
  args: {
    children: (
      <>
        This Safe account is similar to{' '}
        <SimilarAddressTooltip name="Treasury Safe" savedAddress={SAVED_ADDRESS} enteredAddress={ENTERED_ADDRESS} /> in
        your accounts.
      </>
    ),
  },
}

export const CsvImport: Story = {
  args: {
    children: '3 addresses in this file look similar to other addresses.',
  },
}
