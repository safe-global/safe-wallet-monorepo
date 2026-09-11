import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import SearchSection from './SearchSection'

// SearchSection reads the connected Safe, Redux store, chain features and the
// Next router, so it needs the mock app-context harness. The default (non-space)
// scenario keeps the always-on "Navigate to" section visible; a connected wallet
// keeps the "Send" action enabled.
const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'connected',
  pathname: '/home',
  shadcn: true,
})

const meta = {
  title: 'Features/GlobalSearch/SearchSection',
  component: SearchSection,
  loaders: [mswLoader],
  parameters: {
    layout: 'padded',
    ...defaultSetup.parameters,
  },
  decorators: [
    defaultSetup.decorator,
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SearchSection>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Empty query — every section shows its full contents. The always-active
 * "Navigate to" section lists the available Safe-level actions.
 */
export const Default: Story = {
  args: {
    query: '',
  },
}

/**
 * A query that matches a navigation action, showing the filtered result set.
 */
export const WithQuery: Story = {
  args: {
    query: 'swap',
  },
}

/**
 * A query that matches nothing across all sections, showing the empty state.
 */
export const NoResults: Story = {
  args: {
    query: 'zzzznomatch',
  },
}
