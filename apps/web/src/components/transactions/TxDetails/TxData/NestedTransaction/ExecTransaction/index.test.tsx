import { act, fireEvent, render, screen } from '@/tests/test-utils'
import { ExecTransaction } from '.'
import * as useTxPreviewHook from '@/components/tx/confirmation-views/useTxPreview'
import { Operation, TransactionInfoType } from '@safe-global/store/gateway/types'
import type { TransactionData, TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { faker } from '@faker-js/faker'
import { getAddress } from 'ethers'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useCurrentChain } from '@/hooks/useChains'
import { chainBuilder } from '@/tests/builders/chains'

jest.mock('@/hooks/useSafeAddress')
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [], loading: false, loaded: true, error: undefined })),
  useChain: jest.fn(),
  useCurrentChain: jest.fn(),
  useHasFeature: jest.fn(() => false),
}))
jest.mock('@safe-global/utils/utils/multiSend', () => ({
  ...jest.requireActual('@safe-global/utils/utils/multiSend'),
  multiSendDefaultsToSelf: jest.fn(() => true),
}))

const mockUseTxPreview = jest.spyOn(useTxPreviewHook, 'default')
const mockUseCurrentChain = useCurrentChain as jest.Mock
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

  it('resolves a zero-address sub-transaction to the nested Safe, not the connected Safe', async () => {
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
    // NamedAddressInfo resolves its contract lookup after the first render
    await act(async () => {})

    await act(async () => {
      fireEvent.click(result.getByTestId('expande-all-btn'))
    })

    // Resolves to the nested Safe, not the connected Safe ("This Safe account") nor the zero address
    expect(result.getAllByText(/Nested Safe B/).length).toBeGreaterThan(0)
    expect(result.queryByText('This Safe account')).not.toBeInTheDocument()
    expect(result.queryByText('0x0000...0000')).not.toBeInTheDocument()
  })
})

describe('ExecTransaction', () => {
  const nestedSafe = faker.finance.ethereumAddress()
  const childTo = getAddress(faker.finance.ethereumAddress())
  const childValue = '1000'
  const childData = safeInterface.encodeFunctionData('changeThreshold', [2])

  const execTxData: TransactionData = {
    to: { value: nestedSafe, name: null },
    value: '0',
    operation: Operation.CALL,
    trustedDelegateCallTarget: false,
    hexData: safeInterface.encodeFunctionData('execTransaction', [
      childTo,
      childValue,
      childData,
      Operation.CALL,
      0,
      0,
      0,
      ZERO_ADDRESS,
      ZERO_ADDRESS,
      '0x',
    ]),
    dataDecoded: { method: 'execTransaction', parameters: [] },
    addressInfoIndex: {},
  }

  const childPreview: TransactionPreview = {
    txData: {
      to: { value: childTo },
      value: childValue,
      operation: Operation.CALL,
      trustedDelegateCallTarget: false,
      hexData: childData,
      dataDecoded: { method: 'changeThreshold', parameters: [] },
      addressInfoIndex: {},
    },
    txInfo: {
      type: TransactionInfoType.CUSTOM,
      humanDescription: undefined,
      to: { value: childTo },
      dataSize: '36',
      value: childValue,
      isCancellation: false,
      methodName: 'changeThreshold',
    },
  }

  const renderExecTransaction = async (data: TransactionData) => {
    render(<ExecTransaction data={data} isConfirmationView />)
    // NamedAddressInfo resolves its contract lookup after the first render
    await act(async () => {})
  }

  beforeEach(() => {
    mockUseCurrentChain.mockReturnValue(chainBuilder().with({ chainId: '1', shortName: 'eth' }).build())
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('previews the child transaction decoded from the execTransaction calldata on the nested Safe', async () => {
    mockUseTxPreview.mockReturnValue([childPreview, undefined, false])

    await renderExecTransaction(execTxData)

    expect(mockUseTxPreview).toHaveBeenCalledWith(
      { operation: Operation.CALL, to: childTo, value: childValue, data: childData },
      nestedSafe,
    )
    expect(screen.getByText('Nested transaction')).toBeInTheDocument()
    expect(screen.getAllByText('changeThreshold').length).toBeGreaterThan(0)
  })

  it('links "Open Safe" to the history of the nested Safe', async () => {
    mockUseTxPreview.mockReturnValue([childPreview, undefined, false])

    await renderExecTransaction(execTxData)

    const href = screen.getByRole('link', { name: /Open Safe/ }).getAttribute('href') ?? ''
    const url = new URL(href, 'http://localhost')
    expect(url.pathname).toBe('/transactions/history')
    expect(url.searchParams.get('safe')).toBe(`eth:${nestedSafe}`)
  })

  it('does not render the "Open Safe" link without a current chain', async () => {
    mockUseCurrentChain.mockReturnValue(undefined)
    mockUseTxPreview.mockReturnValue([childPreview, undefined, false])

    await renderExecTransaction(execTxData)

    expect(screen.getAllByText('changeThreshold').length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: /Open Safe/ })).not.toBeInTheDocument()
  })

  it('renders an error when the child transaction preview fails', async () => {
    mockUseTxPreview.mockReturnValue([undefined, new Error('Preview failed'), false])

    await renderExecTransaction(execTxData)

    expect(screen.getByText('Could not load details on executed transaction.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Open Safe/ })).not.toBeInTheDocument()
  })

  it('renders neither the preview nor an error while the child transaction preview loads', async () => {
    mockUseTxPreview.mockReturnValue([undefined, undefined, true])

    await renderExecTransaction(execTxData)

    expect(screen.getByText('Nested transaction')).toBeInTheDocument()
    expect(screen.queryByText('changeThreshold')).not.toBeInTheDocument()
    expect(screen.queryByText('Could not load details on executed transaction.')).not.toBeInTheDocument()
  })

  it('does not request a preview without calldata', async () => {
    mockUseTxPreview.mockReturnValue([undefined, undefined, false])

    await renderExecTransaction({ ...execTxData, hexData: null })

    expect(mockUseTxPreview).toHaveBeenCalledWith(undefined, nestedSafe)
  })
})
