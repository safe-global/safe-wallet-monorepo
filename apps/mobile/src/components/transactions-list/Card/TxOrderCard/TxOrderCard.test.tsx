import { render, screen } from '@/src/tests/test-utils'
import { TxOrderCard } from '.'
import { OrderTransactionInfo } from '@safe-global/store/gateway/types'
import { mockSwapOrder, mockSwapTransfer, mockTwapOrder } from '@/src/tests/mocks'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import { MultisigExecutionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'

describe('TxOrderCard', () => {
  it('should render SwapTransfer correctly', () => {
    render(<TxOrderCard onPress={() => null} txInfo={mockSwapTransfer as OrderTransactionInfo} />)

    expect(screen.getByText(`${mockSwapTransfer.sellToken.symbol} > ${mockSwapTransfer.buyToken.symbol}`)).toBeTruthy()
    expect(screen.getByText('Swap order')).toBeTruthy()
    expect(screen.getByTestId('safe-list-transaction-swap-icon')).toBeTruthy()
  })

  it('should render TwapOrder correctly', () => {
    render(<TxOrderCard onPress={() => null} txInfo={mockTwapOrder as OrderTransactionInfo} />)

    expect(screen.getByText(`${mockTwapOrder.sellToken.symbol} > ${mockTwapOrder.buyToken.symbol}`)).toBeTruthy()
    expect(screen.getByText('Twap order')).toBeTruthy()
    expect(screen.getByTestId('safe-list-transaction-swap-icon')).toBeTruthy()
  })

  it('should render SwapOrder with market order class correctly', () => {
    render(<TxOrderCard onPress={() => null} txInfo={mockSwapOrder as OrderTransactionInfo} />)

    expect(screen.getByText(`${mockSwapOrder.sellToken.symbol} > ${mockSwapOrder.buyToken.symbol}`)).toBeTruthy()
    expect(screen.getByText('Swap order')).toBeTruthy()
    expect(screen.getByTestId('safe-list-transaction-swap-icon')).toBeTruthy()
  })

  it('should render Limit order class correctly', () => {
    const limitOrder = {
      ...mockSwapOrder,
      type: TransactionInfoType.SWAP_ORDER,
      fullAppData: {
        metadata: {
          orderClass: {
            orderClass: 'limit',
          },
        },
      },
    }

    render(<TxOrderCard onPress={() => null} txInfo={limitOrder as OrderTransactionInfo} />)

    expect(screen.getByText(`${limitOrder.sellToken.symbol} > ${limitOrder.buyToken.symbol}`)).toBeTruthy()
    expect(screen.getByText('Limit order')).toBeTruthy()
    expect(screen.getByTestId('safe-list-transaction-swap-icon')).toBeTruthy()
  })

  it('should handle bordered prop correctly', () => {
    render(<TxOrderCard onPress={() => null} txInfo={mockSwapTransfer as OrderTransactionInfo} bordered />)

    expect(screen.getByText(`${mockSwapTransfer.sellToken.symbol} > ${mockSwapTransfer.buyToken.symbol}`)).toBeTruthy()
    expect(screen.getByText('Swap order')).toBeTruthy()
  })

  it('should handle inQueue prop correctly', () => {
    render(<TxOrderCard onPress={() => null} txInfo={mockSwapTransfer as OrderTransactionInfo} inQueue />)

    expect(screen.getByText(`${mockSwapTransfer.sellToken.symbol} > ${mockSwapTransfer.buyToken.symbol}`)).toBeTruthy()
    expect(screen.getByText('Swap order')).toBeTruthy()
  })

  it('should handle executionInfo prop correctly', () => {
    const executionInfo: MultisigExecutionInfo = {
      type: DetailedExecutionInfoType.MULTISIG,
      nonce: 123,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
    }

    render(
      <TxOrderCard
        onPress={() => null}
        txInfo={mockSwapTransfer as OrderTransactionInfo}
        executionInfo={executionInfo}
        inQueue
      />,
    )

    expect(screen.getByText('1/2')).toBeTruthy()
  })

  it('should return null when txInfo is not provided', () => {
    render(<TxOrderCard onPress={() => null} txInfo={null as unknown as OrderTransactionInfo} />)

    expect(screen.queryByText(/SAFE|ETH|Twap|Limit|Swap/)).toBeNull()
  })
})
