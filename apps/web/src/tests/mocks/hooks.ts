import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { chainBuilder } from '@/tests/builders/chains'
import { connectedWalletBuilder } from '@/tests/builders/wallet'

/**
 * Sets the return value for a mocked `useSafeInfo` hook.
 * Requires `jest.mock('@/hooks/useSafeInfo')` at the top of the test file.
 */
export function mockSafeInfo(overrides?: Partial<ExtendedSafeInfo>) {
  const safe = extendedSafeInfoBuilder()
    .with(overrides ?? {})
    .build()
  const mock = jest.requireMock('@/hooks/useSafeInfo').default as jest.Mock
  mock.mockReturnValue({
    safe,
    safeAddress: safe.address.value,
    safeLoaded: true,
    safeLoading: false,
  })
  return safe
}

/**
 * Sets the return value for a mocked `useChainId` hook.
 * Requires `jest.mock('@/hooks/useChainId')` at the top of the test file.
 */
export function mockChainId(chainId = '1') {
  const mock = jest.requireMock('@/hooks/useChainId').default as jest.Mock
  mock.mockReturnValue(chainId)
}

/**
 * Sets the return value for a mocked `useCurrentChain` hook.
 * Requires `jest.mock('@/hooks/useChains')` at the top of the test file.
 */
export function mockCurrentChain(overrides?: Partial<Chain>) {
  const chain = chainBuilder()
    .with(overrides ?? {})
    .build()
  const mock = jest.requireMock('@/hooks/useChains').useCurrentChain as jest.Mock
  mock.mockReturnValue(chain)
  return chain
}

/**
 * Sets the return value for a mocked `useHasFeature` hook.
 * Requires `jest.mock('@/hooks/useChains')` at the top of the test file.
 *
 * Pass a record of feature name to boolean, or a single boolean
 * for all features.
 */
export function mockHasFeature(features: Record<string, boolean> | boolean) {
  const mock = jest.requireMock('@/hooks/useChains').useHasFeature as jest.Mock
  if (typeof features === 'boolean') {
    mock.mockReturnValue(features)
  } else {
    mock.mockImplementation((feature: string) => features[feature] ?? false)
  }
}

/**
 * Sets the return value for a mocked `useWallet` hook.
 * Requires `jest.mock('@/hooks/wallets/useWallet')` at the top of the test file.
 *
 * Pass `null` to simulate a disconnected wallet.
 */
export function mockWallet(wallet?: Partial<ConnectedWallet> | null) {
  const mock = jest.requireMock('@/hooks/wallets/useWallet').default as jest.Mock
  if (wallet === null) {
    mock.mockReturnValue(null)
    return null
  }
  const built = connectedWalletBuilder()
    .with(wallet ?? {})
    .build()
  mock.mockReturnValue(built)
  return built
}

/**
 * Sets the return value for a mocked `useIsSafeOwner` hook.
 * Requires `jest.mock('@/hooks/useIsSafeOwner')` at the top of the test file.
 */
export function mockIsSafeOwner(isOwner = true) {
  const mock = jest.requireMock('@/hooks/useIsSafeOwner').default as jest.Mock
  mock.mockReturnValue(isOwner)
}
