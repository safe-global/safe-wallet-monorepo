import { act, render, renderWithUserEvent } from '@/tests/test-utils'
import TxData from '.'
import { Operation, TransactionInfoType } from '@safe-global/store/gateway/types'
import type { TransactionData, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { faker } from '@faker-js/faker'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import useSafeAddress from '@/hooks/useSafeAddress'
import useChainId from '@/hooks/useChainId'
import { getLatestSpendingLimitAddress } from '@/features/spending-limits/services'

jest.mock('@/hooks/useSafeAddress')
jest.mock('@/hooks/useChainId')
jest.mock('@safe-global/utils/utils/multiSend', () => ({
  ...jest.requireActual('@safe-global/utils/utils/multiSend'),
  multiSendDefaultsToSelf: jest.fn(() => true),
}))

const safeInterface = Safe__factory.createInterface()

describe('TxData — MultiSend executing-Safe resolution', () => {
  const connectedSafe = faker.finance.ethereumAddress()

  beforeEach(() => {
    ;(useSafeAddress as jest.Mock).mockReturnValue(connectedSafe)
    ;(useChainId as jest.Mock).mockReturnValue('1')
  })

  it("resolves a zero-address sub-action to the tx's own Safe (txDetails.safeAddress), not the connected Safe", async () => {
    // Mirrors the nested approveHash/OnChainConfirmation case: the rendered batch belongs to a
    // child Safe (txDetails.safeAddress) that is NOT the connected (parent) Safe.
    const childSafe = faker.finance.ethereumAddress()
    const multisendLib = faker.finance.ethereumAddress()
    const moduleAddress = faker.finance.ethereumAddress()

    const txData = {
      to: { value: multisendLib },
      operation: Operation.DELEGATE,
      addressInfoIndex: { [childSafe]: { value: childSafe, name: 'Child Safe' } },
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
    } as unknown as TransactionData

    const txInfo = {
      type: TransactionInfoType.CUSTOM,
      methodName: 'multiSend',
      to: { value: multisendLib },
      dataSize: '0',
      value: '0',
      isCancellation: false,
      actionCount: 1,
      humanDescription: undefined,
    } as unknown as TransactionDetails['txInfo']

    const txDetails = { safeAddress: childSafe } as unknown as TransactionDetails

    const result = renderWithUserEvent(
      <TxData txInfo={txInfo} txData={txData} txDetails={txDetails} trusted imitation={false} />,
    )

    await result.user.click(result.getByTestId('expande-all-btn'))

    // Resolves to the child Safe (the tx's own Safe), not "This Safe account" (connected parent) nor 0x0
    expect(result.getAllByText(/Child Safe/).length).toBeGreaterThan(0)
    expect(result.queryByText('This Safe account')).not.toBeInTheDocument()
    expect(result.queryByText('0x0000...0000')).not.toBeInTheDocument()
  })
})

describe('TxData — spending limit batch', () => {
  const chainId = '11155111'
  const moduleAddress = getLatestSpendingLimitAddress(chainId)!
  const spender = faker.finance.ethereumAddress()
  const token = faker.finance.ethereumAddress()

  const moduleCall = (method: string, values: string[]) => ({
    operation: Operation.CALL,
    to: moduleAddress,
    value: '0',
    data: '0x',
    dataDecoded: { method, parameters: values.map((value) => ({ name: '', type: 'address', value })) },
  })

  const renderBatch = async (actions: ReturnType<typeof moduleCall>[]) => {
    const multisendLib = faker.finance.ethereumAddress()
    const txData = {
      to: { value: multisendLib },
      operation: Operation.DELEGATE,
      tokenInfoIndex: {
        [token]: { address: token, decimals: 6, symbol: 'USDC', name: 'USD Coin', logoUri: '', type: 'ERC20' },
      },
      dataDecoded: {
        method: 'multiSend',
        parameters: [{ name: 'transactions', type: 'bytes', value: '0x', valueDecoded: actions }],
      },
    } as unknown as TransactionData

    const txInfo = {
      type: TransactionInfoType.CUSTOM,
      methodName: 'multiSend',
      to: { value: multisendLib },
      dataSize: '0',
      value: '0',
      isCancellation: false,
      actionCount: actions.length,
    } as unknown as TransactionDetails['txInfo']

    const result = render(<TxData txInfo={txInfo} txData={txData} trusted imitation={false} />)
    await act(async () => {})
    return result
  }

  beforeEach(() => {
    ;(useSafeAddress as jest.Mock).mockReturnValue(faker.finance.ethereumAddress())
    ;(useChainId as jest.Mock).mockReturnValue(chainId)
  })

  it('summarises a policy batch above its actions', async () => {
    const result = await renderBatch([
      moduleCall('addDelegate', [spender]),
      moduleCall('resetAllowance', [spender, token]),
      moduleCall('setAllowance', [spender, token, '1500000', '0', '0']),
    ])

    expect(result.getByTestId('spending-limit-batch-summary')).toBeInTheDocument()
    expect(result.getByText('Modify spending limit:')).toBeInTheDocument()
    expect(result.getByText('1.5 USDC')).toBeInTheDocument()
    expect(result.getByText('Reset to 0')).toBeInTheDocument()
    expect(result.getByTestId('all-actions')).toBeInTheDocument()
  })

  it('summarises a policy batch when the details page passes its own decoded data', async () => {
    const multisendLib = faker.finance.ethereumAddress()
    const txData = {
      to: { value: multisendLib },
      operation: Operation.DELEGATE,
      dataDecoded: {
        method: 'multiSend',
        parameters: [
          {
            name: 'transactions',
            type: 'bytes',
            value: '0x',
            valueDecoded: [moduleCall('setAllowance', [spender, token, '1', '0', '0'])],
          },
        ],
      },
    } as unknown as TransactionData
    const txInfo = {
      type: TransactionInfoType.CUSTOM,
      methodName: 'multiSend',
      to: { value: multisendLib },
    } as unknown as TransactionDetails['txInfo']

    const result = render(
      <TxData txInfo={txInfo} txData={txData} trusted imitation={false}>
        <div>decoded children</div>
      </TxData>,
    )
    await act(async () => {})

    expect(result.getByTestId('spending-limit-batch-summary')).toBeInTheDocument()
    expect(result.getByText('decoded children')).toBeInTheDocument()
  })

  it('summarises a deleted limit', async () => {
    const result = await renderBatch([moduleCall('deleteAllowance', [spender, token])])

    expect(result.getByText('Delete spending limit:')).toBeInTheDocument()
  })
})
