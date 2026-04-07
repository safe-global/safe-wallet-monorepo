import type { Meta, StoryObj } from '@storybook/react'
import SendAmountBlock from './SendAmountBlock'
import { TokenType } from '@safe-global/store/gateway/types'
import { parseUnits } from 'ethers'
import { withMockProvider } from '@/storybook/preview'
import type { Balance } from '@safe-global/store/gateway/AUTO_GENERATED/balances'

const usdcToken: Balance['tokenInfo'] = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  decimals: 6,
  logoUri: 'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
  name: 'USD Coin',
  symbol: 'USDC',
  type: TokenType.ERC20,
}

const ethToken: Balance['tokenInfo'] = {
  address: '0x0000000000000000000000000000000000000000',
  decimals: 18,
  logoUri: 'https://safe-transaction-assets.safe.global/chains/1/currency_logo.png',
  name: 'Ether',
  symbol: 'ETH',
  type: TokenType.NATIVE_TOKEN,
}

const meta: Meta<typeof SendAmountBlock> = {
  title: 'Transactions/SendAmountBlock',
  component: SendAmountBlock,
  decorators: [withMockProvider()],
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    amountInWei: parseUnits('100', 6).toString(),
    tokenInfo: usdcToken,
  },
}

export const WithFiatValue: Story = {
  args: {
    amountInWei: parseUnits('100', 6).toString(),
    tokenInfo: usdcToken,
    fiatConversion: '1',
  },
}

export const NativeToken: Story = {
  args: {
    amountInWei: parseUnits('0.5', 18).toString(),
    tokenInfo: ethToken,
    fiatConversion: '2000',
  },
}

export const ZeroFiatConversion: Story = {
  args: {
    amountInWei: parseUnits('100', 6).toString(),
    tokenInfo: usdcToken,
    fiatConversion: '0',
  },
}
