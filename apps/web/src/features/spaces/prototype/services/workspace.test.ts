import { getScenarioAccounts, shortAddress } from './model'
import { getPersonaAddress, getPlan, getSignerStatus, getWorkspaceProfile } from './workspace'

describe('getPlan', () => {
  it('picks the smallest Safe Pro plan with enough Safe seats', () => {
    expect(getPlan(2).label).toBe('Safe Pro Starter (2 Safes)')
    expect(getPlan(3).label).toBe('Safe Pro Business (5 Safes)')
    expect(getPlan(20).label).toBe('Safe Pro Business (20 Safes)')
    expect(getPlan(21).label).toBe('Safe Pro Enterprise')
  })
})

describe('getWorkspaceProfile', () => {
  it('counts members, signers and signers outside the workspace', () => {
    expect(getWorkspaceProfile('everyday')).toMatchObject({ safes: 3, members: 8, signers: 7, outside: 1 })
  })

  it('follows the scenario', () => {
    expect(getWorkspaceProfile('many-safes').plan.label).toBe('Safe Pro Business (20 Safes)')
  })
})

describe('getSignerStatus', () => {
  const accounts = getScenarioAccounts('everyday')

  it('describes each persona', () => {
    expect(getSignerStatus('owner', accounts)).toBe('Signs 2 of 3 Safes')
    expect(getSignerStatus('single', accounts)).toBe('Signs 1 Safe (Ops Payroll)')
    expect(getSignerStatus('member', accounts)).toBe('Not a signer')
    expect(getSignerStatus('security', accounts)).toBe('Signs 2 of 3 Safes')
  })

  it('updates with the 20-Safe scenario', () => {
    expect(getSignerStatus('owner', getScenarioAccounts('many-safes'))).toBe('Signs 19 of 20 Safes')
  })
})

it('gives non-signers a checksummed wallet', () => {
  expect(shortAddress(getPersonaAddress('member'))).toBe('0xA1e7…12AB')
})
