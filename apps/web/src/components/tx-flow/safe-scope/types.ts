// SPDX-License-Identifier: FSL-1.1-MIT

import type Safe from '@safe-global/protocol-kit'
import type { JsonRpcProvider } from 'ethers'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'

/** The Safe a Space-level flow is operating on. Two strings — no dependency on how they were chosen. */
export type SafeScopeTarget = {
  chainId: string
  safeAddress: string
}

/** Everything the tx-flow needs about the selected Safe, resolved from `SafeScopeTarget`. */
export type SafeScope = SafeScopeTarget & {
  /** `${chainId}:${safeAddress}` — use as the reset dependency when the Safe changes (C15 / C17e). */
  scopeKey: string
  /** Full SafeState from CGW with `deployed: true`. Absent until loaded. */
  safe?: ExtendedSafeInfo
  safeLoaded: boolean
  safeLoading: boolean
  safeError?: string
  /** Absent until chain configs resolve. */
  chain?: Chain
  /** Read-only provider for `chainId`, honouring the user's custom RPC. Absent until created. */
  web3ReadOnly?: JsonRpcProvider
  /** protocol-kit instance for this Safe. Absent until `safe` and `web3ReadOnly` are ready. */
  sdk?: Safe
}

export type SafeScopeControls = {
  setScope: (chainId: string, safeAddress: string) => void
  clearScope: () => void
}

export type SafeScopeContextValue = SafeScopeControls & {
  scope: SafeScope | undefined
}

/** The subset tx-sender functions need. `SafeScope` is assignable to it. */
export type TxSenderScope = Pick<SafeScope, 'sdk' | 'chainId' | 'safeAddress' | 'web3ReadOnly'>
