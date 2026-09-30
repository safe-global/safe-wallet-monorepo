import { PENDING_BANNER_TITLE, connectHelper, executeLine, signAndExecuteLine, signedAndWaitingLine } from './copy'

describe('pending banner copy', () => {
  it('tells a creating user the limit is not active yet', () => {
    expect(PENDING_BANNER_TITLE.create).toBe('The spending limit is not active as the transaction is not yet executed.')
  })

  // A queued removal leaves the policy enforced; the creation copy would say spending is blocked when it is not.
  it('tells a removing user the limit is still active', () => {
    expect(PENDING_BANNER_TITLE.remove).toBe('This spending limit is still active until the removal is executed.')
  })

  it('tells an updating user the current limits still apply', () => {
    expect(PENDING_BANNER_TITLE.update).toBe('The current limits still apply until the change is executed.')
  })
})

describe('action lines', () => {
  it.each([
    ['create', 'Sign and execute the transaction to activate.'],
    ['remove', 'Sign and execute the transaction to remove it.'],
    ['update', 'Sign and execute the transaction to apply the change.'],
  ] as const)('completes the sign-and-execute line for %s', (operation, expected) => {
    expect(signAndExecuteLine(operation)).toBe(expected)
  })

  it.each([
    ['create', 'Execute the transaction to activate.'],
    ['remove', 'Execute the transaction to remove it.'],
    ['update', 'Execute the transaction to apply the change.'],
  ] as const)('completes the execute line for %s', (operation, expected) => {
    expect(executeLine(operation)).toBe(expected)
  })
})

describe('connectHelper', () => {
  it('names the Safe whose signer wallet is wanted', () => {
    expect(connectHelper('Treasury')).toBe('Connect a signer wallet of Treasury to sign.')
  })
})

describe('signedAndWaitingLine', () => {
  // formatAwaitingSignatures returns an unterminated clause; the full stop belongs to this sentence only.
  it('punctuates the sentence once, and stays singular for the last signature', () => {
    expect(signedAndWaitingLine(1)).toBe("You've signed. Waiting for 1 more signature.")
  })

  it('pluralises beyond one', () => {
    expect(signedAndWaitingLine(2)).toBe("You've signed. Waiting for 2 more signatures.")
  })
})
