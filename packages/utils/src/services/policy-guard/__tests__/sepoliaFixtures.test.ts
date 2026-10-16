import { decodeGuardCheckFailure } from '../checkTransaction'

/**
 * Revert data captured from `eth_call` against the SafePolicyGuard at
 * 0x5202B1ebE100812437d47eae769e155945fbba6a on Sepolia, for Safe
 * 0xB4117948d9977ad44b4dadBA5D6E7e3793b78e97. Kept verbatim so the decoder is held against
 * what the chain actually returns rather than what the ABI suggests it should.
 */
const SEPOLIA = {
  erc20ToStranger:
    '0xcaa49c3300000000000000000000000025dda3b8974a10e93ca188f9c149a42f938bd1870000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000482b4290000000000000000000000000000000000000000000000000000000000',
  nativeToStranger: '0x0504a20d0000000000000000000000000000000000000000000000000000000000000000',
  enableModuleUnderDenyPolicy: '0x0504a20d000000000000000000000000348d9f0b2fecb0bf88655c74ed3efd5052a9e436',
  multiSendWrappingABlockedTransfer:
    '0xcaa49c33000000000000000000000000f933ec646f9cd6dd27ae2f808d133d3f5847210c000000000000000000000000000000000000000000000000000000000000004000000000000000000000000000000000000000000000000000000000000000240504a20d000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
}

describe('decodeGuardCheckFailure — against revert data captured from Sepolia', () => {
  it('reads an ERC20 transfer to a recipient outside the allowlist', () => {
    expect(decodeGuardCheckFailure(SEPOLIA.erc20ToStranger)).toEqual({
      status: 'denied',
      policy: '0x25DDa3b8974a10E93ca188F9C149A42F938Bd187',
      reason: 'Unauthorized',
    })
  })

  it('reads a native transfer no policy covers', () => {
    expect(decodeGuardCheckFailure(SEPOLIA.nativeToStranger)).toEqual({ status: 'no-policy' })
  })

  it('reads an action a Deny policy is bound to', () => {
    expect(decodeGuardCheckFailure(SEPOLIA.enableModuleUnderDenyPolicy)).toEqual({
      status: 'denied',
      policy: '0x348d9F0B2fECb0bF88655C74Ed3eFD5052A9E436',
    })
  })

  // The chain blames MultiSendPolicy; the user has to act on the inner call instead.
  it('reads a batch through to the verdict on the call inside it', () => {
    expect(decodeGuardCheckFailure(SEPOLIA.multiSendWrappingABlockedTransfer)).toEqual({ status: 'no-policy' })
  })
})
