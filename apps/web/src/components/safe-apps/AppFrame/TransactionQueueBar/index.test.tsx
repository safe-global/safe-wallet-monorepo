import { readFileSync } from 'fs'
import { join } from 'path'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import {
  ConflictType,
  DetailedExecutionInfoType,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
} from '@safe-global/store/gateway/types'
import { render, screen, fireEvent } from '@/tests/test-utils'
import TransactionQueueBar from '.'

jest.mock('@/components/common/PaginatedTxns', () => ({
  __esModule: true,
  default: () => <div data-testid="paginated-txns" />,
}))

jest.mock('@/components/transactions/BatchExecuteButton', () => ({
  __esModule: true,
  default: () => <button>Batch execute</button>,
}))

const transactions: QueuedItemPage = {
  results: [
    {
      type: TransactionListItemType.TRANSACTION,
      transaction: {
        id: 'multisig_0x1A84c9Fa70b94aFa053073851766E61e8F45029D_0x457db826',
        timestamp: 1663759037121,
        txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
        txInfo: {
          type: TransactionInfoType.CUSTOM,
          to: { value: '0x1A84c9Fa70b94aFa053073851766E61e8F45029D' },
          dataSize: '0',
          value: '0',
          isCancellation: false,
        },
        executionInfo: {
          type: DetailedExecutionInfoType.MULTISIG,
          nonce: 3,
          confirmationsRequired: 2,
          confirmationsSubmitted: 1,
          missingSigners: [{ value: '0xbc2BB26a6d821e69A38016f3858561a1D80d4182' }],
        },
        txHash: null,
      },
      conflictType: ConflictType.NONE,
    },
  ],
}

const renderBar = (expanded: boolean, setExpanded = jest.fn()) => {
  render(
    <TransactionQueueBar
      expanded={expanded}
      visible
      setExpanded={setExpanded}
      onDismiss={jest.fn()}
      transactions={transactions}
    />,
  )

  return setExpanded
}

const getDeclaration = (className: string, prop: string): string | undefined => {
  const css = readFileSync(join(__dirname, 'styles.module.css'), 'utf-8')
  const rule = new RegExp(`\\.${className}\\s*\\{([^}]*)\\}`).exec(css)?.[1]

  return rule ? new RegExp(`(?<![\\w-])${prop}:\\s*([^;]+)`).exec(rule)?.[1].trim() : undefined
}

const getZIndex = (className: string): number => Number(getDeclaration(className, 'z-index') ?? NaN)

/** Resolves the vertical axis out of the `overflow` shorthand, with the longhand taking precedence. */
const getOverflowY = (className: string): string | undefined => {
  const [x, y = x] = getDeclaration(className, 'overflow')?.split(/\s+/) ?? []

  return getDeclaration(className, 'overflow-y') ?? y
}

describe('TransactionQueueBar', () => {
  it('renders no backdrop while collapsed', () => {
    renderBar(false)

    expect(screen.queryByTestId('queue-bar-backdrop')).not.toBeInTheDocument()
  })

  it('paints the backdrop below the bar so the expanded queue stays clickable', () => {
    renderBar(true)

    expect(screen.getByTestId('queue-bar-backdrop')).toHaveClass('backdrop')
    expect(getZIndex('backdrop')).toBeLessThan(getZIndex('barWrapper'))
  })

  it('collapses the bar when the backdrop is clicked', () => {
    const setExpanded = renderBar(true)

    fireEvent.click(screen.getByTestId('queue-bar-backdrop'))

    expect(setExpanded).toHaveBeenCalledWith(false)
  })
})

// The element painting the background is the one capped, so it has to be the one that scrolls or a
// long queue renders past it. jsdom has no layout, so only the pairing is asserted here.
describe('TransactionQueueBar surface', () => {
  it('scrolls the queue rather than letting rows render past its background', () => {
    expect(getDeclaration('barWrapper', 'background-color')).toBeDefined()
    expect(getDeclaration('barWrapper', 'max-height')).toBeDefined()
    expect(['auto', 'scroll']).toContain(getOverflowY('barWrapper'))
  })
})
