import { faker } from '@faker-js/faker'
import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation, TransactionInfoType } from '@safe-global/store/gateway/types'
import { render } from '@/tests/test-utils'
import { getLatestSpendingLimitAddress } from '@/features/spending-limits/services'
import ConfirmationView from '.'

const CHAIN_ID = '11155111'

jest.mock('@/hooks/useChainId', () => ({ __esModule: true, default: () => '11155111' }))
jest.mock('@/components/transactions/TxDetails/Summary', () => ({ __esModule: true, default: () => null }))

const moduleAddress = getLatestSpendingLimitAddress(CHAIN_ID)!
const spender = faker.finance.ethereumAddress()
const token = faker.finance.ethereumAddress()

const action = (to: string, method: string, values: string[]) => ({
  operation: Operation.CALL,
  to,
  value: '0',
  data: '0x',
  dataDecoded: { method, parameters: values.map((value) => ({ name: '', type: 'address', value })) },
})

const preview = (actions: ReturnType<typeof action>[]): TransactionPreview =>
  ({
    txInfo: {
      type: TransactionInfoType.CUSTOM,
      methodName: 'multiSend',
      to: { value: faker.finance.ethereumAddress() },
      dataSize: '0',
      value: '0',
      isCancellation: false,
      actionCount: actions.length,
    },
    txData: {
      to: { value: faker.finance.ethereumAddress() },
      operation: Operation.DELEGATE,
      dataDecoded: {
        method: 'multiSend',
        parameters: [{ name: 'transactions', type: 'bytes', value: '0x', valueDecoded: actions }],
      },
    },
  }) as unknown as TransactionPreview

describe('ConfirmationView', () => {
  it('summarises a spending limit batch for the signer', () => {
    const { getByTestId, getByText } = render(
      <ConfirmationView
        txPreview={preview([
          action(moduleAddress, 'addDelegate', [spender]),
          action(moduleAddress, 'setAllowance', [spender, token, '1', '0', '0']),
        ])}
      />,
    )

    expect(getByTestId('spending-limit-batch-summary')).toBeInTheDocument()
    expect(getByText('Modify spending limit:')).toBeInTheDocument()
  })

  it('leaves a batch with other calls undecoded as a spending limit', () => {
    const { queryByTestId } = render(
      <ConfirmationView
        txPreview={preview([
          action(moduleAddress, 'setAllowance', [spender, token, '1', '0', '0']),
          action(token, 'transfer', [spender, '1']),
        ])}
      />,
    )

    expect(queryByTestId('spending-limit-batch-summary')).not.toBeInTheDocument()
  })

  it('hides the summary when the flow opts out of decoded data', () => {
    const { queryByTestId } = render(
      <ConfirmationView
        withDecodedData={false}
        txPreview={preview([action(moduleAddress, 'setAllowance', [spender, token, '1', '0', '0'])])}
      />,
    )

    expect(queryByTestId('spending-limit-batch-summary')).not.toBeInTheDocument()
  })
})
