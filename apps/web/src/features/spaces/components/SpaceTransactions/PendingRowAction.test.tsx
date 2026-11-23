import { faker } from '@faker-js/faker'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { advanceClock, render, renderOnFakeClock, screen } from '@/tests/test-utils'
import { PendingStatus, PendingTxType, type PendingTx, type PendingTxsState } from '@/store/pendingTxsSlice'
import useIsSpeedUpAvailable from '@/features/speedup/public/hooks/useIsSpeedUpAvailable'
import { isNonceExecutingElsewhere, NonceTakenAction, PendingRowAction } from './PendingRowAction'

jest.mock('@/features/speedup/public/hooks/useIsSpeedUpAvailable', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/features/speedup/public/components/SpeedUpMonitor', () => ({
  __esModule: true,
  default: ({ hint }: { hint: string }) => <button aria-label={`Speed up. ${hint}`}>Speed up</button>,
}))

const mockSpeedUp = useIsSpeedUpAvailable as jest.MockedFunction<typeof useIsSpeedUpAvailable>

const NOW = new Date('2026-11-23T12:00:00.000Z').getTime()
const chainId = '1'
const safeAddress = checksumAddress(faker.finance.ethereumAddress())
const signerAddress = checksumAddress(faker.finance.ethereumAddress())
const common = { chainId, safeAddress, nonce: 42 }

const processing = (submittedAt: number): PendingTx => ({
  ...common,
  status: PendingStatus.PROCESSING,
  txType: PendingTxType.SAFE_TX,
  txHash: '0x1',
  submittedAt,
  signerNonce: 1,
  signerAddress,
})

const hover = async (user: ReturnType<typeof renderOnFakeClock>['user'], element: HTMLElement) => {
  await user.hover(element)
  await advanceClock(200)
}

describe('PendingRowAction', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: NOW })
    mockSpeedUp.mockReturnValue(false)
  })
  afterEach(() => jest.useRealTimers())

  it.each<[string, PendingTx, string]>([
    ['Signing', { ...common, status: PendingStatus.SIGNING, signerAddress }, 'Saving your signature.'],
    [
      'Awaiting parent',
      {
        ...common,
        status: PendingStatus.NESTED_SIGNING,
        signerAddress,
        txHashOrParentSafeTxHash: '0x1',
        executed: false,
        method: 'approveHash',
      },
      'The parent Safe signs this through its own transaction. The signature counts once the parent Safe executes it.',
    ],
    [
      'Signing',
      {
        ...common,
        status: PendingStatus.NESTED_SIGNING,
        signerAddress,
        txHashOrParentSafeTxHash: '0x1',
        executed: true,
        method: 'approveHash',
      },
      'Saving your signature.',
    ],
    [
      'Submitting',
      { ...common, status: PendingStatus.SUBMITTING },
      'Waiting for the wallet to submit the transaction.',
    ],
    [
      'Relaying',
      { ...common, status: PendingStatus.RELAYING, taskId: '1' },
      'Sent to the relayer and waiting to be included in a block.',
    ],
    [
      'Indexing',
      { ...common, status: PendingStatus.INDEXING },
      'Included in a block. The queue updates once the transaction is indexed.',
    ],
  ])('shows "%s" with its tooltip', async (label, pendingTx, hint) => {
    const { user } = renderOnFakeClock(<PendingRowAction txId="tx" pendingTx={pendingTx} />)

    const chip = screen.getByTestId('queue-row-pending-chip')
    expect(chip).toHaveTextContent(new RegExp(`^${label}$`))
    expect(chip).toHaveAttribute('tabindex', '0')

    await hover(user, chip)

    expect(await screen.findByText(hint)).toBeInTheDocument()
  })

  it('shows a spinner while it runs, but not while it awaits the parent Safe', () => {
    const { unmount } = render(<PendingRowAction txId="tx" pendingTx={{ ...common, status: PendingStatus.INDEXING }} />)
    expect(screen.getByTestId('queue-row-pending-chip').querySelector('svg.animate-spin')).toBeInTheDocument()
    unmount()

    render(
      <PendingRowAction
        txId="tx"
        pendingTx={{
          ...common,
          status: PendingStatus.NESTED_SIGNING,
          signerAddress,
          txHashOrParentSafeTxHash: '0x1',
          executed: false,
          method: 'approveHash',
        }}
      />,
    )
    expect(screen.getByTestId('queue-row-pending-chip').querySelector('svg.animate-spin')).toBeNull()
  })

  it('counts the time since submission, "Processing m:ss", and says when it was submitted', async () => {
    const { user } = renderOnFakeClock(<PendingRowAction txId="tx" pendingTx={processing(NOW - 82_000)} />)

    const chip = screen.getByTestId('queue-row-pending-chip')
    expect(chip).toHaveTextContent(/^Processing 1:22$/)

    await advanceClock(3_000)
    expect(chip).toHaveTextContent(/^Processing 1:25$/)

    await hover(user, chip)
    expect(await screen.findByText('Submitted 1:25 ago and waiting to be included in a block.')).toBeInTheDocument()
  })

  it('shows Speed up instead of the chip when the fee may be too low, and says why', () => {
    mockSpeedUp.mockReturnValue(true)

    render(<PendingRowAction txId="tx" pendingTx={processing(NOW - 20_000)} />)

    expect(screen.queryByTestId('queue-row-pending-chip')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: 'Speed up. Submitted 0:20 ago and waiting to be included in a block. The network fee may be too low. Speed up resubmits it with a higher fee.',
      }),
    ).toBeInTheDocument()
  })

  it('keeps the chip once it is in a block', () => {
    mockSpeedUp.mockReturnValue(true)

    render(<PendingRowAction txId="tx" pendingTx={{ ...common, status: PendingStatus.INDEXING }} />)

    expect(screen.getByTestId('queue-row-pending-chip')).toHaveTextContent(/^Indexing$/)
    expect(screen.queryByRole('button', { name: /Speed up/ })).not.toBeInTheDocument()
  })

  it('never says "Locked"', () => {
    render(<PendingRowAction txId="tx" pendingTx={processing(NOW - 82_000)} />)

    expect(screen.queryByText(/Locked/)).not.toBeInTheDocument()
  })
})

describe('NonceTakenAction', () => {
  afterEach(() => jest.useRealTimers())

  it.each([
    [TransactionStatus.AWAITING_EXECUTION, 'Execute'],
    [TransactionStatus.AWAITING_CONFIRMATIONS, 'Sign'],
  ])('disables the %s row action, with "Available if #n fails." in a focusable tooltip', async (txStatus, label) => {
    jest.useFakeTimers({ now: NOW })
    const tx = safeTxSummaryBuilder().with({ txStatus }).build()

    const { user } = renderOnFakeClock(<NonceTakenAction tx={tx} nonce={42} />)

    expect(screen.getByRole('button', { name: label })).toBeDisabled()
    expect(screen.queryByText(/Locked/)).not.toBeInTheDocument()

    await user.tab()
    expect(screen.getByTestId('queue-row-nonce-taken')).toHaveFocus()
    await advanceClock(200)
    expect(await screen.findByText('Available if #42 fails.')).toBeInTheDocument()
  })
})

describe('isNonceExecutingElsewhere', () => {
  const at = { chainId, safeAddress, nonce: 42 }

  it.each([PendingStatus.SUBMITTING, PendingStatus.PROCESSING, PendingStatus.RELAYING, PendingStatus.INDEXING])(
    'is true while another transaction at the nonce is %s',
    (status) => {
      const pendingTxs = {
        other: { ...common, safeAddress: safeAddress.toLowerCase(), status },
      } as unknown as PendingTxsState

      expect(isNonceExecutingElsewhere(pendingTxs, 'tx', at)).toBe(true)
    },
  )

  it('is false for the transaction itself, a signature, or another nonce, Safe or chain', () => {
    const pendingTxs = {
      tx: { ...common, status: PendingStatus.PROCESSING },
      signing: { ...common, status: PendingStatus.SIGNING, signerAddress },
      otherNonce: { ...common, nonce: 43, status: PendingStatus.PROCESSING },
      otherChain: { ...common, chainId: '10', status: PendingStatus.PROCESSING },
      otherSafe: { ...common, safeAddress: signerAddress, status: PendingStatus.PROCESSING },
    } as unknown as PendingTxsState

    expect(isNonceExecutingElsewhere(pendingTxs, 'tx', at)).toBe(false)
  })
})
