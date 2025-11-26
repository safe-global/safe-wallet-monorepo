import type { Meta, StoryObj } from '@storybook/react'
import { Paper } from '@mui/material'
import { StoreDecorator } from '@/stories/storeDecorator'
import ManageTokensButton from './index'
import { TOKEN_LISTS } from '@/store/settingsSlice'

const baseSettings = {
  currency: 'usd',
  tokenList: TOKEN_LISTS.TRUSTED,
  hideDust: true,
  shortName: { copy: true, qr: true },
  theme: {},
  env: { tenderly: { url: '', accessToken: '' }, rpc: {} },
  signing: { onChainSigning: false, blindSigning: false },
  transactionExecution: true,
}

const meta: Meta<typeof ManageTokensButton> = {
  title: 'Components/Balances/ManageTokensButton',
  component: ManageTokensButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
ManageTokensButton opens a menu with token management options:
- **Show all tokens**: Toggle between trusted tokens and all tokens (requires DEFAULT_TOKENLIST feature)
- **Hide small balances**: Hide tokens below dust threshold
- **Hide tokens**: Open hidden tokens management (shows count if tokens are hidden)
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <StoreDecorator
        initialState={{
          settings: { ...baseSettings, hiddenTokens: {} },
        }}
      >
        <Paper sx={{ padding: 4 }}>
          <Story />
        </Paper>
      </StoreDecorator>
    ),
  ],
  argTypes: {
    _hasDefaultTokenlist: {
      control: { type: 'boolean' },
      description: 'Show "Show all tokens" option',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ManageTokensButton>

/**
 * Default state with all menu options visible.
 */
export const Default: Story = {
  args: {
    _hasDefaultTokenlist: true,
  },
}

/**
 * Without default tokenlist feature - only shows "Hide small balances" and "Hide tokens".
 */
export const WithoutDefaultTokenlist: Story = {
  args: {
    _hasDefaultTokenlist: false,
  },
}

/**
 * Shows hidden tokens count in the menu when tokens are hidden.
 */
export const WithHiddenTokens: Story = {
  args: {
    _hasDefaultTokenlist: true,
  },
  decorators: [
    (Story) => (
      <StoreDecorator
        initialState={{
          settings: {
            ...baseSettings,
            hiddenTokens: {
              '1': ['0x123', '0x456', '0x789'],
              '11155111': ['0x123', '0x456', '0x789'],
            },
          },
        }}
      >
        <Paper sx={{ padding: 4 }}>
          <Story />
        </Paper>
      </StoreDecorator>
    ),
  ],
}
