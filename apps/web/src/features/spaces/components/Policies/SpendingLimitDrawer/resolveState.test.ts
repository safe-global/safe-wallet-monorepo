import {
  MOCK_SAFE_NAME,
  MOCK_VIEWERS,
  asActivePolicy,
  mockActiveSpendingLimit,
  mockFullySignedPending,
  mockPendingPolicy,
  mockPendingRemoval,
  mockUnenforcedPolicy,
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
      helper: 'Only signers of this Safe account can edit this spending limit.',
    })
  })
})

describe('unenforced state', () => {
  const UNENFORCED = {
    kind: 'unenforced',
    action: 'manage',
    disabled: true,
    helper: 'The allowance module is not enabled on this Safe account, so this limit is not enforced.',
  }

  it.each([
    ['a signer', MOCK_VIEWERS.signer],
    ['a non-signer', MOCK_VIEWERS.nonSigner],
    ['no wallet', MOCK_VIEWERS.disconnected],
  ])('offers %s nothing to manage while the module is disabled', (_case, viewer) => {
    expect(resolve(asActivePolicy(mockUnenforcedPolicy()), viewer)).toEqual(UNENFORCED)
  })
})

describe('pending states', () => {
  const PENDING_CREATE_BANNER_TITLE = 'The spending limit is not active as the transaction is not yet executed.'

  it('state 4: a signer who has not signed reviews the transaction', () => {
    const state = resolve(mockPendingPolicy(), MOCK_VIEWERS.signer)

    expect(state).toEqual({
      kind: 'pending',
      operation: 'create',
      bannerTitle: PENDING_CREATE_BANNER_TITLE,
      action: 'review',
      bannerLine2: 'Sign and execute the transaction to activate.',
      signed: 1,
      required: 2,
    })
  })

  it('state 5: with no wallet the banner and the helper say different things', () => {
    const state = resolve(mockPendingPolicy(), MOCK_VIEWERS.disconnected)

    expect(state).toEqual({
      kind: 'pending',
      operation: 'create',
      bannerTitle: PENDING_CREATE_BANNER_TITLE,
      action: 'connect',
      bannerLine2: 'Connect a signer wallet to sign this transaction.',
      helper: 'Connect a signer wallet of Treasury to sign.',
      signed: 1,
      required: 2,
    })
  })

  it('state 6: a signer who has signed is told who is still missing', () => {
    const state = resolve(mockPendingPolicy(), MOCK_VIEWERS.signerWhoSigned)

    expect(state).toEqual({
      kind: 'pending',
      operation: 'create',
      bannerTitle: PENDING_CREATE_BANNER_TITLE,
      action: 'copy-link',
      bannerLine2: "You've signed. Waiting for 1 more signature.",
      signed: 1,
      required: 2,
    })
  })

  it('state 7: a non-signer gets the link and no second banner line', () => {
    const state = resolve(mockPendingPolicy(), MOCK_VIEWERS.nonSigner)

    expect(state).toEqual({
      kind: 'pending',
      operation: 'create',
      bannerTitle: PENDING_CREATE_BANNER_TITLE,
      action: 'copy-link',
      signed: 1,
      required: 2,
    })
  })

  it('state 8: a fully signed transaction only needs executing', () => {
    const state = resolve(mockFullySignedPending(), MOCK_VIEWERS.signer)

    expect(state).toEqual({
      kind: 'pending',
      operation: 'create',
      bannerTitle: PENDING_CREATE_BANNER_TITLE,
      action: 'review',
      bannerLine2: 'Execute the transaction to activate.',
      signed: 2,
      required: 2,
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

  // Anyone can execute a fully signed Safe transaction, so state 8 outranks state 6 too — a signer
  // who already signed should not be sent to a copy-link dead end reading "Waiting for 0 more signatures."
  it('offers a signer who already signed the review action once the transaction is fully signed', () => {
    expect(resolve(mockFullySignedPending(), MOCK_VIEWERS.signerWhoSigned)).toMatchObject({
      action: 'review',
      bannerLine2: 'Execute the transaction to activate.',
    })
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

describe('activating rows', () => {
  it('are not drawer policies, so they never resolve to the manage action', () => {
    // @ts-expect-error an executed change waiting for the indexer has nothing to manage or sign
    resolve({ ...mockPendingPolicy(), status: 'activating' }, MOCK_VIEWERS.signer)
  })
})
