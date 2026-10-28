import { getScenarioAccounts } from './model'
import { describeDrift, getRequirementGaps, missesRequirements } from './requirements'
import { getRegistry, getSafeGroup } from './registry'
import { getMemberProfile } from './members'
import { getScenario } from './model'

const accounts = getScenarioAccounts('20-safes')
const byId = (id: string) => accounts.find((account) => account.id === id)!
const issues = (id: string) => getRequirementGaps(byId(id), accounts).map((issue) => issue.id)

describe('Safe registry', () => {
  it('treats one Safe on several networks as one entry', () => {
    expect(getSafeGroup(byId('fleet-treasury-base'))).toBe('Treasury')
    expect(getRegistry(byId('fleet-treasury-base'))).toMatchObject({ group: 'Treasury', contact: 'Dev' })
  })
})

describe('requirements', () => {
  it('flags 6 of the 20 fleet Safes', () => {
    expect(accounts.filter((account) => missesRequirements(account, accounts)).map((account) => account.id)).toEqual([
      'fleet-security-council-ethereum',
      'fleet-security-council-arbitrum',
      'fleet-payroll-base',
      'fleet-payroll-gnosis',
      'fleet-keepers-arbitrum',
      'fleet-dao-reserve-ethereum',
    ])
  })

  it('names what each Safe misses', () => {
    expect(issues('fleet-treasury-ethereum')).toEqual([])
    expect(issues('fleet-security-council-ethereum')).toEqual(['attested'])
    expect(issues('fleet-keepers-arbitrum')).toEqual(['registry'])
    expect(issues('fleet-payroll-base')).toEqual(['attested', 'drift'])
    expect(issues('fleet-payroll-gnosis')).toEqual(['drift'])
  })

  it('describes how two networks of one Safe drifted apart', () => {
    expect(describeDrift(byId('fleet-payroll-base'), byId('fleet-payroll-gnosis'))).toBe('adds Nadia, no Sam')
  })
})

describe('member profile', () => {
  it('lists missing attestations and the Safes a member is the contact for', () => {
    const sam = getMemberProfile('Sam', accounts, getScenario('20-safes'), 'owner')
    expect(sam.issues).toEqual(['No attestation on Payroll Base.'])
    expect(sam.wallet).toBe('Browser wallet')
    expect(sam.contactFor).toEqual(['Payroll'])
  })
})
