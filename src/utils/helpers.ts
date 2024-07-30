// `assert` does not work with arrow functions
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import type { SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { OnboardAPI } from '@web3-onboard/core'

export function invariant<T extends unknown>(condition: T, error: string): asserts condition {
  if (condition) {
    return
  }

  throw new Error(error)
}

export function assertTx(safeTx: SafeTransaction | undefined): asserts safeTx {
  return invariant(safeTx, 'Transaction not provided')
}

export function assertWallet(wallet: ConnectedWallet | null): asserts wallet {
  return invariant(wallet, 'Wallet not connected')
}

export function assertOnboard(onboard: OnboardAPI | undefined): asserts onboard {
  return invariant(onboard, 'Onboard not connected')
}
