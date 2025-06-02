import reducer, { addSafe, updateSafeInfo, removeSafe } from '../safesSlice'
import { Address } from '@/src/types/address'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

const safe1: SafeOverview = {
  address: { value: '0x123', name: null, logoUri: null },
  chainId: '1',
  threshold: 1,
  owners: [{ value: '0xowner1', name: null, logoUri: null }],
  fiatTotal: '100',
  queued: 0,
  awaitingConfirmation: null,
}

const safe2: SafeOverview = {
  address: { value: '0x123', name: null, logoUri: null },
  chainId: '1',
  threshold: 2,
  owners: [{ value: '0xowner2', name: null, logoUri: null }],
  fiatTotal: '200',
  queued: 1,
  awaitingConfirmation: 1,
}

describe('safesSlice reducer', () => {
  it('adds a safe', () => {
    const state = reducer({}, addSafe({ address: '0x123' as Address, info: { [safe1.chainId]: safe1 } }))
    expect(state['0x123']).toEqual({ [safe1.chainId]: safe1 })
  })

  it('updates a safe info for existing safe', () => {
    const initialState = {
      '0x123': { [safe1.chainId]: safe1 },
    }
    const state = reducer(initialState, updateSafeInfo({ address: '0x123' as Address, chainId: '1', info: safe2 }))
    expect(state['0x123']['1']).toEqual(safe2)
  })

  it('creates a safe when updating non-existent safe', () => {
    const state = reducer({}, updateSafeInfo({ address: '0xabc' as Address, chainId: '1', info: safe1 }))
    expect(state['0xabc']).toEqual({ [safe1.chainId]: safe1 })
  })

  it('removes a safe', () => {
    const initialState = {
      '0x123': { [safe1.chainId]: safe1 },
    }
    const state = reducer(initialState, removeSafe('0x123' as Address))
    expect(state['0x123']).toBeUndefined()
  })
})
