import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import AddAddressBookOnboarding from '.'

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/welcome/address-book',
})

const meta = {
  title: 'Pages/Onboarding/AddAddressBook',
  component: AddAddressBookOnboarding,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
} satisfies Meta<typeof AddAddressBookOnboarding>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
