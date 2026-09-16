import {
  CONTRACT_ERROR_FALLBACK,
  getContractErrorMessage,
  getGs026Message,
} from '@safe-global/utils/services/exceptions/contractErrors'

/**
 * Mobile half of the cross-platform parity check (AC #2). The expected strings
 * below are identical to the web counterpart
 * (`apps/web/src/services/contracts/__tests__/contractErrorsParity.test.ts`),
 * proving web and mobile render the same text for the same code and that the
 * `@safe-global/utils` alias resolves the shared module in the mobile app.
 */
describe('contract error messages — mobile parity', () => {
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
