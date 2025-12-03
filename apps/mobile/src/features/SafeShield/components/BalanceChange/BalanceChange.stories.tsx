import type { Meta, StoryObj } from '@storybook/react'
import { BalanceChangeBlock } from './BalanceChangeBlock'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { BalanceChangeDto } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'

const meta: Meta<typeof BalanceChangeBlock> = {
  title: 'SafeShield/BalanceChange',
  component: BalanceChangeBlock,
}

export default meta

type Story = StoryObj<typeof BalanceChangeBlock>

const createThreatResult = (balanceChanges: BalanceChangeDto[]): AsyncResult<ThreatAnalysisResults> => {
  return [{ BALANCE_CHANGE: balanceChanges }, undefined, false]
}

const ethOutgoing: BalanceChangeDto = {
  asset: {
    type: 'NATIVE',
    symbol: 'ETH',
    logo_url: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
  },
  in: [],
  out: [{ value: '0.05' }],
}

const ethIncoming: BalanceChangeDto = {
  asset: {
    type: 'NATIVE',
    symbol: 'ETH',
    logo_url: 'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
  },
  in: [{ value: '1.5' }],
  out: [],
}

const usdcOutgoing: BalanceChangeDto = {
  asset: {
    type: 'ERC20',
    symbol: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    logo_url: 'https://safe-transaction-assets.safe.global/tokens/logos/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48.png',
  },
  in: [],
  out: [{ value: '100' }],
}

const nftOutgoing: BalanceChangeDto = {
  asset: {
    type: 'ERC721',
    symbol: 'BAYC',
    address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
    logo_url:
      'https://i.seadn.io/gae/Ju9CkWtV-1Okvf45wo8UctR-M9He2PjILP0oOvxE89AyiPPGtrR3gysu1Zgy0hjd2xKIgjJJtWIc0ybj4Vd7wv8t3pxDGHoJBzDB?w=500&auto=format',
  },
  in: [],
  out: [{ token_id: 1234 }],
}

export const SingleOutgoingETH: Story = {
  args: {
    threat: createThreatResult([ethOutgoing]),
  },
}

export const SingleIncomingETH: Story = {
  args: {
    threat: createThreatResult([ethIncoming]),
  },
}

export const MultipleBalanceChanges: Story = {
  args: {
    threat: createThreatResult([
      {
        asset: ethOutgoing.asset,
        in: [],
        out: [{ value: '0.5' }],
      },
      {
        asset: usdcOutgoing.asset,
        in: [{ value: '1000' }],
        out: [],
      },
    ]),
  },
}

export const SwapTransaction: Story = {
  args: {
    threat: createThreatResult([
      {
        asset: ethOutgoing.asset,
        in: [],
        out: [{ value: '1' }],
      },
      {
        asset: usdcOutgoing.asset,
        in: [{ value: '2500' }],
        out: [],
      },
    ]),
  },
}

export const NFTTransfer: Story = {
  args: {
    threat: createThreatResult([nftOutgoing]),
  },
}

export const Loading: Story = {
  args: {
    threat: [undefined, undefined, true],
  },
}

export const ErrorState: Story = {
  args: {
    threat: [undefined, new Error('Failed to analyze'), false],
  },
}

export const NoBalanceChanges: Story = {
  args: {
    threat: createThreatResult([]),
  },
}
