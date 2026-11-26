import { faker } from '@faker-js/faker'
import { useEffect } from 'react'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { formatTime } from '@safe-global/utils/utils/date'
import { pendingTxBuilder } from '@/tests/builders/pendingTx'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { act, advanceClock, render, renderOnFakeClock, screen, within } from '@/tests/test-utils'
import { PendingStatus, PendingTxType, type PendingTx, type PendingTxsState } from '@/store/pendingTxsSlice'
import useIsSpeedUpAvailable from '@/features/speedup/public/hooks/useIsSpeedUpAvailable'
import { isNonceExecutingElsewhere, NonceTakenAction, PendingRowAction } from './PendingRowAction'

jest.mock('@/features/speedup/public/hooks/useIsSpeedUpAvailable', () => ({ __esModule: true, default: jest.fn() }))
const mockMonitor = { loaded: true, props: jest.fn() }
jest.mock('@/features/speedup/public/components/SpeedUpMonitor', () => ({
  __esModule: true,
  default: function MockSpeedUpMonitor(props: { hint: string; available?: boolean; onShow?: () => void }) {
    mockMonitor.props(props)
    const { onShow } = props
    const { loaded } = mockMonitor
    useEffect(() => {
      if (loaded) onShow?.()
    }, [onShow, loaded])
    return loaded ? <button aria-label={`Speed up. ${props.hint}`}>Speed up</button> : null
  },
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

const chipLabel = (label: string) => within(screen.getByTestId('queue-row-pending-chip')).getByText(label)

const hover = async (user: ReturnType<typeof renderOnFakeClock>['user'], element: HTMLElement) => {
  await user.hover(element)
  await advanceClock(200)
}

describe('PendingRowAction', () => {
  beforeEach(() => {
    jest.setSystemTime(NOW)
    mockSpeedUp.mockReturnValue(false)
    mockMonitor.loaded = true
  })

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
    expect(chipLabel(label).closest('[aria-hidden="true"]')).toBeInTheDocument()
    expect(within(chip).getByText(`${label}. ${hint}`)).toHaveClass('sr-only')
    expect(chip).not.toHaveAttribute('aria-live')
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
    const submittedAt = NOW - 82_000
    const { user } = renderOnFakeClock(<PendingRowAction txId="tx" pendingTx={processing(submittedAt)} />)

    expect(chipLabel('Processing 1:22')).toBeInTheDocument()

    await advanceClock(3_000)
    expect(chipLabel('Processing 1:25')).toBeInTheDocument()

    await hover(user, screen.getByTestId('queue-row-pending-chip'))
    expect(
      await screen.findByText(
        `Submitted at ${formatTime(submittedAt)} (1:25 ago) and waiting to be included in a block.`,
      ),
    ).toBeInTheDocument()
  })

  it('shows Speed up instead of the chip when the fee may be too low, says why, and skips a second check', () => {
    mockSpeedUp.mockReturnValue(true)
    const submittedAt = NOW - 20_000

    render(<PendingRowAction txId="tx" pendingTx={processing(submittedAt)} />)

    expect(screen.queryByTestId('queue-row-pending-chip')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: `Speed up. Submitted at ${formatTime(submittedAt)} (0:20 ago) and waiting to be included in a block. The network fee may be too low. Speed up resubmits it with a higher fee.`,
      }),
    ).toBeInTheDocument()
    expect(mockMonitor.props).toHaveBeenCalledWith(expect.objectContaining({ available: true }))
  })

  it('keeps the chip until Speed up has loaded', () => {
    mockSpeedUp.mockReturnValue(true)
    mockMonitor.loaded = false

    const { rerender } = render(<PendingRowAction txId="tx" pendingTx={processing(NOW - 20_000)} />)
    expect(chipLabel('Processing 0:20')).toBeInTheDocument()

    mockMonitor.loaded = true
    act(() => rerender(<PendingRowAction txId="tx" pendingTx={processing(NOW - 21_000)} />))

    expect(screen.queryByTestId('queue-row-pending-chip')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Speed up\./ })).toBeInTheDocument()
  })

  it('keeps the chip once it is in a block', () => {
    mockSpeedUp.mockReturnValue(true)

    render(<PendingRowAction txId="tx" pendingTx={{ ...common, status: PendingStatus.INDEXING }} />)

    expect(chipLabel('Indexing')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Speed up/ })).not.toBeInTheDocument()
  })

  it('never says "Locked"', () => {
    render(<PendingRowAction txId="tx" pendingTx={processing(NOW - 82_000)} />)

    expect(screen.queryByText(/Locked/)).not.toBeInTheDocument()
  })
})

describe('NonceTakenAction', () => {
  it.each([
    [TransactionStatus.AWAITING_EXECUTION, 'Execute'],
    [TransactionStatus.AWAITING_CONFIRMATIONS, 'Sign'],
  ])('disables the %s row action, with "Available if #n fails." in a focusable tooltip', async (txStatus, label) => {
    jest.setSystemTime(NOW)
    const tx = safeTxSummaryBuilder().with({ txStatus }).build()

    const { user } = renderOnFakeClock(<NonceTakenAction tx={tx} nonce={42} />)

    expect(screen.getByRole('button', { name: label })).toBeDisabled()
    expect(screen.getByTestId('queue-row-nonce-taken')).toHaveAttribute(
      'aria-label',
      `${label}. Available if #42 fails.`,
    )
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
      const pendingTxs: PendingTxsState = {
        other: pendingTxBuilder()
          .with({ ...common, safeAddress: safeAddress.toLowerCase(), status })
          .build(),
      }

      expect(isNonceExecutingElsewhere(pendingTxs, 'tx', at)).toBe(true)
    },
  )

  it('is false for the transaction itself, a signature, or another nonce, Safe or chain', () => {
    const pendingTxs: PendingTxsState = {
      tx: processing(NOW),
      signing: { ...common, status: PendingStatus.SIGNING, signerAddress },
      otherNonce: { ...processing(NOW), nonce: 43 },
      otherChain: { ...processing(NOW), chainId: '10' },
      otherSafe: { ...processing(NOW), safeAddress: signerAddress },
    }

    expect(isNonceExecutingElsewhere(pendingTxs, 'tx', at)).toBe(false)
  })
})
