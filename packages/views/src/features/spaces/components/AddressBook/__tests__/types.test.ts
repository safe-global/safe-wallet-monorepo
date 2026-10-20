import { describeSuggestion } from '../types'

describe('describeSuggestion', () => {
  it('lists the Safes a signer signs for', () => {
    expect(describeSuggestion({ kind: 'signer', safes: ['Treasury'] })).toBe('Signer of Treasury')
    expect(describeSuggestion({ kind: 'signer', safes: ['Treasury', 'Payroll'] })).toBe('Signer of Treasury, Payroll')
  })

  it('uses the singular for one transaction', () => {
    expect(describeSuggestion({ kind: 'frequent', transactions: 1 })).toBe('1 transaction with your Safes')
  })

  it('uses the plural for several transactions', () => {
    expect(describeSuggestion({ kind: 'frequent', transactions: 24 })).toBe('24 transactions with your Safes')
  })
})
