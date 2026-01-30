import type { Meta, StoryObj } from '@storybook/react'
import React from 'react'
import { Paper } from '@mui/material'
import { http, HttpResponse } from 'msw'
import { mswLoader } from 'msw-storybook-addon'
import { StoreDecorator } from '@/stories/storeDecorator'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { safeFixtures, chainFixtures, safeAppsFixtures } from '../../../../../../config/test/msw/fixtures'
import SafeAppList from './index'
import { SAFE_APPS_LABELS } from '@/services/analytics'

// Create chain data without complex features
const createChainData = () => {
  const chainData = { ...chainFixtures.mainnet }
  chainData.features = chainData.features.filter(
    (f: string) => !['PORTFOLIO_ENDPOINT', 'POSITIONS', 'RECOVERY', 'HYPERNATIVE'].includes(f),
  )
  return chainData
}

// Create MSW handlers
const createHandlers = (appsCount: 'full' | 'few' | 'empty' = 'full') => {
  const chainData = createChainData()
  let appsData = safeAppsFixtures.mainnet

  if (appsCount === 'few') {
    appsData = safeAppsFixtures.mainnet.slice(0, 8)
  } else if (appsCount === 'empty') {
    appsData = []
  }

  return [
    // Chain config
    http.get(/\/v1\/chains\/\d+$/, () => HttpResponse.json(chainData)),
    http.get(/\/v1\/chains$/, () => HttpResponse.json({ ...chainFixtures.all, results: [chainData] })),
    // Safe info
    http.get(/\/v1\/chains\/\d+\/safes\/0x[a-fA-F0-9]+$/, () => HttpResponse.json(safeFixtures.efSafe)),
    // Safe Apps - the main data dependency
    http.get(/\/v1\/chains\/\d+\/safe-apps/, () => HttpResponse.json(appsData)),
  ]
}

// Get apps from fixtures for props
const getAppsForStory = (count: 'full' | 'few' | 'empty' = 'full') => {
  if (count === 'empty') return []
  if (count === 'few') return safeAppsFixtures.mainnet.slice(0, 8)
  return safeAppsFixtures.mainnet.slice(0, 12) // Show first 12 for default
}

const meta = {
  title: 'SafeApps/SafeAppList',
  component: SafeAppList,
  loaders: [mswLoader],
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: createHandlers('full'),
    },
  },
  decorators: [
    (Story, context) => {
      const isDarkMode = context.globals?.theme === 'dark'
      const safeData = { ...safeFixtures.efSafe, deployed: true }
      const chainData = createChainData()

      return (
        <StoreDecorator
          initialState={{
            safeInfo: {
              data: safeData,
              loading: false,
              loaded: true,
            },
            chains: {
              data: [chainData],
              loading: false,
            },
            settings: {
              currency: 'usd',
              hiddenTokens: {},
              tokenList: TOKEN_LISTS.ALL,
              shortName: { copy: true, qr: true },
              theme: { darkMode: isDarkMode },
              env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
              signing: { onChainSigning: false, blindSigning: false },
              transactionExecution: true,
            },
            safeApps: {
              pinned: [],
            },
          }}
        >
          <Paper sx={{ p: 3, minHeight: '100vh' }}>
            <Story />
          </Paper>
        </StoreDecorator>
      )
    },
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof SafeAppList>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Default SafeAppList showing popular apps from Ethereum mainnet.
 * Apps are displayed in a responsive grid with cards.
 */
export const Default: Story = {
  loaders: [mswLoader],
  args: {
    safeAppsList: getAppsForStory('full'),
    title: 'All apps',
    eventLabel: SAFE_APPS_LABELS.apps_all,
    bookmarkedSafeAppsId: new Set([1, 2, 3]), // Some apps are bookmarked
  },
}

/**
 * SafeAppList with fewer apps, showing the grid layout
 * with less content.
 */
export const FewApps: Story = {
  loaders: [mswLoader],
  args: {
    safeAppsList: getAppsForStory('few'),
    title: 'Featured apps',
    eventLabel: SAFE_APPS_LABELS.apps_all,
    bookmarkedSafeAppsId: new Set([1]),
  },
  parameters: {
    msw: {
      handlers: createHandlers('few'),
    },
  },
}

/**
 * Empty state with no apps matching the filter.
 */
export const NoApps: Story = {
  loaders: [mswLoader],
  args: {
    safeAppsList: [],
    title: 'Search results',
    query: 'nonexistent app name',
    eventLabel: SAFE_APPS_LABELS.apps_all,
  },
  parameters: {
    msw: {
      handlers: createHandlers('empty'),
    },
  },
}

/**
 * Loading state showing skeleton placeholders.
 */
export const Loading: Story = {
  loaders: [mswLoader],
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
  loaders: [mswLoader],
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
  loaders: [mswLoader],
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
  loaders: [mswLoader],
  args: {
    safeAppsList: getAppsForStory('full').filter((app) => app.name.toLowerCase().includes('swap')),
    title: 'Search results',
    query: 'swap',
    eventLabel: SAFE_APPS_LABELS.apps_all,
    isFiltered: true,
  },
}
