import { render } from '@/tests/test-utils'
import BatchTransactions from '.'
import * as useDraftBatch from '@/hooks/useDraftBatch'
import * as useTxPreview from '@/components/tx/confirmation-views/useTxPreview'
import { mockedDraftBatch } from './mockData'
import {
  type TransactionPreview,
  Operation,
  TransactionInfoType,
  TransferDirection,
  TransactionTokenType,
} from '@safe-global/safe-gateway-typescript-sdk'

jest.spyOn(useDraftBatch, 'useDraftBatch').mockImplementation(() => mockedDraftBatch)

const mockUseTxPreview = jest.spyOn(useTxPreview, 'default')

const mockTxPreview: TransactionPreview = {
  txData: {
    hexData: '0x',
    dataDecoded: undefined,
    to: { value: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6', name: 'GnosisSafeProxy', logoUri: undefined },
    value: '1000000000000',
    operation: Operation.CALL,
    trustedDelegateCallTarget: false,
    addressInfoIndex: {
      '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6': {
        value: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6',
        name: 'GnosisSafeProxy',
        logoUri: undefined,
      },
    },
  },
  txInfo: {
    type: TransactionInfoType.TRANSFER,
    humanDescription: undefined,
    sender: { value: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6', name: undefined, logoUri: undefined },
    recipient: { value: '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6', name: 'GnosisSafeProxy', logoUri: undefined },
    direction: TransferDirection.OUTGOING,
    transferInfo: { type: TransactionTokenType.NATIVE_COIN, value: '1000000000000' },
  },
}

describe('BatchTransactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockUseTxPreview.mockImplementation(() => [mockTxPreview, undefined, false] as any)
  })

  it('should render a list of batch transactions', () => {
    const { container, getByText } = render(<BatchTransactions />)

    expect(container).toMatchSnapshot()
    expect(getByText('GnosisSafeProxy')).toBeDefined()
  })
})
