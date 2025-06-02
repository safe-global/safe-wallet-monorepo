import activeSafeReducer, { setActiveSafe, switchActiveChain, clearActiveSafe } from '../activeSafeSlice'
import type { SafeInfo } from '../../types/address'

describe('activeSafeSlice', () => {
  const safe: SafeInfo = {
    address: '0x1234567890abcdef1234567890abcdef12345678',
    chainId: '1',
  }

  it('should set the active safe', () => {
    const state = activeSafeReducer(undefined, setActiveSafe(safe))
    expect(state).toEqual(safe)
  })

  it('should switch chain if a safe is active', () => {
    const state = activeSafeReducer(safe, switchActiveChain({ chainId: '5' }))
    expect(state).toEqual({ ...safe, chainId: '5' })
  })

  it('should ignore chain switch if no safe is active', () => {
    const state = activeSafeReducer(null, switchActiveChain({ chainId: '5' }))
    expect(state).toBeNull()
  })

  it('should clear the active safe', () => {
    const state = activeSafeReducer(safe, clearActiveSafe())
    expect(state).toBeNull()
  })
})
