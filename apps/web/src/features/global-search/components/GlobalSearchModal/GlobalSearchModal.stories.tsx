import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { expect, userEvent, within } from 'storybook/test'
import { createMockStory } from '@/stories/mocks'
import GlobalSearchModal from './GlobalSearchModal'

// GlobalSearchModal is driven entirely by Redux + the Next router: it renders
// nothing unless `globalSearch.open` is true, and its content (SearchSection)
// reads the connected Safe, chain features and route. Every story therefore
// forces the modal open via the store and uses the mock app-context harness.
// The Dialog renders through a portal owned by ShadcnProvider, so `shadcn: true`
// is required for it to mount.
const openStore = { globalSearch: { open: true } }

// Safe-level context: the modal shows the search input, the always-on
// "Navigate to" quick actions (Send / Swap / Transaction builder / Assets) and
// the "Trusted safes" section. A connected owner wallet keeps "Send" enabled.
const safeLevelSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'owner',
  pathname: '/home',
  store: openStore,
  shadcn: true,
})

// Space-level context: the "Safe accounts" section activates instead of
// "Trusted safes", exercising the other branch of the section visibility logic.
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
 * The search modal opened in a Safe context with an empty query. Shows the
 * search input, the "Navigate to" quick actions and the "Trusted safes"
 * section — every section renders its full contents.
 */
export const Open: Story = {
  decorators: [safeLevelSetup.decorator],
  parameters: {
    ...safeLevelSetup.parameters,
  },
}

/**
 * The search modal opened inside a Space, where the "Safe accounts" section is
 * active instead of "Trusted safes".
 */
export const InSpace: Story = {
  decorators: [spaceLevelSetup.decorator],
  parameters: {
    ...spaceLevelSetup.parameters,
  },
}

/**
 * Typing a query filters the results down to the matching navigation actions.
 * The modal manages its query state internally, so the play function types
 * into the search field. The Dialog renders in a portal, so queries run
 * against the whole document rather than the story canvas.
 */
export const WithQuery: Story = {
  decorators: [safeLevelSetup.decorator],
  parameters: {
    ...safeLevelSetup.parameters,
  },
  play: async () => {
    const screen = within(document.body)
    const input = await screen.findByRole('textbox', { name: 'Search' })
    await userEvent.type(input, 'swap')
    await expect(input).toHaveValue('swap')
  },
}
