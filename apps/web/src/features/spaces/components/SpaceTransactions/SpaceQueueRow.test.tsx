import type { ComponentProps } from 'react'
import { faker } from '@faker-js/faker'
import type { TransactionQueuedItem } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole } from '@/tests/mocks/roles'
import {
  advanceClock,
  fakerChecksummedAddress,
  renderOnFakeClock,
  renderWithUserEvent,
  screen,
} from '@/tests/test-utils'
import { PendingStatus } from '@/store/pendingTxsSlice'
import { DeleteTxDialogProvider } from './RowActionsMenu/DeleteTxDialog'
import SpaceQueueRow from './SpaceQueueRow'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/features/spending-limits/public/hooks/useIsOnlySpendingLimitBeneficiary', () => ({
  ...jest.requireActual('@/features/spending-limits/public/hooks/useIsOnlySpendingLimitBeneficiary'),
  __esModule: true,
  default: jest.fn(),
}))

const mockNestedSafeOwners: { current: string[] } = { current: [] }
jest.mock('@/hooks/useNestedSafeOwners', () => ({
  useNestedSafeOwners: () => mockNestedSafeOwners.current,
}))

const mockIsExpiredSwap = { current: false }
jest.mock('@/features/swap/public/hooks/useIsExpiredSwap', () => ({
  __esModule: true,
  default: () => mockIsExpiredSwap.current,
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [], loading: false }),
  useChain: () => undefined,
  useCurrentChain: () => undefined,
  useHasFeature: (feature: string) =>
    feature === jest.requireActual('@safe-global/utils/utils/chains').FEATURES.NATIVE_SWAPS,
}))

const CHAIN_ID = '1'
const WARNING_ICON = 'mock-icon[class*="color-warning-main"]'
const VERIFICATION_TOOLTIP = /isn’t verified on major token lists/
const SAFE_ADDRESS = fakerChecksummedAddress()

const multisigTx = ({
  txStatus = 'AWAITING_CONFIRMATIONS',
  nonce = 3,
  missingSigners = [faker.finance.ethereumAddress()],
  txInfo,
  timestamp = Date.now(),
}: {
  txStatus?: Transaction['txStatus']
  nonce?: number
  missingSigners?: string[]
  txInfo?: Transaction['txInfo']
  timestamp?: number
} = {}): Transaction =>
  safeTxSummaryBuilder()
    .with({
      txStatus,
      timestamp,
      executionInfo: executionInfoBuilder()
        .with({ nonce, missingSigners: missingSigners.map((value) => ({ value })) })
        .build(),
      ...(txInfo ? { txInfo } : {}),
    })
    .build()

const transferInfo = (overrides: Record<string, unknown> = {}) => ({
  type: 'Transfer',
  direction: 'OUTGOING',
  sender: { value: SAFE_ADDRESS },
  recipient: { value: fakerChecksummedAddress() },
  transferInfo: {
    type: 'ERC20',
    tokenAddress: fakerChecksummedAddress(),
    value: '1000000',
    tokenSymbol: 'USDC',
    decimals: 6,
    trusted: true,
    ...overrides,
  },
})

const renderRow = (
  transaction: Transaction,
  props: Partial<ComponentProps<typeof SpaceQueueRow>> = {},
  initialReduxState?: NonNullable<Parameters<typeof renderWithUserEvent>[1]>['initialReduxState'],
) =>
  renderWithUserEvent(
    <DeleteTxDialogProvider>
      <table>
        <tbody>
          <SpaceQueueRow
            item={{ type: 'TRANSACTION', conflictType: 'None', transaction } as TransactionQueuedItem}
            chainId={CHAIN_ID}
            status="waiting"
            {...props}
          />
        </tbody>
      </table>
    </DeleteTxDialogProvider>,
    { initialReduxState },
  )

describe('SpaceQueueRow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRole('nonOwner')
    mockSafeInfo({ deployed: true })
    mockNestedSafeOwners.current = []
    mockIsExpiredSwap.current = false
  })

  describe('time', () => {
    afterEach(() => {
      jest.useRealTimers()
    })

    it('shows when the transaction was proposed in words, with the exact date and time on hover', async () => {
      jest.useFakeTimers().setSystemTime(new Date(2026, 10, 20, 12, 0, 0))
      const { user } = renderOnFakeClock(
        <DeleteTxDialogProvider>
          <table>
            <tbody>
              <SpaceQueueRow
                item={{
                  type: 'TRANSACTION',
                  conflictType: 'None',
                  transaction: multisigTx({ timestamp: new Date(2026, 10, 20, 10, 0, 0).getTime() }),
                }}
                chainId={CHAIN_ID}
                status="waiting"
              />
            </tbody>
          </table>
        </DeleteTxDialogProvider>,
      )

      expect(screen.getByText('about 2 hours ago')).toBeInTheDocument()

      await user.hover(screen.getByText('about 2 hours ago'))
      await advanceClock(500)

      expect(screen.getByText('Nov 20, 2026 - 10:00:00 AM')).toBeInTheDocument()
    })
  })

  describe('warnings', () => {
    it('shows a warning without a tooltip for an imitation token', () => {
      const transaction = multisigTx({ txInfo: transferInfo({ imitation: true, trusted: false }) as never })
      renderRow(transaction)

      expect(document.querySelector(WARNING_ICON)).toBeInTheDocument()
      expect(screen.queryByText(VERIFICATION_TOOLTIP)).not.toBeInTheDocument()
    })
  })

  describe('status', () => {
    it('shows the expired label and no actions for an expired swap', async () => {
      mockIsExpiredSwap.current = true
      renderRow(multisigTx({ missingSigners: [fakerChecksummedAddress()] }), { status: 'sign' })

      expect(await screen.findByText('Expired')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Sign' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Execute' })).not.toBeInTheDocument()
    })

    it('shows the signing step of a pending transaction instead of the status chip', () => {
      const transaction = multisigTx()
      renderRow(
        transaction,
        { status: 'sign' },
        {
          pendingTxs: { [transaction.id]: { status: PendingStatus.SIGNING } as never },
        },
      )

      expect(screen.getByTestId('tx-status-label')).toHaveTextContent('Signing')
      expect(screen.queryByText('Sign')).not.toBeInTheDocument()
    })

    it('shows the indexing step of a pending transaction instead of the status chip', () => {
      const transaction = multisigTx()
      renderRow(
        transaction,
        { status: 'execute' },
        {
          pendingTxs: { [transaction.id]: { status: PendingStatus.INDEXING } as never },
        },
      )

      expect(screen.getByTestId('tx-status-label')).toHaveTextContent('Indexing')
      expect(screen.queryByText('Execute')).not.toBeInTheDocument()
    })

    it('names the nonce that blocks a transaction', () => {
      renderRow(multisigTx({ txStatus: 'AWAITING_EXECUTION' }), { status: 'blocked', nextNonce: 5 })

      expect(screen.getByText('Blocked by #5')).toBeInTheDocument()
    })
  })

  describe('to column', () => {
    it('shows the name of the recipient when the transaction names it', () => {
      const recipient = fakerChecksummedAddress()
      renderRow(multisigTx({ txInfo: { ...transferInfo(), recipient: { value: recipient, name: 'Alice' } } as never }))

      expect(screen.getByText('to')).toBeInTheDocument()
      expect(screen.getByText('Alice')).toBeInTheDocument()
    })

    it('shows the short address of a recipient without a name', () => {
      const recipient = fakerChecksummedAddress()
      renderRow(multisigTx({ txInfo: { ...transferInfo(), recipient: { value: recipient } } as never }))

      expect(screen.getByText(shortenAddress(recipient))).toBeInTheDocument()
    })

    it('shows the name and logo of a known contract', () => {
      const contract = fakerChecksummedAddress()
      const logoUri = `https://cdn.example.com/${faker.string.alphanumeric(8)}.png`
      renderRow(
        multisigTx({
          txInfo: {
            type: 'Custom',
            to: { value: contract, name: 'Uniswap Router', logoUri },
            methodName: 'execute',
            dataSize: '0',
            isCancellation: false,
            value: '0',
          } as never,
        }),
      )

      expect(screen.getByText('Uniswap Router')).toBeInTheDocument()
      expect(document.querySelector(`img[src="${logoUri}"]`)).toBeInTheDocument()
    })
  })

  describe('sign', () => {
    it('enables Sign for a transaction a wallet of the signed-in user still has to sign', () => {
      const wallet = mockRole('owner')
      renderRow(multisigTx({ missingSigners: [wallet?.address ?? ''] }), { status: 'sign' })

      expect(screen.getByRole('button', { name: 'Sign' })).toBeEnabled()
    })

    it('enables Sign for an owner Safe of a parent Safe that still has to sign', () => {
      mockRole('nestedOwner')
      const parentSafe = fakerChecksummedAddress()
      mockNestedSafeOwners.current = [parentSafe]
      renderRow(multisigTx({ missingSigners: [parentSafe] }), { status: 'sign' })

      expect(screen.getByRole('button', { name: 'Sign' })).toBeEnabled()
    })

    it('disables Sign for a wallet that is no longer a signer of the Safe', () => {
      mockRole('nonOwner')
      renderRow(multisigTx({ missingSigners: [fakerChecksummedAddress()] }), { status: 'waiting' })

      expect(screen.getByRole('button', { name: 'Sign' })).toBeDisabled()
    })

    it('explains on Sign that an owner has already signed', async () => {
      mockRole('owner')
      const { user } = renderRow(multisigTx({ missingSigners: [fakerChecksummedAddress()] }), { status: 'waiting' })

      await user.hover(screen.getByRole('button', { name: 'Sign' }).closest('span')!)

      expect(await screen.findByText("You've already signed this transaction")).toBeInTheDocument()
    })
  })
})
