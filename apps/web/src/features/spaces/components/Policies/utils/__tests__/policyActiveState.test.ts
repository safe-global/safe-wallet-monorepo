import {
  MOCK_ADDRESSES,
  asActivePolicy,
  mockProposerPolicy,
  mockRecoveryPolicy,
  mockSpendingLimitPolicy,
} from '../../mocks/policies'
import { getActiveStateHelperText, getPolicyActiveState, isOrphanedProposerGrant } from '../policyActiveState'

describe('getPolicyActiveState', () => {
  it('should, when the connected wallet is a signer of the Safe, report the signer state', () => {
    expect(getPolicyActiveState(MOCK_ADDRESSES.alice, [MOCK_ADDRESSES.alice, MOCK_ADDRESSES.bob])).toBe('signer')
  })

  it('should, when the connected wallet is a signer written in a different case, still report the signer state', () => {
    expect(getPolicyActiveState(MOCK_ADDRESSES.alice.toLowerCase(), [MOCK_ADDRESSES.alice])).toBe('signer')
  })

  it('should, when no wallet is connected, report the no-wallet state', () => {
    expect(getPolicyActiveState(undefined, [MOCK_ADDRESSES.alice])).toBe('no-wallet')
  })

  it('should, when the connected wallet is not a signer of the Safe, report the not-signer state', () => {
    expect(getPolicyActiveState(MOCK_ADDRESSES.unresolved, [MOCK_ADDRESSES.alice])).toBe('not-signer')
  })
})

describe('getActiveStateHelperText', () => {
  it('should, when no wallet is connected, say which kind of wallet is needed', () => {
    expect(getActiveStateHelperText('no-wallet', asActivePolicy(mockSpendingLimitPolicy()))).toBe(
      'Connect a signer wallet to edit.',
    )
  })

  it('should, when the wallet is not a signer of a spending limit, name the spending limit', () => {
    expect(getActiveStateHelperText('not-signer', asActivePolicy(mockSpendingLimitPolicy()))).toBe(
      'Only signers of this Safe account can delete or edit this spending limit.',
    )
  })

  it('should, when the wallet is not a signer of a recovery, name the recovery policy', () => {
    expect(getActiveStateHelperText('not-signer', asActivePolicy(mockRecoveryPolicy()))).toBe(
      'Only signers of this Safe account can delete or edit this recovery policy.',
    )
  })

  it('should, when the wallet is a signer, return no helper text', () => {
    expect(getActiveStateHelperText('signer', asActivePolicy(mockSpendingLimitPolicy()))).toBeNull()
  })
})

describe('isOrphanedProposerGrant', () => {
  it('should, when the signer who granted the proposer is no longer an owner, report the grant as orphaned', () => {
    expect(isOrphanedProposerGrant(asActivePolicy(mockProposerPolicy()), [MOCK_ADDRESSES.bob])).toBe(true)
  })

  it('should, when the signer who granted the proposer is still an owner, report the grant as not orphaned', () => {
    expect(isOrphanedProposerGrant(asActivePolicy(mockProposerPolicy()), [MOCK_ADDRESSES.alice])).toBe(false)
  })

  it('should, when the policy is enforced by a module, report it as not orphaned', () => {
    expect(isOrphanedProposerGrant(asActivePolicy(mockSpendingLimitPolicy()), [])).toBe(false)
  })
})
