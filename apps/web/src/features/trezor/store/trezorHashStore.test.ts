import { showTrezorHashComparison, hideTrezorHashComparison } from './index'
import trezorHashStore from './trezorHashStore'

describe('trezorHashStore', () => {
  afterEach(() => {
    hideTrezorHashComparison()
  })

  it('should start with undefined state', () => {
    const state = trezorHashStore.getStore()
    expect(state).toBeUndefined()
  })

  it('should update state when showTrezorHashComparison called', () => {
    const hash = '0xabc123'
    showTrezorHashComparison(hash)
    expect(trezorHashStore.getStore()).toBe(hash)
  })

  it('should clear state when hideTrezorHashComparison called', () => {
    showTrezorHashComparison('0xtest')
    hideTrezorHashComparison()
    expect(trezorHashStore.getStore()).toBeUndefined()
  })

  it('should use latest hash when called multiple times', () => {
    showTrezorHashComparison('0xfirst')
    showTrezorHashComparison('0xsecond')
    expect(trezorHashStore.getStore()).toBe('0xsecond')
  })
})
