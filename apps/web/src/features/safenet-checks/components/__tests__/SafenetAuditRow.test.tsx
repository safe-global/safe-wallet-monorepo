import { render, screen } from '@/tests/test-utils'
import { useChain } from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { AttestationVerificationStatus, CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck, type SafenetCheckView } from '@safe-global/utils/features/safenet-checks/hooks'
import {
  buildBenignSnapshot,
  buildSnapshot,
  plainAttestedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import { formatAuditDateTime } from '@/components/common/AuditLog'
import { SafenetAuditRow } from '../SafenetAuditRow'

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))
jest.mock('@/hooks/useChains', () => ({
  useChain: jest.fn(),
}))

const mockUseSafenetCheck = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>
const mockUseChain = useChain as jest.MockedFunction<typeof useChain>

const HASH = `0x${'ab'.repeat(32)}`

const view = (over: Partial<SafenetCheckView> = {}): SafenetCheckView => ({
  snapshot: undefined,
  status: CheckStatus.UNAVAILABLE,
  publicStatus: CheckStatus.UNAVAILABLE,
  isLoading: false,
  isFetching: false,
  isStale: false,
  refetch: jest.fn(),
  ...over,
})

describe('SafenetAuditRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing before the first snapshot (no phantom step per transaction)', () => {
    mockUseSafenetCheck.mockReturnValue(view({ isLoading: true }))

    const { container } = render(<SafenetAuditRow safeTxHash={HASH} chainId="100" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when no check was observed (UNAVAILABLE)', () => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.UNAVAILABLE })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.UNAVAILABLE, publicStatus: CheckStatus.UNAVAILABLE }),
    )

    const { container } = render(<SafenetAuditRow safeTxHash={HASH} chainId="100" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders a Simulating step by Safenet while the check is in flight', () => {
    const snapshot = buildSnapshot({ safeTxHash: HASH as `0x${string}`, status: CheckStatus.IN_PROGRESS })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.IN_PROGRESS, publicStatus: CheckStatus.IN_PROGRESS }),
    )

    render(<SafenetAuditRow safeTxHash={HASH} chainId="100" />)

    expect(screen.getByText('Simulating')).toBeInTheDocument()
    expect(screen.getByText('By Safenet')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-attestation-link')).not.toBeInTheDocument()
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument()
  })

  it('links the attestation transaction on the Safenet chain block explorer once FROST-verified', () => {
    const attested = plainAttestedEvent({ safeTxHash: HASH as `0x${string}` })
    const snapshot = buildBenignSnapshot({ safeTxHash: HASH as `0x${string}`, events: [attested] })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
    )
    mockUseChain.mockReturnValue({
      blockExplorerUriTemplate: {
        txHash: 'https://gnosisscan.io/tx/{{txHash}}',
        address: 'https://gnosisscan.io/address/{{address}}',
        api: '',
      },
    } as Chain)

    render(<SafenetAuditRow safeTxHash={HASH} chainId="1" />)

    expect(screen.getByText('No issues found')).toBeInTheDocument()
    // "By Safenet" with "Safenet" as the link — the actor line IS the proof link.
    expect(screen.getByText(/^By/)).toBeInTheDocument()
    expect(screen.getByTestId('safenet-attestation-link')).toHaveTextContent('Safenet')
    expect(screen.getByTestId('safenet-attestation-link')).toHaveAttribute(
      'href',
      `https://gnosisscan.io/tx/${attested.transactionHash}`,
    )
  })

  it('falls back to the Safenet explorer hash route when the chain config is unknown', () => {
    const snapshot = buildBenignSnapshot({ safeTxHash: HASH as `0x${string}` })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
    )
    mockUseChain.mockReturnValue(undefined)

    render(<SafenetAuditRow safeTxHash={HASH} chainId="1" />)

    expect(screen.getByTestId('safenet-attestation-link')).toHaveAttribute(
      'href',
      `https://explorer.safenet-beta.eth.limo/#/safeTx?chainId=1&safeTxHash=${HASH}`,
    )
  })

  it('dates the No-issues step from the attested block', () => {
    // 2026-08-03T09:39:45Z — the block the attestation landed in, not read time.
    const snapshot = buildBenignSnapshot({ safeTxHash: HASH as `0x${string}`, attestedAtMs: 1_785_749_985_000 })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
    )

    render(<SafenetAuditRow safeTxHash={HASH} chainId="1" />)

    expect(screen.getByText(formatAuditDateTime(1_785_749_985_000))).toBeInTheDocument()
  })

  it('renders No issues found without a date when the attested header could not be read', () => {
    const snapshot = buildBenignSnapshot({ safeTxHash: HASH as `0x${string}`, attestedAtMs: null })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
    )

    render(<SafenetAuditRow safeTxHash={HASH} chainId="1" />)

    expect(screen.getByText('No issues found')).toBeInTheDocument()
    expect(screen.queryByText(/2026/)).not.toBeInTheDocument()
  })

  it('keeps the link when a pinned BENIGN outlives a refetch that lost the attestation', () => {
    // Reorg / flaky-RPC refetch: merged status stays BENIGN (monotonic pin) but
    // the fresh snapshot no longer carries a verified attestation.
    const snapshot = buildSnapshot({
      safeTxHash: HASH as `0x${string}`,
      status: CheckStatus.BENIGN,
      attestation: { status: AttestationVerificationStatus.UNVERIFIED, signatureId: null, message: null },
    })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }),
    )

    render(<SafenetAuditRow safeTxHash={HASH} chainId="1" />)

    expect(screen.getByText('No issues found')).toBeInTheDocument()
    expect(screen.getByTestId('safenet-attestation-link')).toBeInTheDocument()
  })

  it.each([
    ['INVALID', AttestationVerificationStatus.INVALID],
    ['VERIFIED', AttestationVerificationStatus.VERIFIED],
  ])('renders Risk detected without a link when MALICIOUS (attestation %s)', (_name, attestationStatus) => {
    const snapshot = buildSnapshot({
      safeTxHash: HASH as `0x${string}`,
      status: CheckStatus.MALICIOUS,
      attestation: { status: attestationStatus, signatureId: null, message: null },
    })
    mockUseSafenetCheck.mockReturnValue(
      view({ snapshot, status: CheckStatus.MALICIOUS, publicStatus: CheckStatus.MALICIOUS }),
    )

    render(<SafenetAuditRow safeTxHash={HASH} chainId="100" />)

    expect(screen.getByText('Risk detected')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-attestation-link')).not.toBeInTheDocument()
  })
})
