import type { ScanContext } from './types'

/** Creates a default ScanContext with sensible defaults. Override any field. */
export const createMockContext = (overrides: Partial<ScanContext> = {}): ScanContext => ({
  owners: [
    { value: '0x1111111111111111111111111111111111111111' },
    { value: '0x2222222222222222222222222222222222222222' },
    { value: '0x3333333333333333333333333333333333333333' },
  ],
  threshold: 2,
  modules: null,
  guard: null,
  fallbackHandler: { value: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4' },
  implementationVersionState: 'UP_TO_DATE',
  implementationAddress: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
  version: '1.4.1',
  chainId: '1',
  safeAddress: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
  latestVersion: '1.4.1',
  isNonCriticalUpdate: false,
  masterCopyDeployer: 'Gnosis',
  nonce: 10,
  queuedTxCount: 0,
  balanceUsd: 0,
  chainSupportsRecovery: true,
  chainSupportsHypernative: false,
  chainSupportsTransactionScanning: true,
  isMultichain: false,
  multichainSignersConsistent: true,
  multichainDeviatingChains: [],
  creationInfo: null,
  ...overrides,
})
