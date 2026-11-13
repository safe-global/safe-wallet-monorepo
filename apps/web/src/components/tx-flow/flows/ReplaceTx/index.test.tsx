import type { ReactElement, ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { mockHasFeature, mockWallet } from '@/tests/mocks/hooks'
import { safeTxSummaryBuilder, txInfoBuilder } from '@/tests/builders/safeTx'
import { TxModalContext } from '@/components/tx-flow'
import TokenTransferFlow from '../TokenTransfer'
import RejectTxFlow from '../RejectTx'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import { safeScopeContextFor, unwrapScopedFlow } from '@/tests/mocks/safeScope'
import ReplaceTxMenu from '.'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useTxQueue')
jest.mock('@/hooks/useChains')
jest.mock('@/components/tx/shared/hooks')
jest.mock('@/services/analytics')
jest.mock('@/components/tx-flow/common/TxLayout', () => ({
  __esModule: true,
  default: ({ title, children }: { title: ReactNode; children: ReactNode }) => (
    <>
      <h1>{title}</h1>
      {children}
    </>
  ),
}))

const mockUseQueuedTxByNonce = jest.requireMock('@/hooks/useTxQueue').useQueuedTxByNonce as jest.Mock
const mockUseRecommendedNonce = jest.requireMock('@/components/tx/shared/hooks').useRecommendedNonce as jest.Mock

const TX_NONCE = 7
const REPLACE_BUTTON = /Replace with another transaction/
const REJECT_BUTTON = /Reject transaction/
const DELETE_BUTTON = /Delete from the queue/
const RECOMMENDED = 'Recommended'
const ALREADY_REJECTED_TOOLTIP = `Transaction with nonce ${TX_NONCE} already has a reject transaction`
const NOT_DELETABLE_TOOLTIP = 'You can only delete the last transaction in the queue, or a duplicate transaction.'

const queuedItem = (isCancellation: boolean): TransactionQueuedItem => ({
  type: 'TRANSACTION',
  conflictType: 'None',
  transaction: safeTxSummaryBuilder()
    .with({ txInfo: txInfoBuilder().with({ isCancellation }).build() })
    .build(),
})

const setTxFlow = jest.fn()

const renderMenu = (props: { safeTxHash?: string; proposer?: string } = {}) =>
  renderWithUserEvent(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <ReplaceTxMenu txNonce={TX_NONCE} {...props} />
    </TxModalContext.Provider>,
  )

const renderMenuForProposer = () => {
  const proposer = faker.finance.ethereumAddress()
  mockWallet({ address: proposer })
  return renderMenu({ safeTxHash: faker.string.hexadecimal({ length: 64 }), proposer })
}

const openedFlow = (): ReactElement => setTxFlow.mock.lastCall[0]

describe('ReplaceTxMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockWallet()
    mockUseQueuedTxByNonce.mockReturnValue([queuedItem(false)])
    mockHasFeature({ [FEATURES.DELETE_TX]: true })
    mockUseRecommendedNonce.mockReturnValue(TX_NONCE + 1)
  })

  it('titles the menu with the nonce of the transaction', () => {
    renderMenu()

    expect(screen.getByRole('heading', { name: `Reject transaction #${TX_NONCE}` })).toBeInTheDocument()
  })

  it('opens a send flow for the same nonce when replacing', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button', { name: REPLACE_BUTTON }))

    expect(openedFlow().type).toBe(TokenTransferFlow)
    expect(openedFlow().props).toEqual({ txNonce: TX_NONCE })
  })

  it('opens the on-chain rejection flow for the same nonce when rejecting', async () => {
    const { user } = renderMenu()

    await user.click(screen.getByRole('button', { name: REJECT_BUTTON }))

    expect(openedFlow().type).toBe(RejectTxFlow)
    expect(openedFlow().props).toEqual({ txNonce: TX_NONCE })
  })

  it('disables rejecting and explains why when the nonce already has a rejection', async () => {
    mockUseQueuedTxByNonce.mockReturnValue([queuedItem(false), queuedItem(true)])
    const { user } = renderMenu()

    const rejectButton = screen.getByRole('button', { name: REJECT_BUTTON })
    await user.hover(rejectButton.closest('span') as HTMLElement)

    expect(rejectButton).toBeDisabled()
    expect(await screen.findByText(ALREADY_REJECTED_TOOLTIP)).toBeInTheDocument()
  })

  it('offers deleting to the proposer when the chain supports it', () => {
    renderMenuForProposer()

    expect(screen.getByRole('button', { name: DELETE_BUTTON })).toBeEnabled()
  })

  it('recommends only replacing when deleting is not offered', () => {
    renderMenu()

    expect(screen.getByRole('button', { name: REPLACE_BUTTON })).toHaveTextContent(RECOMMENDED)
    expect(screen.getByRole('button', { name: REJECT_BUTTON })).not.toHaveTextContent(RECOMMENDED)
  })

  it('also recommends rejecting when deleting is offered', () => {
    renderMenuForProposer()

    expect(screen.getByRole('button', { name: REJECT_BUTTON })).toHaveTextContent(RECOMMENDED)
  })

  it('hides deleting from a signer who did not propose the transaction', () => {
    renderMenu({ safeTxHash: faker.string.hexadecimal({ length: 64 }), proposer: faker.finance.ethereumAddress() })

    expect(screen.queryByRole('button', { name: DELETE_BUTTON })).not.toBeInTheDocument()
  })

  it('hides deleting when the chain does not support it', () => {
    mockHasFeature(false)

    renderMenuForProposer()

    expect(screen.queryByRole('button', { name: DELETE_BUTTON })).not.toBeInTheDocument()
  })

  it('hides deleting when no wallet is connected', () => {
    mockWallet(null)

    renderMenu({ safeTxHash: faker.string.hexadecimal({ length: 64 }), proposer: faker.finance.ethereumAddress() })

    expect(screen.queryByRole('button', { name: DELETE_BUTTON })).not.toBeInTheDocument()
  })

  it('allows deleting a duplicate transaction that is not the last in the queue', () => {
    mockUseRecommendedNonce.mockReturnValue(TX_NONCE + 2)
    mockUseQueuedTxByNonce.mockReturnValue([queuedItem(false), queuedItem(false)])

    renderMenuForProposer()

    expect(screen.getByRole('button', { name: DELETE_BUTTON })).toBeEnabled()
  })

  it('disables deleting and explains why when the transaction is neither last nor a duplicate', async () => {
    mockUseRecommendedNonce.mockReturnValue(TX_NONCE + 2)
    const { user } = renderMenuForProposer()

    const deleteButton = screen.getByRole('button', { name: DELETE_BUTTON })
    await user.hover(deleteButton.closest('span') as HTMLElement)

    expect(deleteButton).toBeDisabled()
    expect(await screen.findByText(NOT_DELETABLE_TOOLTIP)).toBeInTheDocument()
  })

  describe('in a Safe scope', () => {
    const target = { chainId: faker.string.numeric(5), safeAddress: faker.finance.ethereumAddress() }

    it.each([
      [REPLACE_BUTTON, TokenTransferFlow],
      [REJECT_BUTTON, RejectTxFlow],
    ])('opens %s inside the Safe scope the menu was opened in', async (button, Flow) => {
      const { user } = renderWithUserEvent(
        <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
          <SafeScopeContext.Provider value={safeScopeContextFor(target)}>
            <ReplaceTxMenu txNonce={TX_NONCE} />
          </SafeScopeContext.Provider>
        </TxModalContext.Provider>,
      )

      await user.click(screen.getByRole('button', { name: button }))

      const { flow, target: flowTarget, pollSafeInfo } = unwrapScopedFlow(openedFlow())
      expect(flow?.type).toBe(Flow)
      expect(flowTarget).toEqual(target)
      expect(pollSafeInfo).toBe(false)
    })
  })
})
