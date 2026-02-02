import type { Meta, StoryObj } from '@storybook/react'
import { mswLoader } from 'msw-storybook-addon'
import { createMockStory } from '@/stories/mocks'
import { safeAppsFixtures } from '../../../../../../config/test/msw/fixtures'
import SafeAppList from './index'
import { SAFE_APPS_LABELS } from '@/services/analytics'

// Get apps from fixtures for props
const getAppsForStory = (count: 'full' | 'few' | 'empty' = 'full') => {
  if (count === 'empty') return []
  if (count === 'few') return safeAppsFixtures.mainnet.slice(0, 8)
  return safeAppsFixtures.mainnet.slice(0, 12)
}

const defaultSetup = createMockStory({
  scenario: 'efSafe',
  wallet: 'disconnected',
  layout: 'paper',
})

const meta = {
  title: 'SafeApps/SafeAppList',
  component: SafeAppList,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    ...defaultSetup.parameters,
  },
  decorators: [defaultSetup.decorator],
  tags: ['autodocs'],
} satisfies Meta<typeof SafeAppList>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default SafeAppList showing popular apps from Ethereum mainnet.
 * Apps are displayed in a responsive grid with cards.
 */
export const Default: Story = {
  args: {
    safeAppsList: getAppsForStory('full'),
    title: 'All apps',
    eventLabel: SAFE_APPS_LABELS.apps_all,
    bookmarkedSafeAppsId: new Set([1, 2, 3]),
  },
}

/**
 * SafeAppList with fewer apps, showing the grid layout
 * with less content.
 */
export const FewApps: Story = {
  args: {
    safeAppsList: getAppsForStory('few'),
    title: 'Featured apps',
    eventLabel: SAFE_APPS_LABELS.apps_all,
    bookmarkedSafeAppsId: new Set([1]),
  },
}

/**
 * Empty state with no apps matching the filter.
 */
export const NoApps: Story = {
  args: {
    safeAppsList: [],
    title: 'Search results',
    query: 'nonexistent app name',
    eventLabel: SAFE_APPS_LABELS.apps_all,
  },
}

/**
 * Loading state showing skeleton placeholders.
 */
export const Loading: Story = {
  args: {
    safeAppsList: [],
    safeAppsListLoading: true,
    title: 'All apps',
    eventLabel: SAFE_APPS_LABELS.apps_all,
  },
}

/**
 * SafeAppList with custom app option enabled.
 * Shows "Add custom Safe App" card at the start.
 */
export const WithCustomAppOption: Story = {
  args: {
    safeAppsList: getAppsForStory('few'),
    title: 'Custom apps',
    eventLabel: SAFE_APPS_LABELS.apps_all,
    addCustomApp: () => console.log('Add custom app clicked'),
  },
}

/**
 * SafeAppList with bookmarked apps highlighted.
 */
export const WithBookmarkedApps: Story = {
  args: {
    safeAppsList: getAppsForStory('full'),
    title: 'Pinned apps',
    eventLabel: SAFE_APPS_LABELS.apps_all,
    bookmarkedSafeAppsId: new Set(
      getAppsForStory('full')
        .slice(0, 4)
        .map((app) => app.id),
    ),
  },
}

/**
 * Filtered list with search query applied.
 */
export const FilteredResults: Story = {
  args: {
    safeAppsList: getAppsForStory('full').filter((app) => app.name.toLowerCase().includes('swap')),
    title: 'Search results',
    query: 'swap',
    eventLabel: SAFE_APPS_LABELS.apps_all,
    isFiltered: true,
  },
}
