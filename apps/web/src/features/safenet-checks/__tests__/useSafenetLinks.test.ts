import { faker } from '@faker-js/faker'
import { renderHook } from '@/tests/test-utils'
import { useChain } from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'
import { AttestationVerificationStatus, CheckStatus, type Hex } from '@safe-global/utils/features/safenet-checks'
import { attestedEvent, buildBenignSnapshot, buildSnapshot } from '@safe-global/utils/features/safenet-checks/builders'
import { getSafenetExplorerUrl } from '../statusPresentation'
import { useSafenetLinks } from '../useSafenetLinks'

jest.mock('@/hooks/useChains', () => ({
  useChain: jest.fn(),
}))

const mockUseChain = useChain as jest.MockedFunction<typeof useChain>

const safenetChain = () =>
  chainBuilder()
    .with({
      chainId: '100',
      blockExplorerUriTemplate: {
        txHash: 'https://gnosisscan.io/tx/{{txHash}}',
        address: 'https://gnosisscan.io/address/{{address}}',
        api: '',
      },
    })
    .build()

describe('useSafenetLinks', () => {
  const safeChainId = faker.string.numeric(3)
  const safeTxHash = faker.string.hexadecimal({ length: 64, prefix: '0x', casing: 'lower' }) as Hex

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('links the attestation on the Safenet chain and the explorer by the Safe chain', () => {
    mockUseChain.mockReturnValue(safenetChain())
    const attested = attestedEvent({ safeTxHash })
    const snapshot = buildBenignSnapshot({
      safeTxHash,
      events: [attested],
      attestation: { status: AttestationVerificationStatus.VERIFIED, signatureId: attested.signatureId, message: null },
    })

    const { result } = renderHook(() => useSafenetLinks(CheckStatus.BENIGN, snapshot, safeChainId, safeTxHash))

    expect(mockUseChain).toHaveBeenCalledWith(snapshot.chainId)
    expect(result.current).toEqual({
      attestationHref: `https://gnosisscan.io/tx/${attested.transactionHash}`,
      explorerHref: getSafenetExplorerUrl(safeChainId, safeTxHash),
    })
  })

  it('gives no proof link for a BENIGN pinned before its snapshot arrives', () => {
    mockUseChain.mockReturnValue(safenetChain())

    const { result } = renderHook(() => useSafenetLinks(CheckStatus.BENIGN, undefined, safeChainId, safeTxHash))

    expect(result.current.attestationHref).toBeNull()
    expect(result.current.explorerHref).toBe(getSafenetExplorerUrl(safeChainId, safeTxHash))
  })

  it('never treats an attestation as proof outside a BENIGN verdict', () => {
    mockUseChain.mockReturnValue(safenetChain())
    const attested = attestedEvent({ safeTxHash })
    const snapshot = buildSnapshot({
      safeTxHash,
      status: CheckStatus.MALICIOUS,
      events: [attested],
      attestation: { status: AttestationVerificationStatus.VERIFIED, signatureId: attested.signatureId, message: null },
    })

    const { result } = renderHook(() => useSafenetLinks(CheckStatus.MALICIOUS, snapshot, safeChainId, safeTxHash))

    expect(result.current.attestationHref).toBeNull()
  })
})
