import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory, getFixtureData } from '@/stories/mocks'
import { AddressBookSourceProvider } from '@/components/common/AddressBookSourceProvider'
import { OwnerList } from './index'

// Realistic-looking owner addresses for stories
const MOCK_OWNER_ADDRESSES = [
  '0x1234567890abcdef1234567890abcdef12345678',
  '0xabcdef1234567890abcdef1234567890abcdef12',
  '0x9876543210fedcba9876543210fedcba98765432',
  '0xdeadbeef1234567890abcdef1234567890abcdef',
  '0xcafebabe9876543210fedcba9876543210fedcba',
  '0xfaceb00c1234567890abcdef1234567890abcdef',
  '0xb0bacafe9876543210fedcba9876543210fedcba',
]

// Create safe data with different owner counts
const createSafeWithOwners = (ownerCount: number, threshold: number = 2) => {
  const { safeData } = getFixtureData('efSafe')
  const owners = Array.from({ length: ownerCount }, (_, i) => ({
    value: MOCK_OWNER_ADDRESSES[i] || `0x${(i + 1).toString(16).padStart(40, 'a')}`,
    name: null,
  }))

  return {
    ...safeData,
    owners,
    threshold: Math.min(threshold, ownerCount),
  }
}

// Address book entries for named owners (regular names)
const createAddressBook = (owners: Array<{ value: string; name?: string | null }>, chainId: string = '1') => {
  const book: Record<string, string> = {}
  owners.forEach((owner, i) => {
    if (i < 3) {
      book[owner.value] = ['Alice', 'Bob', 'Charlie'][i]
    }
  })
  return { [chainId]: book }
}

// Address book entries with ENS-style names
const createEnsAddressBook = (owners: Array<{ value: string; name?: string | null }>, chainId: string = '1') => {
  const book: Record<string, string> = {}
  const ensNames = ['vitalik.eth', 'safe.eth', 'alice.eth', 'bob.eth', 'charlie.eth']
  owners.forEach((owner, i) => {
    if (i < ensNames.length) {
      book[owner.value] = ensNames[i]
    }
  })
  return { [chainId]: book }
}

// Mixed address book with some ENS, some regular names, some unnamed
const createMixedAddressBook = (owners: Array<{ value: string; name?: string | null }>, chainId: string = '1') => {
  const book: Record<string, string> = {}
  if (owners[0]) book[owners[0].value] = 'vitalik.eth'
  if (owners[1]) book[owners[1].value] = 'Treasury Wallet'
  if (owners[3]) book[owners[3].value] = 'safe-team.eth'
  return { [chainId]: book }
}

// Wrapper to add AddressBookSourceProvider
const WithAddressBookProvider = ({ children }: { children: React.ReactNode }) => (
  <AddressBookSourceProvider source="localOnly">{children}</AddressBookSourceProvider>
)

const { safeData: defaultSafeData } = getFixtureData('efSafe')
const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  layout: 'paper',

  store: {
    addressBook: createAddressBook(defaultSafeData.owners),
  },
})

const meta = {
  title: 'Settings/OwnerList',
  component: OwnerList,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
  decorators: [
    (Story) => (
      <WithAddressBookProvider>
        <Story />
      </WithAddressBookProvider>
    ),
    defaultSetup.decorator,
  ],
} satisfies Meta<typeof OwnerList>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default OwnerList showing the EF Safe owners.
 * Connected wallet is an owner, so action buttons are enabled.
 */
export const Default: Story = {}

/**
 * Safe with 2 owners (2-of-2 multisig).
 * Shows remove button for both owners.
 */
export const TwoOwners: Story = (() => {
  const safeData = createSafeWithOwners(2, 2)
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',

    store: {
      safeInfo: {
        data: { ...safeData, deployed: true },
        loading: false,
        loaded: true,
      },
      addressBook: createAddressBook(safeData.owners),
    },
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [
      (Story) => (
        <WithAddressBookProvider>
          <Story />
        </WithAddressBookProvider>
      ),
      setup.decorator,
    ],
  }
})()

/**
 * Safe with a single owner (1-of-1).
 * Remove button is hidden since there must be at least one owner.
 */
export const SingleOwner: Story = (() => {
  const safeData = createSafeWithOwners(1, 1)
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',

    store: {
      safeInfo: {
        data: { ...safeData, deployed: true },
        loading: false,
        loaded: true,
      },
      addressBook: createAddressBook(safeData.owners),
    },
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [
      (Story) => (
        <WithAddressBookProvider>
          <Story />
        </WithAddressBookProvider>
      ),
      setup.decorator,
    ],
  }
})()

/**
 * Safe with many owners (5-of-7 multisig).
 * Tests list rendering with larger owner counts.
 */
export const ManyOwners: Story = (() => {
  const safeData = createSafeWithOwners(7, 5)
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',

    store: {
      safeInfo: {
        data: { ...safeData, deployed: true },
        loading: false,
        loaded: true,
      },
      addressBook: createAddressBook(safeData.owners),
    },
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [
      (Story) => (
        <WithAddressBookProvider>
          <Story />
        </WithAddressBookProvider>
      ),
      setup.decorator,
    ],
  }
})()

/**
 * View as non-owner.
 * Action buttons are disabled when not connected as an owner.
 */
export const NonOwnerView: Story = (() => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'nonOwner',
    layout: 'paper',

    store: {
      addressBook: createAddressBook(defaultSafeData.owners),
    },
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [
      (Story) => (
        <WithAddressBookProvider>
          <Story />
        </WithAddressBookProvider>
      ),
      setup.decorator,
    ],
  }
})()

/**
 * Owners with ENS-style names from address book.
 * Shows how owners display when they have .eth domain names saved.
 */
export const WithEnsNames: Story = (() => {
  const safeData = createSafeWithOwners(4, 3)
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',

    store: {
      safeInfo: {
        data: { ...safeData, deployed: true },
        loading: false,
        loaded: true,
      },
      addressBook: createEnsAddressBook(safeData.owners),
    },
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [
      (Story) => (
        <WithAddressBookProvider>
          <Story />
        </WithAddressBookProvider>
      ),
      setup.decorator,
    ],
  }
})()

/**
 * Mixed display: some owners with ENS names, some with regular names, some with just addresses.
 * Demonstrates typical real-world scenario with partial address book coverage.
 */
export const MixedAddressBook: Story = (() => {
  const safeData = createSafeWithOwners(5, 3)
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    layout: 'paper',

    store: {
      safeInfo: {
        data: { ...safeData, deployed: true },
        loading: false,
        loaded: true,
      },
      addressBook: createMixedAddressBook(safeData.owners),
    },
  })
  return {
    parameters: { ...setup.parameters },
    decorators: [
      (Story) => (
        <WithAddressBookProvider>
          <Story />
        </WithAddressBookProvider>
      ),
      setup.decorator,
    ],
  }
})()
