import { describeGuardCheck, PERMITTED } from '../policyGuardMessages'

const POLICY = '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187'

describe('describeGuardCheck', () => {
  it('says a permitted transaction is permitted', () => {
    expect(describeGuardCheck({ status: 'allowed' }, 'erc20-transfer')).toEqual(PERMITTED)
  })

  // Nothing covering an action is a gap to fill; a policy rejecting it is a rule being enforced.
  it('distinguishes nothing covering the action from a policy rejecting it', () => {
    const uncovered = describeGuardCheck({ status: 'no-policy' }, 'native-transfer')
    const rejected = describeGuardCheck({ status: 'denied', policy: POLICY }, 'native-transfer')

    expect(uncovered?.title).toMatch(/no policy covers/i)
    expect(rejected?.title).toMatch(/blocked by a policy/i)
    expect(uncovered?.title).not.toBe(rejected?.title)
  })

  it.each([
    ['erc20-transfer', /allowlist/i],
    ['native-transfer', /native token allowlist/i],
    ['multisend', /every call inside the batch/i],
    ['safe-management', /Safe management policy/i],
  ] as const)('tells a signer how to permit a blocked %s', (action, expected) => {
    expect(describeGuardCheck({ status: 'no-policy' }, action)?.fix).toMatch(expected)
  })

  // Anything the engine does not model cannot be fixed by a policy the wizards offer.
  it('asks for a custom policy for any other action', () => {
    expect(describeGuardCheck({ status: 'no-policy' }, 'other')?.fix).toMatch(/custom policy/i)
    expect(describeGuardCheck({ status: 'no-policy' }, undefined)?.fix).toMatch(/custom policy/i)
  })

  it('separates a refusal of the transaction shape from a policy verdict', () => {
    const message = describeGuardCheck({ status: 'unsupported', reason: 'No gas refunds.' }, 'erc20-transfer')

    expect(message?.title).toMatch(/refuses this transaction/i)
    expect(message?.fix).toMatch(/gas refund/i)
  })

  // An unreadable revert must not be turned into a claim about the user's transaction.
  it('says nothing when the verdict could not be read', () => {
    expect(describeGuardCheck({ status: 'unknown' }, 'erc20-transfer')).toBeUndefined()
  })
})
