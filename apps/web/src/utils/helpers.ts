// `assert` does not work with arrow functions
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import type { OnboardAPI } from '@web3-onboard/core'
import type { Eip1193Provider } from 'ethers'
import { invariant } from '@safe-global/utils/utils/helpers'

export function assertTx(safeTx: SafeTransaction | undefined): asserts safeTx {
  return invariant(safeTx, 'Transaction not provided')
}

export function assertWallet(wallet: ConnectedWallet | null): asserts wallet {
  return invariant(wallet, 'Wallet not connected')
}

export function assertOnboard(onboard: OnboardAPI | undefined): asserts onboard {
  return invariant(onboard, 'Onboard not connected')
}

export function assertChainInfo(chainInfo: ChainInfo | undefined): asserts chainInfo {
  return invariant(chainInfo, 'No chain config available')
}

export function assertProvider(provider: Eip1193Provider | undefined | null): asserts provider {
  return invariant(provider, 'Provider not found')
}

export const getKeyWithTrueValue = (obj: Record<string, boolean>) => {
  return Object.entries(obj).find(([, value]) => !!value)?.[0]
}
