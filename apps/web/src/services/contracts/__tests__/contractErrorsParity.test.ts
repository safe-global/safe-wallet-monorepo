import {
  CONTRACT_ERROR_FALLBACK,
  getContractErrorMessage,
  getGs026Message,
} from '@safe-global/utils/services/exceptions/contractErrors'

/**
 * Web half of the cross-platform parity check (AC #2). The mobile counterpart
 * (`apps/mobile/src/services/__tests__/contractErrorsParity.test.ts`) asserts
 * the exact same expected strings. Because both apps read the single shared
 * source, identical rendering is guaranteed — this locks it and also proves the
 * `@safe-global/utils` alias resolves the shared module in the web app.
 */
describe('contract error messages — web parity', () => {
  it('renders the shared text for each bucket', () => {
    expect(getContractErrorMessage('GS201')).toBe('Threshold cannot be higher than the number of signers')
    expect(getContractErrorMessage('GS000')).toBe('Could not set up your Safe Account. Refresh and try again.')
    expect(getContractErrorMessage('GS011', { nativeAsset: 'ETH' })).toBe(
      'Not enough ETH in this Safe Account to cover the network fee.',
    )
    expect(getContractErrorMessage('GS100')).toBe(CONTRACT_ERROR_FALLBACK)
    expect(getContractErrorMessage('GS026')).toBe(CONTRACT_ERROR_FALLBACK)
    expect(getGs026Message('NOT_SIGNER')).toBe(
      'This wallet is not a signer of this Safe Account. Connect a signer wallet.',
    )
  })
})
