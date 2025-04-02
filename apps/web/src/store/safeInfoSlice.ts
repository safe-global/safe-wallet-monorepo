import type { SafeState } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { makeLoadableSlice } from './common'
export type ExtendedSafeInfo = SafeState & { deployed: boolean }

export const defaultSafeInfo: ExtendedSafeInfo = {
  address: { value: '' },
  chainId: '',
  nonce: -1,
  threshold: 0,
  owners: [],
  implementation: { value: '' },
  implementationVersionState: '' as SafeState['implementationVersionState'],
  modules: null,
  guard: null,
  fallbackHandler: { value: '' },
  version: '',
  collectiblesTag: '',
  txQueuedTag: '',
  txHistoryTag: '',
  messagesTag: '',
  deployed: true,
}

const { slice, selector } = makeLoadableSlice('safeInfo', undefined as ExtendedSafeInfo | undefined)

export const safeInfoSlice = slice
export const selectSafeInfo = selector
