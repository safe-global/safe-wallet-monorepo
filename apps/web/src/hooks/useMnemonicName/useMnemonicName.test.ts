import { getRandomAdjective, useMnemonicSafeName } from '.'
import { renderHook } from '@/tests/test-utils'
import { chainBuilder } from '@safe-global/utils/tests/builders/chains'

const mockChain = chainBuilder().build()

// Mock useCurrentChain hook
jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => mockChain,
}))

describe('useMnemonicName tests', () => {
  it('should generate a random name', () => {
    expect(getRandomAdjective()).toMatch(/^[A-Z][a-z-]+/)
    expect(getRandomAdjective()).toMatch(/^[A-Z][a-z-]+/)
    expect(getRandomAdjective()).toMatch(/^[A-Z][a-z-]+/)
  })

  it('should return a random safe name with current chain', () => {
    const { result } = renderHook(() => useMnemonicSafeName())
    const regex = new RegExp(`^[A-Z][a-z-]+ ${mockChain.chainName} Safe$`)
    expect(result.current).toMatch(regex)
  })

  it('should return a random safe name indicating a multichain safe', () => {
    const { result } = renderHook(() => useMnemonicSafeName(true))
    const regex = new RegExp(`^[A-Z][a-z-]+ Multi-Chain Safe$`)
    expect(result.current).toMatch(regex)
  })
})
