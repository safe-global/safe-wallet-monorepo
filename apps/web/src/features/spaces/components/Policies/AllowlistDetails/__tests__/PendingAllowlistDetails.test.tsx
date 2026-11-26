import { faker } from '@faker-js/faker'
import type { ReactElement } from 'react'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { TxModalContext } from '@/components/tx-flow'
import type { PolicyConfiguration } from '@/features/policy-guard/public/types'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { MOCK_ADDRESSES, MOCK_VIEWERS } from '../../../../public/utils/policies'
import {
  mockFailedAllowlist,
  mockFullySignedPendingAllowlist,
  mockPendingAllowlist,
  mockPendingAllowlistEdit,
} from '../../../../public/utils/allowlistPolicies'
import type { PendingAllowlistPolicy } from '@safe-global/views/features/spaces/components/Policies/types'
import { usePendingTransactionLinks } from '../../SpendingLimitDetails/hooks/usePendingSpendingLimitActions'
import ConfirmAllowlistFlow from '../../ConfirmAllowlistFlow'
import PendingAllowlistDetails from '../PendingAllowlistDetails'

jest.mock('../../SpendingLimitDetails/hooks/usePendingSpendingLimitActions', () => ({
  usePendingTransactionLinks: jest.fn(),
}))
jest.mock('../../hooks/usePolicyDetailsBase', () => ({
  usePolicyDetailsBase: (_: unknown, addresses: string[]) => ({
    viewer: { isSigner: true },
    safe: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Payroll' },
    names: Object.fromEntries(addresses.map((address) => [address, `Book ${address.slice(-4)}`])),
    onConnectWallet: jest.fn(),
  }),
}))
jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = () => <img alt="chain" />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

const mockLinks = usePendingTransactionLinks as jest.MockedFunction<typeof usePendingTransactionLinks>

const requestedConfigurations: PolicyConfiguration[] = [
  {
    target: faker.finance.ethereumAddress(),
    selector: '0xa9059cbb',
    operation: 0,
    policy: faker.finance.ethereumAddress(),
    data: '0x',
  },
]

const serveSafeNonce = (currentNonce: number) =>
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/nonces`, () =>
      HttpResponse.json({ currentNonce, recommendedNonce: currentNonce + 1 }),
    ),
  )

const renderDetails = (isUnlisted = false, policy: PendingAllowlistPolicy = mockPendingAllowlist()) => {
  const setTxFlow = jest.fn()
  const view = renderWithUserEvent(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <PendingAllowlistDetails
        policy={policy}
        isUnlisted={isUnlisted}
        requestedConfigurations={requestedConfigurations}
        onClose={jest.fn()}
      />
    </TxModalContext.Provider>,
  )

  return { ...view, setTxFlow, policy }
}

describe('PendingAllowlistDetails', () => {
  const txSummary = safeTxSummaryBuilder().build()

  beforeEach(() => {
    mockLinks.mockReturnValue({ viewer: MOCK_VIEWERS.signer, transactionLink: 'https://app.safe.global/tx', txSummary })
  })

  it('should open the queued transaction on its review step, when Review transaction is clicked', async () => {
    const { user, setTxFlow, policy } = renderDetails()

    await user.click(screen.getByRole('button', { name: 'Review transaction' }))

    const [[flow]] = setTxFlow.mock.calls as [[ReactElement<Record<string, unknown>>]]
    expect(flow.type).toBe(ConfirmAllowlistFlow)
    expect(flow.props).toEqual({
      chainId: policy.safe.chainId,
      safeAddress: policy.safe.address,
      txSummary,
      requestedConfigurations,
    })
  })

  it('should show the address book name of a recipient a pending edit removes', () => {
    renderDetails(false, mockPendingAllowlistEdit())

    const removed = screen.getAllByTestId('allowlist-recipient')[3]
    expect(removed).toHaveTextContent(`Book ${MOCK_ADDRESSES.unresolved.slice(-4)}`)
    expect(removed).toHaveTextContent('Removed')
  })

  it('should keep Review transaction disabled, when the queued transaction has not loaded yet', () => {
    mockLinks.mockReturnValue({ viewer: MOCK_VIEWERS.signer, transactionLink: 'https://app.safe.global/tx' })
    renderDetails()

    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeDisabled()
  })

  it('should, when a fully signed transaction waits for a lower nonce, tell to execute those first and disable Review transaction', async () => {
    const policy = mockFullySignedPendingAllowlist()
    serveSafeNonce(policy.nonce - faker.number.int({ min: 1, max: 5 }))

    renderDetails(false, policy)

    expect(
      await screen.findByText('First execute the transactions with a lower nonce in the queue of Payroll.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeDisabled()
  })

  it("should, while the row is listed, show the row's status rather than one read from its transaction", () => {
    mockLinks.mockReturnValue({
      viewer: MOCK_VIEWERS.signer,
      txSummary,
      confirmationsSubmitted: 2,
      outcome: 'executed',
    })

    renderDetails(false, mockPendingAllowlist({ confirmationsSubmitted: 1, confirmationsRequired: 2 }))

    expect(screen.getByTestId('allowlist-status-tags')).toHaveTextContent('Pending · 1/2')
  })

  it('should, when the row has left the list and its transaction executed, show it as processing', () => {
    mockLinks.mockReturnValue({ viewer: MOCK_VIEWERS.signer, txSummary, outcome: 'executed' })

    renderDetails(true)

    expect(screen.getByTestId('policy-status-processing')).toHaveTextContent('Processing')
    expect(screen.getByText('The transaction was executed.')).toBeInTheDocument()
  })

  it('should, when the row has left the list because its transaction was deleted, show it as failed and say why', () => {
    mockLinks.mockReturnValue({ viewer: MOCK_VIEWERS.signer, outcome: 'deleted' })

    renderDetails(true)

    expect(screen.getByTestId('policy-status-failed')).toHaveTextContent('Failed')
    expect(screen.getByRole('alert')).toHaveTextContent('The transaction was deleted.')
  })

  it('should, when a failed row was replaced by another transaction, say so', () => {
    mockLinks.mockReturnValue({ viewer: MOCK_VIEWERS.signer, outcome: 'replaced' })

    renderDetails(false, mockFailedAllowlist())

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Another transaction used this nonce, so this one can no longer be executed.',
    )
  })
})
