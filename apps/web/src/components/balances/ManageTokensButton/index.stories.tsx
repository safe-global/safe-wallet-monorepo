import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import ManageTokensButton from './index'
import { TOKEN_LISTS } from '@/store/settingsSlice'
import { FEATURES } from '@safe-global/utils/utils/chains'

interface StoryArgs {
  hasDefaultTokenlist?: boolean
  hasPortfolioEndpoint?: boolean
  tokenList?: TOKEN_LISTS
  hiddenTokensCount?: number
  onHideTokens?: () => void
}

const meta: Meta<StoryArgs> = {
  title: 'Components/Balances/ManageTokensButton',
  component: ManageTokensButton,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story, context) => {
      const args = context.args as StoryArgs
      const hasDefaultTokenlist = args.hasDefaultTokenlist ?? true
      const hasPortfolioEndpoint = args.hasPortfolioEndpoint ?? false
      const tokenList = args.tokenList ?? TOKEN_LISTS.TRUSTED
      const hiddenTokensCount = args.hiddenTokensCount ?? 0

      const features: string[] = []
      if (hasDefaultTokenlist) features.push(FEATURES.DEFAULT_TOKENLIST)
      if (hasPortfolioEndpoint) features.push(FEATURES.PORTFOLIO_ENDPOINT)

      // Set hidden tokens for common chainIds (mainnet and Sepolia) to work in different environments
      const hiddenTokens: Record<string, string[]> =
        hiddenTokensCount > 0
          ? {
              '1': Array(hiddenTokensCount).fill('0x123'),
              '11155111': Array(hiddenTokensCount).fill('0x123'),
            }
          : {}

      return (
        <StoreDecorator
          initialState={{
            settings: {
              currency: 'usd',
              hiddenTokens,
              tokenList,
              hideDust: true,
              shortName: { copy: true, qr: true },
              theme: {},
              env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
              signing: { onChainSigning: false, blindSigning: false },
              transactionExecution: true,
            },
            chains: {
              data: [{ chainId: '1', features }],
            },
            safeInfo: {
              data: { chainId: '1' },
              loading: false,
              loaded: true,
            },
          }}
        >
          <Paper sx={{ padding: 4 }}>
            <Story />
          </Paper>
        </StoreDecorator>
      )
    },
  ],
  argTypes: {
    hasDefaultTokenlist: {
      control: { type: 'boolean' },
      description: 'Whether DEFAULT_TOKENLIST feature is enabled',
    },
    hasPortfolioEndpoint: {
      control: { type: 'boolean' },
      description: 'Whether PORTFOLIO_ENDPOINT feature is enabled',
    },
    tokenList: {
      control: { type: 'select' },
      options: [TOKEN_LISTS.TRUSTED, TOKEN_LISTS.ALL],
      description: 'Current token list setting',
    },
    hiddenTokensCount: {
      control: { type: 'number' },
      description: 'Number of hidden tokens',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<StoryArgs>

/**
 * Default ManageTokensButton with default tokenlist feature enabled.
 */
export const Default: Story = {
  args: {
    hasDefaultTokenlist: true,
    hasPortfolioEndpoint: false,
    tokenList: TOKEN_LISTS.TRUSTED,
    hiddenTokensCount: 0,
  },
}

/**
 * ManageTokensButton with portfolio endpoint enabled (shows "Hide small balances" option).
 */
export const WithPortfolioEndpoint: Story = {
  args: {
    hasDefaultTokenlist: true,
    hasPortfolioEndpoint: true,
    tokenList: TOKEN_LISTS.TRUSTED,
    hiddenTokensCount: 0,
  },
}

/**
 * ManageTokensButton showing hidden tokens count.
 */
export const WithHiddenTokens: Story = {
  args: {
    hasDefaultTokenlist: true,
    hasPortfolioEndpoint: false,
    tokenList: TOKEN_LISTS.TRUSTED,
    hiddenTokensCount: 5,
  },
}

/**
 * ManageTokensButton with "Show all tokens" enabled.
 */
export const AllTokensEnabled: Story = {
  args: {
    hasDefaultTokenlist: true,
    hasPortfolioEndpoint: false,
    tokenList: TOKEN_LISTS.ALL,
    hiddenTokensCount: 0,
  },
}

/**
 * ManageTokensButton with all features enabled and hidden tokens.
 */
export const FullFeatured: Story = {
  args: {
    hasDefaultTokenlist: true,
    hasPortfolioEndpoint: true,
    tokenList: TOKEN_LISTS.ALL,
    hiddenTokensCount: 3,
  },
}
