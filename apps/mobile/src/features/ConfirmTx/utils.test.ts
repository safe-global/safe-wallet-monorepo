import { extractAppSigners } from './utils'
import { SignerInfo } from '@/src/types/address'
import { MultisigExecutionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { getSafeWebAuthnSignerFactoryDeployment } from '@safe-global/safe-modules-deployments'

jest.mock('@safe-global/safe-modules-deployments', () => ({
  getSafeWebAuthnSignerFactoryDeployment: jest.fn(),
}))

const pkSigner: SignerInfo = {
  value: '0x1111111111111111111111111111111111111111',
  name: null,
  logoUri: null,
  type: 'private-key',
}

const passkeySigner: SignerInfo = {
  value: '0x2222222222222222222222222222222222222222',
  name: null,
  logoUri: null,
  type: 'passkey',
  rawId: 'test-raw-id',
}

const signers: Record<string, SignerInfo> = {
  [pkSigner.value]: pkSigner,
  [passkeySigner.value]: passkeySigner,
}

const detailedExecutionInfo = {
  signers: [{ value: pkSigner.value }, { value: passkeySigner.value }],
} as unknown as MultisigExecutionDetails

describe('extractAppSigners', () => {
  it('should return matching signers', () => {
    const result = extractAppSigners(signers, detailedExecutionInfo)

    expect(result).toHaveLength(2)
    expect(result).toEqual([pkSigner, passkeySigner])
  })

  it('should return empty array when no execution info', () => {
    const result = extractAppSigners(signers, undefined)

    expect(result).toEqual([])
  })

  it('should filter out passkey signers on unsupported chains', () => {
    ;(getSafeWebAuthnSignerFactoryDeployment as jest.Mock).mockReturnValue(null)

    const chain = { chainId: '999' } as unknown as Chain
    const result = extractAppSigners(signers, detailedExecutionInfo, chain)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual(pkSigner)
  })

  it('should include passkey signers on supported chains', () => {
    ;(getSafeWebAuthnSignerFactoryDeployment as jest.Mock).mockReturnValue({
      networkAddresses: { '11155111': '0x1d31F259eE307358a26dFb23EB365939E8641195' },
    })

    const chain = { chainId: '11155111' } as unknown as Chain
    const result = extractAppSigners(signers, detailedExecutionInfo, chain)

    expect(result).toHaveLength(2)
  })

  it('should include all signers when no chain is provided', () => {
    const result = extractAppSigners(signers, detailedExecutionInfo)

    expect(result).toHaveLength(2)
  })
})
