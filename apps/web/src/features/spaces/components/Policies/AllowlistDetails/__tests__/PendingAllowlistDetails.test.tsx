import { faker } from '@faker-js/faker'
import type { ReactElement } from 'react'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { TxModalContext } from '@/components/tx-flow'
import type { PolicyConfiguration } from '@/features/policy-guard'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { MOCK_VIEWERS } from '../../mocks/policies'
import { mockPendingAllowlist } from '../../mocks/allowlistPolicies'
import { usePendingTransactionLinks } from '../../SpendingLimitDetails/hooks/usePendingSpendingLimitActions'
import ConfirmAllowlistFlow from '../../ConfirmAllowlistFlow'
import PendingAllowlistDetails from '../PendingAllowlistDetails'

jest.mock('../../SpendingLimitDetails/hooks/usePendingSpendingLimitActions', () => ({
  usePendingTransactionLinks: jest.fn(),
}))
jest.mock('../../hooks/usePolicyDetailsBase', () => ({
  usePolicyDetailsBase: () => ({
    viewer: { isSigner: true },
    safe: { address: '0x8675B754342754A30A2AeF474D114d8460bca19b', name: 'Payroll' },
    names: {},
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

const renderDetails = (isUnlisted = false) => {
  const setTxFlow = jest.fn()
  const policy = mockPendingAllowlist()
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

  it('should keep Review transaction disabled, when the queued transaction has not loaded yet', () => {
    mockLinks.mockReturnValue({ viewer: MOCK_VIEWERS.signer, transactionLink: 'https://app.safe.global/tx' })
    renderDetails()

    expect(screen.getByRole('button', { name: 'Review transaction' })).toBeDisabled()
  })
})
