import { fireEvent, render } from '@/tests/test-utils'
import { ExecTransaction } from '.'
import * as useTxPreviewHook from '@/components/tx/confirmation-views/useTxPreview'
import { Operation, TransactionInfoType } from '@safe-global/store/gateway/types'
import type { TransactionData, TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { faker } from '@faker-js/faker'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import useSafeAddress from '@/hooks/useSafeAddress'

jest.mock('@/hooks/useSafeAddress')
jest.mock('@safe-global/utils/utils/multiSend', () => ({
  ...jest.requireActual('@safe-global/utils/utils/multiSend'),
  multiSendDefaultsToSelf: jest.fn(() => true),
}))

const mockUseTxPreview = jest.spyOn(useTxPreviewHook, 'default')
const safeInterface = Safe__factory.createInterface()

describe('ExecTransaction (nested Safe MultiSend)', () => {
  const connectedSafe = faker.finance.ethereumAddress()
  const nestedSafe = faker.finance.ethereumAddress()
  const moduleAddress = faker.finance.ethereumAddress()

  beforeEach(() => {
    ;(useSafeAddress as jest.Mock).mockReturnValue(connectedSafe)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('resolves a zero-address sub-transaction to the nested Safe, not the connected Safe', () => {
    // Outer tx: the connected Safe calls nestedSafe.execTransaction(...) targeting a MultiSend batch
    const execTransactionHexData = safeInterface.encodeFunctionData('execTransaction', [
      faker.finance.ethereumAddress(),
      '0',
      '0x',
      Operation.DELEGATE,
      0,
      0,
      0,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      '0x',
    ])

    const execTxData: TransactionData = {
      to: { value: nestedSafe, name: 'Nested Safe B' },
      value: '0',
      operation: Operation.CALL,
      trustedDelegateCallTarget: false,
      hexData: execTransactionHexData,
      dataDecoded: { method: 'execTransaction', parameters: [] },
      addressInfoIndex: {},
    }

    // Preview of the nested batch: a single enableModule sub-action targeting the zero address,
    // which the MultiSend contract rewrites to the executing (nested) Safe.
    const nestedBatchTxData: TransactionData = {
      to: { value: faker.finance.ethereumAddress() },
      value: '0',
      operation: Operation.DELEGATE,
      trustedDelegateCallTarget: false,
      addressInfoIndex: {
        [nestedSafe]: { value: nestedSafe, name: 'Nested Safe B' },
      },
      dataDecoded: {
        method: 'multiSend',
        parameters: [
          {
            name: 'transactions',
            type: 'bytes',
            value: '0x',
            valueDecoded: [
              {
                operation: Operation.CALL,
                to: ZERO_ADDRESS,
                value: '0',
                data: safeInterface.encodeFunctionData('enableModule', [moduleAddress]),
                dataDecoded: {
                  method: 'enableModule',
                  parameters: [{ name: 'module', type: 'address', value: moduleAddress }],
                },
              },
            ],
          },
        ],
      },
    }

    const txPreview: TransactionPreview = {
      txData: nestedBatchTxData,
      txInfo: {
        type: TransactionInfoType.CUSTOM,
        humanDescription: undefined,
        to: { value: nestedBatchTxData.to.value },
        dataSize: '0',
        value: '0',
        isCancellation: false,
        methodName: 'multiSend',
        actionCount: 1,
      },
    }

    mockUseTxPreview.mockReturnValue([txPreview, undefined, false])

    const result = render(<ExecTransaction data={execTxData} />)

    fireEvent.click(result.getByTestId('expande-all-btn'))

    // Resolves to the nested Safe, not the connected Safe ("This Safe Account") nor the zero address
    expect(result.getAllByText(/Nested Safe B/).length).toBeGreaterThan(0)
    expect(result.queryByText('This Safe Account')).not.toBeInTheDocument()
    expect(result.queryByText('0x0000...0000')).not.toBeInTheDocument()
  })
})
