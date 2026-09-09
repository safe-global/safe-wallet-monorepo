import { createContext } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { GtfPaymentMode } from '@/features/gtf/types'

/**
 * Kept apart from `SafeTxProvider`, whose imports reach `features/spaces` and
 * `features/hypernative` — reading the context from there would close an import
 * cycle. Keep this file free of runtime imports beyond `react`.
 */
export type SafeTxContextParams = {
  safeTx?: SafeTransaction
  setSafeTx: Dispatch<SetStateAction<SafeTransaction | undefined>>

  safeMessage?: TypedData
  setSafeMessage: Dispatch<SetStateAction<TypedData | undefined>>

  safeMessageHash?: `0x${string}`
  setSafeMessageHash: Dispatch<SetStateAction<`0x${string}` | undefined>>

  safeTxError?: Error
  setSafeTxError: Dispatch<SetStateAction<Error | undefined>>

  nonce?: number
  setNonce: Dispatch<SetStateAction<number | undefined>>
  nonceNeeded?: boolean
  setNonceNeeded: Dispatch<SetStateAction<boolean>>

  safeTxGas?: string
  setSafeTxGas: Dispatch<SetStateAction<string | undefined>>

  recommendedNonce?: number

  txOrigin?: string
  setTxOrigin: Dispatch<SetStateAction<string | undefined>>

  isReadOnly: boolean

  // GTF: proposer's payment choice. Meaningful only for the first signer; confirmers
  // read the locked fee fields directly from safeTx.data.
  gtfPaymentMode: GtfPaymentMode
  setGtfPaymentMode: (source: GtfPaymentMode) => void
  gtfSelectedGasToken?: string
  setGtfSelectedGasToken: Dispatch<SetStateAction<string | undefined>>
}

export const SafeTxContext = createContext<SafeTxContextParams>({
  setSafeTx: () => {},
  setSafeMessage: () => {},
  setSafeMessageHash: () => {},
  setSafeTxError: () => {},
  setNonce: () => {},
  setNonceNeeded: () => {},
  setSafeTxGas: () => {},
  setTxOrigin: () => {},
  isReadOnly: false,
  gtfPaymentMode: 'safe',
  setGtfPaymentMode: () => {},
  setGtfSelectedGasToken: () => {},
})
