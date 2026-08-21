import { render, screen } from '@/tests/test-utils'
import { concat, getAddress, toBeHex } from 'ethers'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { useTransactionsGetTransactionByIdV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import { APPROVE_HASH_SELECTOR, type NestedTxEnvelope, deriveEnvelopeSafeTxHash } from '@/services/tx/nestedTxEnvelope'
import { OnChainConfirmation } from '.'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/transactions'),
  useTransactionsGetTransactionByIdV1Query: jest.fn(),
}))

jest.mock('@/components/tx/confirmation-views/useTxPreview', () => ({
  __esModule: true,
  default: jest.fn(),
}))

// The envelope chainId must match the current chain for the display guard
jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(() => '1'),
}))

import useTxPreview from '@/components/tx/confirmation-views/useTxPreview'

const mockUseTxByIdQuery = useTransactionsGetTransactionByIdV1Query as jest.Mock
const mockUseTxPreview = useTxPreview as jest.Mock

const CHILD_SAFE = getAddress(toBeHex('0xdef', 20))
const RECIPIENT = getAddress(toBeHex('0x123', 20))
const ZERO_ADDRESS = getAddress(toBeHex('0x0', 20))

const childEnvelope: NestedTxEnvelope = {
  chainId: '1',
  safe: CHILD_SAFE,
  nonce: 7,
  to: RECIPIENT,
  value: '0',
  data: '0xabcdef',
  operation: 0,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: ZERO_ADDRESS,
  refundReceiver: ZERO_ADDRESS,
}

const approveHashTxData: TransactionData = {
  hexData: concat([APPROVE_HASH_SELECTOR, deriveEnvelopeSafeTxHash(childEnvelope)]),
  dataDecoded: null,
  to: { value: CHILD_SAFE, name: null, logoUri: null },
  value: '0',
  operation: 0,
  trustedDelegateCallTarget: null,
  addressInfoIndex: null,
}

const renderWithFlowData = (nestedChildTx?: NestedTxEnvelope) =>
  render(
    <TxFlowContext.Provider value={{ ...initialContext, data: { nestedChildTx } }}>
      <OnChainConfirmation data={approveHashTxData} isConfirmationView />
    </TxFlowContext.Provider>,
  )

describe('OnChainConfirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseTxPreview.mockReturnValue([undefined, undefined, false])
  })

  it('renders the child tx from the verified envelope', () => {
    mockUseTxByIdQuery.mockReturnValue({ data: undefined, error: new Error('Not found') })

    renderWithFlowData(childEnvelope)

    expect(screen.getByText('Interacted with')).toBeInTheDocument()
    expect(screen.getByTestId('hexData')).toHaveTextContent('0xabcdef')
    expect(screen.queryByText('Could not load details on hash to approve.')).not.toBeInTheDocument()
  })

  it('renders human-readable decoding from the CGW preview of the envelope', () => {
    mockUseTxByIdQuery.mockReturnValue({ data: undefined, error: undefined })
    mockUseTxPreview.mockReturnValue([
      {
        txInfo: {
          type: 'Custom',
          to: { value: CHILD_SAFE, name: null, logoUri: null },
          dataSize: '68',
          value: '0',
          methodName: 'addOwnerWithThreshold',
          isCancellation: false,
        },
        txData: {
          hexData: childEnvelope.data,
          dataDecoded: { method: 'addOwnerWithThreshold', parameters: [] },
          to: { value: CHILD_SAFE, name: null, logoUri: null },
          value: '0',
          operation: 0,
          trustedDelegateCallTarget: null,
          addressInfoIndex: null,
        },
      },
      undefined,
      false,
    ])

    renderWithFlowData(childEnvelope)

    expect(mockUseTxPreview).toHaveBeenCalledWith(
      expect.objectContaining({ to: childEnvelope.to, data: childEnvelope.data }),
      CHILD_SAFE,
    )
    expect(screen.getAllByText('addOwnerWithThreshold').length).toBeGreaterThan(0)
  })

  it('does not render an envelope for a different Safe than the approveHash target', () => {
    mockUseTxByIdQuery.mockReturnValue({ data: undefined, error: new Error('Not found') })

    render(
      <TxFlowContext.Provider value={{ ...initialContext, data: { nestedChildTx: childEnvelope } }}>
        <OnChainConfirmation
          data={{ ...approveHashTxData, to: { value: RECIPIENT, name: null, logoUri: null } }}
          isConfirmationView
        />
      </TxFlowContext.Provider>,
    )

    expect(screen.getByText('Could not load details on hash to approve.')).toBeInTheDocument()
  })

  it('prefers the envelope over the service lookup and skips the query', () => {
    mockUseTxByIdQuery.mockReturnValue({ data: undefined, error: undefined })

    renderWithFlowData(childEnvelope)

    expect(screen.getByTestId('hexData')).toHaveTextContent('0xabcdef')
    expect(mockUseTxByIdQuery).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ skip: true }))
  })

  it('does not render an envelope whose hash differs from the approved hash', () => {
    mockUseTxByIdQuery.mockReturnValue({ data: undefined, error: new Error('Not found') })

    renderWithFlowData({ ...childEnvelope, nonce: childEnvelope.nonce + 1 })

    expect(screen.queryByText('Interacted with')).not.toBeInTheDocument()
    expect(screen.getByText('Could not load details on hash to approve.')).toBeInTheDocument()
  })

  it('renders an error when the service lookup fails and no envelope is available', () => {
    mockUseTxByIdQuery.mockReturnValue({ data: undefined, error: new Error('Not found') })

    renderWithFlowData(undefined)

    expect(screen.getByText('Could not load details on hash to approve.')).toBeInTheDocument()
  })

  it('renders a skeleton while the service lookup is pending and no envelope is available', () => {
    mockUseTxByIdQuery.mockReturnValue({ data: undefined, error: undefined })

    renderWithFlowData(undefined)

    expect(screen.queryByText('Interacted with')).not.toBeInTheDocument()
    expect(screen.queryByText('Could not load details on hash to approve.')).not.toBeInTheDocument()
  })
})
