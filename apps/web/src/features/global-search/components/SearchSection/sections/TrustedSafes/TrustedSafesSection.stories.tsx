import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import type { AddedSafesState } from '@/store/addedSafesSlice'
import type { AddressBookState } from '@/store/addressBookSlice'
import { createMockStory } from '@/stories/mocks'
import { SectionVisibilityProvider } from '../../SectionVisibilityContext'
import TrustedSafesSection from './TrustedSafesSection'

const CHAIN_ID = '1'

const SAFE_A = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'
const SAFE_B = '0x220866b1a2219f40e72f5c628b65d54268ca3a9d'
const SAFE_C = '0x8675B754342754A30A2AeF474D114d8460bca19b'

// Pinned safes are derived from the addedSafes slice: any safe present here is
// treated as pinned by useAllSafes, which is what TrustedSafesSection renders.
const addedSafes: AddedSafesState = {
  [CHAIN_ID]: {
    [SAFE_A]: { owners: [{ value: SAFE_A }], threshold: 1 },
    [SAFE_B]: { owners: [{ value: SAFE_B }], threshold: 2 },
    [SAFE_C]: { owners: [{ value: SAFE_C }], threshold: 1 },
  },
}

// Friendly names shown on each card and used by the query filter.
const addressBook: AddressBookState = {
  [CHAIN_ID]: {
    [SAFE_A]: 'Treasury',
    [SAFE_B]: 'Payroll',
    [SAFE_C]: 'Grants',
  },
}

const setup = createMockStory({
  scenario: 'efSafe',
  shadcn: true,
  store: {
    addedSafes,
    addressBook,
  },
})

const meta = {
  title: 'Features/GlobalSearch/TrustedSafesSection',
  component: TrustedSafesSection,
  loaders: [mswLoader],
  decorators: [
    (Story) => (
      <SectionVisibilityProvider>
        <div style={{ maxWidth: 480 }}>
          <Story />
        </div>
      </SectionVisibilityProvider>
    ),
    setup.decorator,
  ],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
  },
  args: {
    label: 'Trusted safes',
    query: '',
  },
} satisfies Meta<typeof TrustedSafesSection>

export default meta

type Story = StoryObj<typeof meta>

/**
 * All pinned (trusted) safes are shown when the query is empty.
 */
export const Populated: Story = {}

/**
 * A query narrows the list to the safes whose name, address, or chain matches.
 * Here "pay" matches only the "Payroll" safe.
 */
export const FilteredByQuery: Story = {
  args: {
    query: 'pay',
  },
}

/**
 * When no pinned safe matches the query the section renders nothing at all
 * (it returns null), so the search results collapse gracefully.
 */
export const NoMatches: Story = {
  args: {
    query: 'no-such-safe',
  },
}
