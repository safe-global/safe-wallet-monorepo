import type { Meta, StoryObj } from '@storybook/react'
import type { ReactNode } from 'react'
import { http, HttpResponse, delay, type RequestHandler } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import type { GetSpaceSafeResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { MOCK_SPACE_ID, createMockStory } from '@/stories/mocks'
import { SectionVisibilityProvider } from '@safe-global/views/features/global-search/components/SearchSection/SectionVisibilityContext'
import AccountsSection from './AccountsSection'

const SPACE_SAFES_URL = /\/v1\/spaces\/[\w-]+\/safes$/

// A spread of Safes across chains so the search filter (address / name / chain) has something to match.
const populatedSafes: GetSpaceSafeResponse = {
  safes: {
    '1': ['0x9fC3dc011b461664c835F2527fffb1169b3C213e', '0x220866b1a2219f40e72f5c628b65d54268ca3a9d'],
    '11155111': ['0x8675B754342754A30A2AeF474D114d8460bca19b'],
  },
}

const setup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/home',
  query: { spaceId: MOCK_SPACE_ID },
  shadcn: true,
})

// First: the Spaces defaults answer /safes with an empty list, and MSW is first-match-wins.
const withSpaceSafes = (spaceSafesHandler: RequestHandler) => ({
  msw: { handlers: [spaceSafesHandler, ...setup.handlers] },
})

const withSectionVisibility = (children: ReactNode) => <SectionVisibilityProvider>{children}</SectionVisibilityProvider>

const meta = {
  title: 'Features/GlobalSearch/AccountsSection',
  component: AccountsSection,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    ...setup.parameters,
    ...withSpaceSafes(http.get(SPACE_SAFES_URL, () => HttpResponse.json(populatedSafes))),
  },
  decorators: [(Story) => withSectionVisibility(<Story />), setup.decorator],
  args: {
    label: 'Safe accounts',
    query: '',
  },
} satisfies Meta<typeof AccountsSection>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Populated list — every Safe in the Space is shown when the query is empty.
 */
export const Populated: Story = {}

/**
 * Filtered by a query that matches a subset of the Safes by chain name.
 */
export const FilteredByQuery: Story = {
  args: {
    query: 'sepolia',
  },
}

/**
 * Loading state — the skeleton placeholders shown while the Space Safes request is in flight.
 */
export const Loading: Story = {
  parameters: withSpaceSafes(
    http.get(SPACE_SAFES_URL, async () => {
      await delay('infinite')
      return HttpResponse.json(populatedSafes)
    }),
  ),
}

/**
 * No matching Safes — the section renders nothing (returns null) when the query filters everything out.
 * A short caption is added so the empty slot is obvious in Storybook.
 */
export const NoResults: Story = {
  args: {
    query: 'zzz-no-such-safe',
  },
  decorators: [
    (Story) => (
      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground">Nothing matches the query — the section renders nothing.</p>
        <Story />
      </div>
    ),
  ],
}
