import reducer, { setActiveSigner, removeActiveSigner, selectActiveSigner } from '../activeSignerSlice'
import type { Address, SignerInfo } from '../../types/address'
import type { RootState } from '../index'

describe('activeSignerSlice', () => {
  const SAFE_ADDRESS = '0x1234567890123456789012345678901234567890' as Address
  const OTHER_SAFE_ADDRESS = '0x9876543210987654321098765432109876543210' as Address
  const signer: SignerInfo = { value: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', name: 'Alice' }
  const otherSigner: SignerInfo = { value: '0x1111111111111111111111111111111111111111', name: 'Bob' }

  it('handles setActiveSigner', () => {
    const action = setActiveSigner({ safeAddress: SAFE_ADDRESS, signer })
    const state = reducer({}, action)
    expect(state).toEqual({ [SAFE_ADDRESS]: signer })
  })

  it('handles removeActiveSigner', () => {
    const initialState = { [SAFE_ADDRESS]: signer, [OTHER_SAFE_ADDRESS]: otherSigner }
    const state = reducer(initialState, removeActiveSigner({ safeAddress: SAFE_ADDRESS }))
    expect(state).toEqual({ [OTHER_SAFE_ADDRESS]: otherSigner })
  })

  it('selectActiveSigner returns signer for safe', () => {
    const rootState = { activeSigner: { [SAFE_ADDRESS]: signer } } as unknown as RootState
    expect(selectActiveSigner(rootState, SAFE_ADDRESS)).toEqual(signer)
  })

  it('selectActiveSigner returns undefined when not set', () => {
    const rootState = { activeSigner: {} } as unknown as RootState
    expect(selectActiveSigner(rootState, SAFE_ADDRESS)).toBeUndefined()
  })
})
