import { getMemberProfile } from './members'
import { getScenario, getScenarioAccounts, UNNAMED_SIGNER } from './model'

const items = getScenario('50-safes')
const accounts = getScenarioAccounts('50-safes')

describe('member profile', () => {
  it('names a persona signer by role and lists what waits on them', () => {
    const jonas = getMemberProfile('Jonas', accounts, items, 'owner')
    expect(jonas).toMatchObject({ role: 'Security lead', access: 'Member', you: false })
    expect(jonas.safes.length).toBeGreaterThan(0)
    expect(jonas.signed.length).toBeGreaterThan(0)
  })

  it('marks you and signers outside the workspace', () => {
    expect(getMemberProfile('Dev', accounts, items, 'owner')).toMatchObject({ you: true, access: 'Admin' })
    expect(getMemberProfile(UNNAMED_SIGNER, accounts, items, 'owner').access).toBe('Not in workspace')
  })

  it('shows a signer with nothing waiting', () => {
    const omar = getMemberProfile('Omar', accounts, items, 'owner')
    expect(omar).toMatchObject({ role: 'Signer', waiting: [], signed: [] })
    expect(omar.safes.map((account) => account.id)).toEqual(['reserve-arbitrum'])
  })
})
