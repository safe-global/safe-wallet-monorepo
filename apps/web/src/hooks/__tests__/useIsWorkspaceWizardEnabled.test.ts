import { renderHook } from '@testing-library/react'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { DEFAULT_CHAIN_ID } from '@/config/constants'
import { chainBuilder } from '@/tests/builders/chains'
import { useIsWorkspaceWizardEnabled } from '@/hooks/useIsWorkspaceWizardEnabled'

let mockChains: Record<string, Chain> = {}
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useChain: (chainId: string) => mockChains[chainId],
}))

const defaultChain = (features: FEATURES[]): Chain =>
  chainBuilder()
    .with({ chainId: String(DEFAULT_CHAIN_ID), features })
    .build()

describe('useIsWorkspaceWizardEnabled', () => {
  beforeEach(() => {
    mockChains = {}
  })

  it('is undefined while the chains are loading, so no onboarding renders yet', () => {
    const { result } = renderHook(() => useIsWorkspaceWizardEnabled())

    expect(result.current).toBeUndefined()
  })

  it('is false when the default chain does not have the wizard flag', () => {
    mockChains = { [String(DEFAULT_CHAIN_ID)]: defaultChain([]) }

    const { result } = renderHook(() => useIsWorkspaceWizardEnabled())

    expect(result.current).toBe(false)
  })

  it('is true when the default chain has the wizard flag, whatever other chains have', () => {
    mockChains = {
      [String(DEFAULT_CHAIN_ID)]: defaultChain([FEATURES.WORKSPACE_ONBOARDING_V2]),
      '100': chainBuilder().with({ chainId: '100', features: [] }).build(),
    }

    const { result } = renderHook(() => useIsWorkspaceWizardEnabled())

    expect(result.current).toBe(true)
  })
})
