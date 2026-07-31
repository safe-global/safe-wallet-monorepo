import { AbiCoder, Interface } from 'ethers'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData/index'
import { render } from '@/tests/test-utils'
import type { Operation } from '@safe-global/store/gateway/types'
import { useLoadFeature } from '@/features/__core__'

// Spelled out rather than imported from the feature: this is the on-chain signature the
// gateway cannot decode, which is the whole point of the case below.
const APPLY_CONFIGURATION_ABI = [
  'function applyConfiguration(tuple(address target, bytes4 selector, uint8 operation, address policy, bytes data)[] configurations)',
]
const RECIPIENT_DATA_TYPE = 'tuple(address recipient, bool allowed)[]'

// The policy view is lazy-loaded; its own suite covers what it renders. Here it stands in
// for "the policy branch was taken".
jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))

const mockSpacesFeature = ({
  $isDisabled = false,
  $error = undefined,
}: { $isDisabled?: boolean; $error?: Error } = {}) =>
  (useLoadFeature as jest.Mock).mockReturnValue({
    PolicyTxDetails: () => <div data-testid="policy-tx-details" />,
    $isDisabled,
    $error,
    $isReady: !$isDisabled,
  })

const applyConfigurationData = () => {
  const policyData = AbiCoder.defaultAbiCoder().encode(
    [RECIPIENT_DATA_TYPE],
    [[['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', true]]],
  )

  return new Interface(APPLY_CONFIGURATION_ABI).encodeFunctionData('applyConfiguration', [
    [
      [
        '0x51ff5573d2364108Dd4F294f28173F90E124b9F5',
        '0xa9059cbb',
        0,
        '0x37AB4Fd7eFaDfC6cc35e09196f74c19F163EdA43',
        policyData,
      ],
    ],
  ])
}

const GUARD = '0xde4c448904537EBBA654Ac3803E7D74A77C7a1a8'

describe('DecodedData', () => {
  beforeEach(() => {
    mockSpacesFeature()
  })

  it('returns null if txData and toInfo are missing', () => {
    const { container } = render(<DecodedData txData={undefined} toInfo={undefined} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows an Interact with block if there is no txData but toInfo', () => {
    const { getByText } = render(<DecodedData txData={undefined} toInfo={{ value: '0x123' }} />)

    expect(getByText('Interact with')).toBeInTheDocument()
  })

  it('shows Hex encoded data if there are no parameters', () => {
    const mockTxData = {
      to: {
        value: '0x874E2190e6B10f5173F00E27E6D5D9F90b7664C4',
      },
      value: '0',
      operation: 0 as Operation,
      dataDecoded: {
        method: 'fallback',
        parameters: [],
      },
      hexData:
        '0x895a74850000000000000000000000000000000000000000000004bb752b4d22ab390000000000000000000000000000000000000000000000000000000000000000000b00000000000000000000000000000001f76adba2311f154678f5e5605db5c9c2',
      trustedDelegateCallTarget: false,
    }

    const { getByText } = render(<DecodedData txData={mockTxData} toInfo={{ value: '0x123' }} />)

    expect(getByText('No parameters')).toBeInTheDocument()
  })

  it('does not show Hex encoded data if there is none', () => {
    const mockTxData = {
      to: {
        value: '0x874E2190e6B10f5173F00E27E6D5D9F90b7664C4',
      },
      value: '0',
      operation: 0 as Operation,
      dataDecoded: {
        method: 'mint',
        parameters: [],
      },
      hexData: '',
      trustedDelegateCallTarget: false,
    }

    const { getByText } = render(<DecodedData txData={mockTxData} toInfo={{ value: '0x123' }} />)

    expect(getByText('No parameters')).toBeInTheDocument()
  })

  // The gateway has no ABI for the policy guard, so the calldata arrives undecoded; the
  // policies still have to be shown instead of a hex dump.
  it('shows policy details for guard calldata the gateway could not decode', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <DecodedData
        txData={{
          to: { value: GUARD },
          value: '0',
          operation: 0 as Operation,
          hexData: applyConfigurationData(),
          trustedDelegateCallTarget: false,
        }}
        toInfo={{ value: GUARD }}
      />,
    )

    // The method name comes from our own selector lookup, not the gateway.
    expect(getByText('applyConfiguration')).toBeInTheDocument()
    expect(getByTestId('policy-tx-details')).toBeInTheDocument()
    expect(queryByTestId('hexData')).not.toBeInTheDocument()
  })

  // Its component is a stub that renders null when the feature is off, so the generic view
  // has to keep the data visible.
  it('falls back to the raw data when the spaces feature is unavailable', () => {
    mockSpacesFeature({ $isDisabled: true })

    const { getByTestId, queryByTestId } = render(
      <DecodedData
        txData={{
          to: { value: GUARD },
          value: '0',
          operation: 0 as Operation,
          hexData: applyConfigurationData(),
          trustedDelegateCallTarget: false,
        }}
        toInfo={{ value: GUARD }}
      />,
    )

    expect(queryByTestId('policy-tx-details')).not.toBeInTheDocument()
    expect(getByTestId('hexData')).toBeInTheDocument()
  })

  it('only shows Hex encoded data if no decodedData exists', () => {
    const mockTxData = {
      to: {
        value: '0x874E2190e6B10f5173F00E27E6D5D9F90b7664C4',
      },
      value: '0',
      operation: 0 as Operation,
      hexData:
        '0x895a74850000000000000000000000000000000000000000000004bb752b4d22ab390000000000000000000000000000000000000000000000000000000000000000000b00000000000000000000000000000001f76adba2311f154678f5e5605db5c9c2',
      trustedDelegateCallTarget: false,
    }

    const { queryByText } = render(<DecodedData txData={mockTxData} toInfo={{ value: '0x123' }} />)

    expect(queryByText('No parameters')).not.toBeInTheDocument()
  })
})
