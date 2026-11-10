import type { ComponentProps } from 'react'
import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import { useChain } from '@/hooks/useChains'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type {
  MultisigExecutionDetails,
  TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { AttestationVerificationStatus, CheckStatus, type Hex } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import {
  arbitrationTimedOutEvent,
  attestedEvent,
  buildBenignSnapshot,
  buildCheckView,
  buildSnapshot,
  disputeTriggeredEvent,
  oracleResultEvent,
  sentinelRevealedEvent,
} from '@safe-global/utils/features/safenet-checks/builders'
import SafenetDetailsCard, { SafenetDetailsCardView } from '../SafenetDetailsCard'
import { SAFENET_ATTESTATION_LINK_LABEL } from '../SafenetLinks'
import useWallet from '@/hooks/wallets/useWallet'
import type { ConnectedWallet } from '@/hooks/wallets/useOnboard'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import SafenetChecksSection from '../SafenetChecksSection'
import {
  MixpanelEventParams,
  SAFENET_EVENTS,
  SafenetCheckResult,
  SafenetSignerRole,
  trackEvent,
} from '@/services/analytics'

jest.mock('@/hooks/useChains', () => ({ useChain: jest.fn() }))
jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))
jest.mock('@/hooks/wallets/useWallet', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/services/analytics', () => ({ ...jest.requireActual('@/services/analytics'), trackEvent: jest.fn() }))

const safeTxHash = faker.string.hexadecimal({ length: 64, prefix: '0x', casing: 'lower' }) as Hex
const chainId = faker.string.numeric(3)

const renderView = (
  props: Pick<ComponentProps<typeof SafenetDetailsCardView>, 'publicStatus' | 'snapshot'>,
  defaultExpanded = true,
) =>
  render(
    <SafenetDetailsCardView {...props} safeTxHash={safeTxHash} chainId={chainId} defaultExpanded={defaultExpanded} />,
  )

describe('SafenetDetailsCardView', () => {
  it('shows the state on the collapsed header', () => {
    const snapshot = buildSnapshot({ safeTxHash, status: CheckStatus.MALICIOUS })

    renderView({ publicStatus: CheckStatus.MALICIOUS, snapshot }, false)

    expect(screen.getByTestId('safenet-details-card')).toHaveAttribute('data-status', CheckStatus.MALICIOUS)
    expect(screen.getByText('Risk detected')).toBeInTheDocument()
  })

  it('lists the cited rules on a risk, most-cited first', () => {
    const events = ['R-4.5', 'R-4.5', 'R-4.4'].map((reason) => sentinelRevealedEvent({ approved: false, reason }))

    renderView({
      publicStatus: CheckStatus.MALICIOUS,
      snapshot: buildSnapshot({ safeTxHash, status: CheckStatus.MALICIOUS, events }),
    })

    const body = screen.getByTestId('safenet-details-card').textContent ?? ''
    expect(body.indexOf('Unlimited approval')).toBeLessThan(body.indexOf('Unknown spender'))
    expect(screen.getByText('Flagged by 2 sentinels')).toBeInTheDocument()
    expect(screen.getByText('Flagged by 1 sentinel')).toBeInTheDocument()
  })

  it('links the attestation for a verified no-issues result', () => {
    const attested = attestedEvent({ safeTxHash })
    const attestation = {
      status: AttestationVerificationStatus.VERIFIED,
      signatureId: attested.signatureId,
      message: null,
    }
    jest.mocked(useChain).mockReturnValue({
      blockExplorerUriTemplate: { txHash: 'https://gnosisscan.io/tx/{{txHash}}', address: '', api: '' },
    } as Chain)

    renderView({
      publicStatus: CheckStatus.BENIGN,
      snapshot: buildBenignSnapshot({ safeTxHash, events: [attested], attestation }),
    })

    const link = screen.getByTestId('safenet-details-attestation')
    expect(link).toHaveAccessibleName(SAFENET_ATTESTATION_LINK_LABEL)
    expect(link).toHaveAttribute('href', `https://gnosisscan.io/tx/${attested.transactionHash}`)
  })

  it('shows no link while the check is in flight', () => {
    renderView({
      publicStatus: CheckStatus.IN_PROGRESS,
      snapshot: buildSnapshot({ safeTxHash, status: CheckStatus.IN_PROGRESS }),
    })

    expect(screen.getByText('Safenet is simulating this transaction.')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-details-explorer')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safenet-details-attestation')).not.toBeInTheDocument()
  })

  it('says why a check failed', () => {
    renderView({
      publicStatus: CheckStatus.TIMED_OUT,
      snapshot: buildSnapshot({ safeTxHash, status: CheckStatus.TIMED_OUT, events: [oracleResultEvent()] }),
    })

    expect(screen.getByTestId('safenet-failure-reason')).toHaveTextContent(
      'Sentinels voted, but the validators did not sign the result in time.',
    )
  })

  it('shows an open dispute as under review, not as a failed check', () => {
    renderView({
      publicStatus: CheckStatus.DISPUTED,
      snapshot: buildSnapshot({ safeTxHash, status: CheckStatus.DISPUTED, events: [disputeTriggeredEvent()] }),
    })

    const card = screen.getByTestId('safenet-details-card')
    expect(card).toHaveAttribute('data-status', CheckStatus.DISPUTED)
    expect(card).toHaveTextContent('Under review')
    expect(card).not.toHaveTextContent('Check failed')
    expect(card).not.toHaveTextContent('You can still continue')
    expect(screen.getByText(/the dispute is open\. Safenet will publish a final ruling\./)).toBeInTheDocument()
    expect(screen.getByTestId('safenet-failure-reason')).toHaveTextContent('Sentinels disagreed. The dispute is open.')
    expect(screen.getByTestId('safenet-details-explorer')).toBeInTheDocument()
  })

  it('keeps "no final ruling" for an arbitration that timed out', () => {
    renderView({
      publicStatus: CheckStatus.TIMED_OUT,
      snapshot: buildSnapshot({
        safeTxHash,
        status: CheckStatus.TIMED_OUT,
        events: [disputeTriggeredEvent(), arbitrationTimedOutEvent()],
      }),
    })

    expect(screen.getByTestId('safenet-failure-reason')).toHaveTextContent(
      'Sentinels disagreed, and the dispute got no final ruling.',
    )
  })
})

describe('SafenetDetailsCard', () => {
  it('renders nothing when no check was observed', () => {
    jest.mocked(useSafenetCheck).mockReturnValue(buildCheckView())

    const { container } = render(<SafenetDetailsCard safeTxHash={safeTxHash} chainId={chainId} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the card once a check is read', () => {
    const snapshot = buildBenignSnapshot({ safeTxHash })
    jest
      .mocked(useSafenetCheck)
      .mockReturnValue(buildCheckView({ snapshot, status: CheckStatus.BENIGN, publicStatus: CheckStatus.BENIGN }))

    render(<SafenetDetailsCard safeTxHash={safeTxHash} chainId={chainId} />)

    expect(screen.getByTestId('safenet-details-card')).toHaveAttribute('data-status', CheckStatus.BENIGN)
  })
})

describe('SafenetDetailsCard Mixpanel tracking', () => {
  const WALLET = '0x00000000000000000000000000000000000000a1'
  const OTHER = '0x00000000000000000000000000000000000000b2'
  const newHash = () => faker.string.hexadecimal({ length: 64, prefix: '0x', casing: 'lower' }) as Hex
  const confirmation = (signer: string, submittedAt: number) => ({ signer: { value: signer }, submittedAt })
  const executionInfo = (over: Partial<MultisigExecutionDetails> = {}) =>
    ({
      signers: [{ value: WALLET }, { value: OTHER }],
      confirmations: [confirmation(OTHER, 1_000)],
      executor: null,
      ...over,
    }) as MultisigExecutionDetails
  const showRisk = (hash: Hex) => {
    const events = [false, true].map((approved) => sentinelRevealedEvent({ approved, reason: approved ? '' : 'R-4.2' }))
    const snapshot = buildSnapshot({ safeTxHash: hash, status: CheckStatus.MALICIOUS, events })
    const status = CheckStatus.MALICIOUS
    jest.mocked(useSafenetCheck).mockReturnValue(buildCheckView({ snapshot, status, publicStatus: status }))
  }

  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(useWallet).mockReturnValue({ address: WALLET } as ConnectedWallet)
  })

  const txDetails = { detailedExecutionInfo: { type: 'MULTISIG', submittedAt: 1 } } as unknown as TransactionDetails
  const section = (hash: Hex, over: Partial<TxFlowContextType> = {}) => (
    <TxFlowContext.Provider value={{ txId: `multisig_${WALLET}_${hash}`, txDetails, ...over } as TxFlowContextType}>
      <SafenetChecksSection />
    </TxFlowContext.Provider>
  )
  const card = (hash: Hex, props: Partial<ComponentProps<typeof SafenetDetailsCard>> = {}) => (
    <SafenetDetailsCard
      safeTxHash={hash}
      chainId={defaultSafeInfo.chainId}
      executionInfo={executionInfo()}
      isQueued
      {...props}
    />
  )
  const rolesTracked = () =>
    jest.mocked(trackEvent).mock.calls.map(([, params]) => params?.[MixpanelEventParams.SIGNER_ROLE])

  it.each<[string, Partial<MultisigExecutionDetails>, boolean, SafenetSignerRole | undefined]>([
    ['signed first', { confirmations: [confirmation(WALLET, 1)] }, false, SafenetSignerRole.FIRST_SIGNER],
    ['executed the transaction', { executor: { value: WALLET } }, false, SafenetSignerRole.EXECUTOR],
    [
      'signed first and executed the transaction',
      { confirmations: [confirmation(WALLET, 1)], executor: { value: WALLET } },
      false,
      SafenetSignerRole.EXECUTOR,
    ],
    [
      'signed after the first signer, listed before them',
      { confirmations: [confirmation(WALLET, 2), confirmation(OTHER, 1)] },
      false,
      SafenetSignerRole.CO_SIGNER,
    ],
    ['can still sign a queued transaction', {}, true, SafenetSignerRole.CO_SIGNER],
    ['cannot sign a transaction that is no longer queued', {}, false, undefined],
    ['is not an owner', { signers: [{ value: OTHER }] }, true, undefined],
  ])('tracks the risk with the role of a wallet that %s', (_title, over, isQueued, role) => {
    const hash = newHash()
    showRisk(hash)

    render(card(hash, { isQueued, executionInfo: executionInfo(over) }))

    expect(trackEvent).toHaveBeenCalledTimes(1)
    expect(trackEvent).toHaveBeenCalledWith(SAFENET_EVENTS.CHECKED, {
      [MixpanelEventParams.SAFE_TX_HASH]: hash,
      [MixpanelEventParams.RESULT]: SafenetCheckResult.RISK_DETECTED,
      [MixpanelEventParams.RULES_FLAGGED]: ['R-4.2'],
      [MixpanelEventParams.SENTINELS_FLAGGED]: '1 of 2',
      ...(role && { [MixpanelEventParams.SIGNER_ROLE]: role }),
    })
  })

  it('tracks again when a wallet connects and gets a role, and not on remount', () => {
    const hash = newHash()
    showRisk(hash)
    jest.mocked(useWallet).mockReturnValue(null)
    const { rerender, unmount } = render(card(hash))
    expect(rolesTracked()).toEqual([undefined])

    jest.mocked(useWallet).mockReturnValue({ address: WALLET } as ConnectedWallet)
    rerender(card(hash))
    expect(rolesTracked()).toEqual([undefined, SafenetSignerRole.CO_SIGNER])
    unmount()
    render(card(hash))

    expect(rolesTracked()).toEqual([undefined, SafenetSignerRole.CO_SIGNER])
  })

  it('tracks again when a co-signer opens the flow and executes', () => {
    const hash = newHash()
    showRisk(hash)

    render(card(hash))
    render(section(hash, { willExecute: true }))

    expect(rolesTracked()).toEqual([SafenetSignerRole.CO_SIGNER, SafenetSignerRole.EXECUTOR])
  })

  it('tracks one check, result and role once across remounts and across the flow section and the card', () => {
    const hash = newHash()
    showRisk(hash)

    render(section(hash)).unmount()
    render(section(hash))
    expect(trackEvent).toHaveBeenCalledTimes(1)
    render(card(hash))

    expect(trackEvent).toHaveBeenCalledTimes(1)
  })

  it('never tracks the snapshot of one transaction under the hash of another', () => {
    const [first, second] = [newHash(), newHash()]
    showRisk(first)

    const { rerender } = render(card(first))
    rerender(card(second))

    const hashes = jest.mocked(trackEvent).mock.calls.map(([, params]) => params?.[MixpanelEventParams.SAFE_TX_HASH])
    expect(hashes).toEqual([first])
  })
})
