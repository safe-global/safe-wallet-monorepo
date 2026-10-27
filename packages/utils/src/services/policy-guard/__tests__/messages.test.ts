import { POLICY_MESSAGES } from '../messages'

const DATE = new Date(2026, 9, 23, 14, 30)

describe('POLICY_MESSAGES', () => {
  it.each([
    [
      'recipient-not-listed',
      POLICY_MESSAGES['recipient-not-listed']({ recipient: '0xMM…' }),
      "0xMM… is not on this account's recipient allowlist. This transaction will be refused.",
    ],
    [
      'address-book-not-listed',
      POLICY_MESSAGES['address-book-not-listed']({ name: 'Contractor payments' }),
      'Contractor payments is in your address book but not on this allowlist.',
    ],
    [
      'asset-out-of-scope',
      POLICY_MESSAGES['asset-out-of-scope']({ recipient: 'Payroll', allowedAsset: 'USDC', asset: 'DAI' }),
      'Payroll is listed for USDC only. DAI transfers to it are refused.',
    ],
    [
      'delay-pending',
      POLICY_MESSAGES['delay-pending']({ recipient: 'Vendor 4', date: DATE }),
      'Vendor 4 can receive funds from 23 Oct, 14:30. Until then this is refused.',
    ],
    [
      'batch-partly-refused',
      POLICY_MESSAGES['batch-partly-refused']({ refused: 2, total: 5 }),
      '2 of 5 transfers go to addresses not on the allowlist. The whole batch is refused.',
    ],
    [
      'no-policy-contract-call',
      POLICY_MESSAGES['no-policy-contract-call'](),
      'No policy covers contract calls on this account. Only transfers to listed addresses are allowed.',
    ],
    [
      'no-policy-nft',
      POLICY_MESSAGES['no-policy-nft'](),
      'No policy covers NFT transfers on this account. Only token and native transfers to listed addresses are allowed.',
    ],
    [
      'no-policy-safe-management',
      POLICY_MESSAGES['no-policy-safe-management'](),
      'No policy covers signer changes on this account. This is refused.',
    ],
  ])('%s is an error with the ticket copy', (_reason, result, message) => {
    expect(result).toEqual({ severity: 'error', message })
  })

  it('removal-pending warns with the date the recipient comes off the list', () => {
    expect(POLICY_MESSAGES['removal-pending']({ recipient: 'Contractor payments', date: DATE.getTime() })).toEqual({
      severity: 'warn',
      message: 'Contractor payments comes off the list on 23 Oct, 14:30. Execute before then or this will fail.',
    })
  })

  it('unavailable never reads as a pass', () => {
    expect(POLICY_MESSAGES.unavailable()).toEqual({
      severity: 'unavailable',
      message: "Couldn't read this account's allowlist. This transaction may be refused.",
    })
  })

  it('passed is the only pass', () => {
    expect(POLICY_MESSAGES.passed()).toEqual({ severity: 'pass', message: 'Policy checks passed' })
  })

  it('keeps default-decision copy apart from allowlist copy', () => {
    const defaultDecision = [
      POLICY_MESSAGES['no-policy-contract-call'](),
      POLICY_MESSAGES['no-policy-nft'](),
      POLICY_MESSAGES['no-policy-safe-management'](),
    ]
    const allowlist = [
      POLICY_MESSAGES['recipient-not-listed']({ recipient: '0x1' }),
      POLICY_MESSAGES['address-book-not-listed']({ name: 'A' }),
      POLICY_MESSAGES['asset-out-of-scope']({ recipient: 'A', allowedAsset: 'USDC', asset: 'DAI' }),
      POLICY_MESSAGES['delay-pending']({ recipient: 'A', date: DATE }),
      POLICY_MESSAGES['removal-pending']({ recipient: 'A', date: DATE }),
      POLICY_MESSAGES['batch-partly-refused']({ refused: 1, total: 2 }),
    ]

    defaultDecision.forEach(({ message }) => expect(message).toMatch(/^No policy covers/))
    allowlist.forEach(({ message }) => expect(message).not.toMatch(/No policy covers/))
  })
})
