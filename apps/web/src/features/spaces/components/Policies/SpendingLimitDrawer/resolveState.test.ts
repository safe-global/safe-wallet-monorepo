import {
  MOCK_SAFE_NAME,
  MOCK_VIEWERS,
  mockActiveSpendingLimit,
  mockFullySignedPending,
  mockPendingPolicy,
  mockPendingRemoval,
} from '../mocks/policies'
import { resolveSpendingLimitDrawerState } from './resolveState'

const resolve = (
  policy: Parameters<typeof resolveSpendingLimitDrawerState>[0],
  viewer: Parameters<typeof resolveSpendingLimitDrawerState>[1],
) => resolveSpendingLimitDrawerState(policy, viewer, MOCK_SAFE_NAME)

describe('active states', () => {
  it('state 1: a connected signer can manage the limit', () => {
    expect(resolve(mockActiveSpendingLimit(), MOCK_VIEWERS.signer)).toEqual({
      kind: 'active',
      action: 'manage',
      disabled: false,
    })
  })

  it('state 2: with no wallet the only action is connecting one', () => {
    expect(resolve(mockActiveSpendingLimit(), MOCK_VIEWERS.disconnected)).toEqual({
      kind: 'active',
      action: 'connect',
      disabled: false,
      helper: 'Connect a signer wallet to edit.',
    })
  })

  it('state 3: a connected non-signer sees the actions disabled and why', () => {
    expect(resolve(mockActiveSpendingLimit(), MOCK_VIEWERS.nonSigner)).toEqual({
      kind: 'active',
      action: 'manage',
      disabled: true,
      helper: 'Only signers of this Safe account can delete or edit this spending limit.',
    })
  })
})

describe('pending states', () => {
  it('state 4: a signer who has not signed reviews the transaction', () => {
    const state = resolve(mockPendingPolicy(), MOCK_VIEWERS.signer)

    expect(state).toMatchObject({
      kind: 'pending',
      action: 'review',
      bannerLine2: 'Sign and execute the transaction to activate.',
      signed: 1,
      required: 2,
    })
  })

  it('state 5: with no wallet the banner and the helper say different things', () => {
    const state = resolve(mockPendingPolicy(), MOCK_VIEWERS.disconnected)

    expect(state).toMatchObject({
      action: 'connect',
      bannerLine2: 'Connect a signer wallet to sign this transaction.',
      helper: 'Connect a signer wallet of Treasury to sign.',
    })
  })

  it('state 6: a signer who has signed is told who is still missing', () => {
    const state = resolve(mockPendingPolicy(), MOCK_VIEWERS.signerWhoSigned)

    expect(state).toMatchObject({
      action: 'copy-link',
      bannerLine2: "You've signed. Waiting for 1 more signature.",
    })
  })

  it('state 7: a non-signer gets the link and no second banner line', () => {
    const state = resolve(mockPendingPolicy(), MOCK_VIEWERS.nonSigner)

    expect(state).toMatchObject({ action: 'copy-link' })
    expect(state).not.toHaveProperty('bannerLine2', expect.any(String))
  })

  it('state 8: a fully signed transaction only needs executing', () => {
    const state = resolve(mockFullySignedPending(), MOCK_VIEWERS.signer)

    expect(state).toMatchObject({
      action: 'review',
      bannerLine2: 'Execute the transaction to activate.',
    })
  })
})

describe('precedence', () => {
  // Anyone can execute a fully signed Safe transaction, so state 8 outranks state 7.
  it('offers a non-signer the review action once the transaction is fully signed', () => {
    expect(resolve(mockFullySignedPending(), MOCK_VIEWERS.nonSigner)).toMatchObject({ action: 'review' })
  })

  // A disconnected viewer cannot execute anything, so state 5 outranks state 8.
  it('still asks a disconnected viewer to connect when the transaction is fully signed', () => {
    expect(resolve(mockFullySignedPending(), MOCK_VIEWERS.disconnected)).toMatchObject({ action: 'connect' })
  })
})

describe('operation', () => {
  it('tells a removal viewer the limit is still enforced', () => {
    const state = resolve(mockPendingRemoval(), MOCK_VIEWERS.signer)

    expect(state).toMatchObject({
      operation: 'remove',
      bannerTitle: 'This spending limit is still active until the removal is executed.',
      bannerLine2: 'Sign and execute the transaction to remove it.',
    })
  })
})
