import { faker } from '@faker-js/faker'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole } from '@/tests/mocks/roles'
import { mockSetTxFlow, safeScopeContextFor, TxModalWithScope, unwrapScopedFlow } from '@/tests/mocks/safeScope'
import { ReplaceTxFlow } from '@/components/tx-flow/flows'
import { PendingStatus } from '@/store/pendingTxsSlice'
import type { ExtendedSafeInfo } from '@safe-global/store/slices/SafeInfo/types'
import RejectTxButton from '.'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')

jest.mock('@/features/spending-limits', () => ({
  ...jest.requireActual('@/features/spending-limits'),
  useIsOnlySpendingLimitBeneficiary: jest.fn(),
}))

const NOT_CONNECTED = 'Please connect your wallet'

describe('RejectTxButton', () => {
  const txSummary = safeTxSummaryBuilder().build()

  const getRejectButton = () => screen.getByRole('button', { name: 'Reject' })

  let safe: ExtendedSafeInfo

  beforeEach(() => {
    jest.clearAllMocks()
    safe = mockSafeInfo({ deployed: true })
  })

  it('enables the button for an owner', () => {
    mockRole('owner')

    render(<RejectTxButton txSummary={txSummary} />)

    expect(getRejectButton()).toBeEnabled()
  })

  it('disables the button for a non-owner', () => {
    mockRole('nonOwner')

    render(<RejectTxButton txSummary={txSummary} />)

    expect(getRejectButton()).toBeDisabled()
  })

  it('disables the button and asks to connect when the wallet is disconnected', () => {
    mockRole('disconnected')

    render(<RejectTxButton txSummary={txSummary} />)

    expect(getRejectButton()).toBeDisabled()
    expect(screen.getByLabelText(NOT_CONNECTED)).toBeInTheDocument()
  })

  it('disables the button for an owner while the transaction is pending', () => {
    mockRole('owner')
    const pendingTxs = {
      [txSummary.id]: {
        chainId: safe.chainId,
        safeAddress: safe.address.value,
        nonce: faker.number.int({ max: 100 }),
        status: PendingStatus.SIGNING as const,
        signerAddress: faker.finance.ethereumAddress(),
      },
    }

    render(<RejectTxButton txSummary={txSummary} />, { initialReduxState: { pendingTxs } })

    expect(getRejectButton()).toBeDisabled()
  })

  describe('opening the replacement flow', () => {
    const clickReject = (scope?: ReturnType<typeof safeScopeContextFor>) => {
      mockRole('owner')
      const setTxFlow = mockSetTxFlow()
      render(
        <TxModalWithScope setTxFlow={setTxFlow} scope={scope}>
          <RejectTxButton txSummary={txSummary} />
        </TxModalWithScope>,
      )
      fireEvent.click(getRejectButton())
      expect(setTxFlow).toHaveBeenCalledTimes(1)
      return setTxFlow.mock.calls[0]
    }

    it('opens it unwrapped on a Safe-level page', () => {
      const [txFlow, onClose, shouldWarn] = clickReject()

      expect(txFlow?.type).toBe(ReplaceTxFlow)
      expect(onClose).toBeUndefined()
      expect(shouldWarn).toBe(false)
    })

    it("opens it inside the row's SafeScope", () => {
      const target = { chainId: faker.string.numeric(5), safeAddress: faker.finance.ethereumAddress() }

      const [txFlow] = clickReject(safeScopeContextFor(target))

      const { flow, target: flowTarget } = unwrapScopedFlow(txFlow)
      expect(flow?.type).toBe(ReplaceTxFlow)
      expect(flowTarget).toEqual(target)
    })
  })
})
