import type { ExtendedSafeInfo } from './types'
import type { SafeState } from '../../gateway/AUTO_GENERATED/safes'

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