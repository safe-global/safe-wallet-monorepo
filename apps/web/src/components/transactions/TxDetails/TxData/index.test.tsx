import { fireEvent, render } from '@/tests/test-utils'
import TxData from '.'
import { Operation, TransactionInfoType } from '@safe-global/store/gateway/types'
import type { TransactionData, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { faker } from '@faker-js/faker'
import { Safe__factory } from '@safe-global/utils/types/contracts'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import useSafeAddress from '@/hooks/useSafeAddress'

jest.mock('@/hooks/useSafeAddress')
jest.mock('@safe-global/utils/utils/multiSend', () => ({
  ...jest.requireActual('@safe-global/utils/utils/multiSend'),
  multiSendDefaultsToSelf: jest.fn(() => true),
}))

const safeInterface = Safe__factory.createInterface()

describe('TxData — MultiSend executing-Safe resolution', () => {
  const connectedSafe = faker.finance.ethereumAddress()

  beforeEach(() => {
    ;(useSafeAddress as jest.Mock).mockReturnValue(connectedSafe)
  })

  it("resolves a zero-address sub-action to the tx's own Safe (txDetails.safeAddress), not the connected Safe", () => {
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

    const result = render(<TxData txInfo={txInfo} txData={txData} txDetails={txDetails} trusted imitation={false} />)

    fireEvent.click(result.getByTestId('expande-all-btn'))

    // Resolves to the child Safe (the tx's own Safe), not "This Safe account" (connected parent) nor 0x0
    expect(result.getAllByText(/Child Safe/).length).toBeGreaterThan(0)
    expect(result.queryByText('This Safe account')).not.toBeInTheDocument()
    expect(result.queryByText('0x0000...0000')).not.toBeInTheDocument()
  })
})
