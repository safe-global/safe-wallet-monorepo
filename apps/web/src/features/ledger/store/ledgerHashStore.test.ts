import { showLedgerHashComparison, hideLedgerHashComparison } from './index'
import ledgerHashStore from './ledgerHashStore'

describe('ledgerHashStore', () => {
  afterEach(() => {
    // Clean up after each test
    hideLedgerHashComparison()
  })

  it('should start with undefined state', () => {
    const state = ledgerHashStore.getStore()
    expect(state).toBeUndefined()
  })

  it('should update state when showLedgerHashComparison called', () => {
    const hash = '0xabc123'
    showLedgerHashComparison(hash)
    expect(ledgerHashStore.getStore()).toBe(hash)
  })

  it('should clear state when hideLedgerHashComparison called', () => {
    showLedgerHashComparison('0xtest')
    hideLedgerHashComparison()
    expect(ledgerHashStore.getStore()).toBeUndefined()
  })

  it('should use latest hash when called multiple times', () => {
    showLedgerHashComparison('0xfirst')
    showLedgerHashComparison('0xsecond')
    expect(ledgerHashStore.getStore()).toBe('0xsecond')
  })
})
