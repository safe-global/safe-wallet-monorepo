import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { renderHook } from '@/tests/test-utils'
import * as useChains from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { useIsAllowlistAvailableInSpace, useIsAllowlistEnabled } from '../useAllowlistAvailability'

const sepolia = chainBuilder()
  .with({ chainId: '11155111', features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST] })
  .build()
const mainnetFlagged = chainBuilder()
  .with({ chainId: '1', features: [FEATURES.POLICY_RECIPIENT_ALLOWLIST] })
  .build()
const sepoliaOff = chainBuilder().with({ chainId: '11155111', features: [] }).build()

const mockChains = (configs: Chain[]) => jest.spyOn(useChains, 'default').mockReturnValue({ configs, loading: false })

describe('useIsAllowlistAvailableInSpace', () => {
  beforeEach(() => jest.restoreAllMocks())

  it('is true when at least one chain is enabled', () => {
    mockChains([mainnetFlagged, sepolia])
    expect(renderHook(() => useIsAllowlistAvailableInSpace()).result.current).toBe(true)
  })

  it('is false when the only flagged chain has no deployment', () => {
    mockChains([mainnetFlagged, sepoliaOff])
    expect(renderHook(() => useIsAllowlistAvailableInSpace()).result.current).toBe(false)
  })

  it('is false before chains load', () => {
    mockChains([])
    expect(renderHook(() => useIsAllowlistAvailableInSpace()).result.current).toBe(false)
  })
})

describe('useIsAllowlistEnabled', () => {
  beforeEach(() => jest.restoreAllMocks())

  it('reads the given chain, not the URL chain', () => {
    jest.spyOn(useChains, 'useChain').mockImplementation((id) => (id === '11155111' ? sepolia : undefined))
    expect(renderHook(() => useIsAllowlistEnabled('11155111')).result.current).toBe(true)
    expect(renderHook(() => useIsAllowlistEnabled('1')).result.current).toBe(false)
  })

  it('is false when the flag is off for that chain', () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(sepoliaOff)
    expect(renderHook(() => useIsAllowlistEnabled('11155111')).result.current).toBe(false)
  })
})
