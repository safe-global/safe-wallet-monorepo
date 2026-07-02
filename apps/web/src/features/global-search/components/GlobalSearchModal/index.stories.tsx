import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import GlobalSearchModal from './index'

// The modal is driven entirely by Redux + router context; it renders nothing
// unless `globalSearch.open` is true, so every story forces it open via the store.
const openStore = { globalSearch: { open: true } }

// Safe-level context: the modal shows the "Navigate to" actions (Send / Swap /
// Transaction builder / Assets) plus the "Trusted safes" section.
const safeLevelSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/home',
  store: openStore,
  shadcn: true,
})

// Space-level context: the "Accounts" section activates instead of "Trusted safes"
// and the last "Navigate to" item switches to "Accounts".
const spaceLevelSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  features: { spaces: true },
  pathname: '/spaces/settings',
  query: { spaceId: '1' },
  store: openStore,
  shadcn: true,
})

const meta = {
  title: 'Features/GlobalSearch/GlobalSearchModal',
  component: GlobalSearchModal,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof GlobalSearchModal>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The search modal opened in a Safe context. Shows the search input, the
 * "Navigate to" quick actions and the "Trusted safes" section.
 */
export const Open: Story = {
  decorators: [safeLevelSetup.decorator],
  parameters: {
    ...safeLevelSetup.parameters,
  },
}

/**
 * The search modal opened inside a Space, where the "Accounts" section is
 * active and the "Navigate to" list ends with an "Accounts" entry.
 */
export const InSpace: Story = {
  decorators: [spaceLevelSetup.decorator],
  parameters: {
    ...spaceLevelSetup.parameters,
  },
}
