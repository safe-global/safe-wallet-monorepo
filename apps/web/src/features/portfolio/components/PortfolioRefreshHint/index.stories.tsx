import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import PortfolioRefreshHint from './index'
import { toBeHex } from 'ethers'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { TOKEN_LISTS } from '@/store/settingsSlice'

const SAFE_ADDRESS = toBeHex('0x1234', 20)

const baseInitialState = {
  settings: {
    currency: 'usd',
    hiddenTokens: {},
    shortName: { copy: true, qr: true },
    theme: {},
    env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
    signing: { onChainSigning: false, blindSigning: false },
    transactionExecution: true,
    tokenList: TOKEN_LISTS.TRUSTED,
  },
  safeInfo: {
    data: {
      address: { value: SAFE_ADDRESS },
      chainId: '1',
      deployed: true,
      owners: [{ value: SAFE_ADDRESS }],
      threshold: 1,
    },
    loading: false,
    loaded: true,
  },
  chains: {
    data: [
      {
        chainId: '1',
        features: [FEATURES.PORTFOLIO_ENDPOINT, FEATURES.POSITIONS],
      },
    ],
  },
}

const meta: Meta<typeof PortfolioRefreshHint> = {
  title: 'Features/Portfolio/PortfolioRefreshHint',
  component: PortfolioRefreshHint,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Component that displays when portfolio data was last updated and provides a refresh button. The refresh button is disabled for 30s after the last successful fetch.',
      },
    },
  },
  decorators: [
    (Story) => (
      <StoreDecorator initialState={baseInitialState}>
        <Paper sx={{ padding: 4 }}>
          <Story />
        </Paper>
      </StoreDecorator>
    ),
  ],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof PortfolioRefreshHint>

/**
 * Default state showing "Last update 5s ago" with refresh button on cooldown.
 */
export const Default: Story = {
  render: () => <PortfolioRefreshHint _fulfilledTimeStamp={Date.now() - 5000} _isFetching={false} />,
}

/**
 * Loading state when data hasn't been fetched yet (no fulfilledTimeStamp).
 */
export const Loading: Story = {
  render: () => <PortfolioRefreshHint _fulfilledTimeStamp={undefined} _isFetching={false} />,
}

/**
 * Fetching state - shows "Fetching data" with spinner, button disabled.
 */
export const Fetching: Story = {
  render: () => <PortfolioRefreshHint _fulfilledTimeStamp={Date.now() - 45000} _isFetching={true} />,
}

/**
 * On cooldown - button disabled because data was refreshed within 30s.
 */
export const OnCooldown: Story = {
  render: () => <PortfolioRefreshHint _fulfilledTimeStamp={Date.now() - 10000} _isFetching={false} _freezeTime />,
}

/**
 * Minutes format - showing "Last update Xm ago".
 */
export const MinutesAgo: Story = {
  render: () => <PortfolioRefreshHint _fulfilledTimeStamp={Date.now() - 120000} _isFetching={false} />,
}

/**
 * Hours format - showing "Last update Xh ago".
 */
export const HoursAgo: Story = {
  render: () => <PortfolioRefreshHint _fulfilledTimeStamp={Date.now() - 10800000} _isFetching={false} />,
}

/**
 * Days format - showing "Last update Xd ago".
 */
export const DaysAgo: Story = {
  render: () => <PortfolioRefreshHint _fulfilledTimeStamp={Date.now() - 86400000} _isFetching={false} />,
}
