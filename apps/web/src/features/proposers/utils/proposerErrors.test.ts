import { getProposerErrorText } from './proposerErrors'

const FALLBACK = 'Error adding proposer'

describe('getProposerErrorText', () => {
  it('maps a signature conflict from the gateway to the owner-already-confirmed copy', () => {
    const error = new Error('Signature for owner 0x4c3c38a459F0bAABB763290111B66ed01b5fEfA2 already exists')

    expect(getProposerErrorText(error, FALLBACK)).toBe(
      'The owner 0x4c3c...EfA2 already confirmed this request. Sign with a different owner to continue.',
    )
  })

  it('maps a signature conflict regardless of the gateway wording casing', () => {
    const error = new Error('signature for owner 0x4c3c38a459F0bAABB763290111B66ed01b5fEfA2 already exists.')

    expect(getProposerErrorText(error, FALLBACK)).toContain('already confirmed this request')
  })

  it('maps an ethers wallet rejection to the rejected-signature copy', () => {
    const error = Object.assign(new Error('ethers-user-denied'), { code: 'ACTION_REJECTED' })

    expect(getProposerErrorText(error, FALLBACK)).toBe('The signature request was rejected. Try again to continue.')
  })

  it('maps a WalletConnect rejection to the rejected-signature copy', () => {
    const error = new Error('User rejected the request')

    expect(getProposerErrorText(error, FALLBACK)).toBe('The signature request was rejected. Try again to continue.')
  })

  it('returns the fallback for an unmapped error', () => {
    expect(getProposerErrorText(new Error('HTTP Error 500'), FALLBACK)).toBe(FALLBACK)
  })

  it('returns the fallback when the conflict message carries no owner address', () => {
    expect(getProposerErrorText(new Error('Signature already exists'), FALLBACK)).toBe(FALLBACK)
  })
})
