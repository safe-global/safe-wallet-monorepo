import { faker } from '@faker-js/faker'
import { getCompatibilityFallbackHandlerDeployment } from '@safe-global/safe-deployments'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData/index'
import { render } from '@/tests/test-utils'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { basicTypesActions, multiSendTxDataBuilder, setFallbackHandlerAction } from '@/tests/builders/dataDecoded'
import type { Operation } from '@safe-global/store/gateway/types'
import { transactionDataBuilder } from '@/tests/builders/transactionDetails'
// Imported directly from helpers to avoid circular deps in tests
import { TWAP_FALLBACK_HANDLER } from '@/features/swap/helpers/utils'

jest.mock('@/hooks/useSafeInfo')

const OFFICIAL_HANDLER = getCompatibilityFallbackHandlerDeployment({ network: '1', version: '1.4.1' })?.defaultAddress!

const batchSetting = (handler: string) =>
  multiSendTxDataBuilder([...basicTypesActions(), setFallbackHandlerAction(handler)]).build()

const safeCallSetting = (safeAddress: string, handler: string) =>
  transactionDataBuilder()
    .with({
      to: { value: safeAddress },
      dataDecoded: setFallbackHandlerAction(handler).dataDecoded,
      addressInfoIndex: { [handler]: { value: handler, name: 'Fallback handler' } },
    })
    .build()

describe('DecodedData', () => {
  beforeEach(() => {
    mockSafeInfo({ chainId: '1' })
  })

  it('shows the untrusted fallback handler warning when a batch sets an unofficial handler', () => {
    const { getByTestId } = render(<DecodedData txData={batchSetting(faker.finance.ethereumAddress())} />)

    expect(getByTestId('untrusted-fallback-handler-warning')).toHaveTextContent('Unofficial fallback handler')
  })

  it('shows no fallback handler warning when a batch sets the official 1.4.1 handler', () => {
    const { queryByTestId } = render(<DecodedData txData={batchSetting(OFFICIAL_HANDLER)} />)

    expect(queryByTestId('untrusted-fallback-handler-warning')).not.toBeInTheDocument()
  })

  it('shows no fallback handler warning when the Safe sets the CoW TWAP handler on Sepolia', () => {
    const safe = mockSafeInfo({ chainId: '11155111' })

    const { queryByTestId } = render(
      <DecodedData txData={safeCallSetting(safe.address.value, TWAP_FALLBACK_HANDLER)} />,
    )

    expect(queryByTestId('untrusted-fallback-handler-warning')).not.toBeInTheDocument()
  })

  it('shows the fallback handler warning for the CoW TWAP handler on a chain without TWAP', () => {
    const safe = mockSafeInfo({ chainId: '10' })

    const { getByTestId } = render(<DecodedData txData={safeCallSetting(safe.address.value, TWAP_FALLBACK_HANDLER)} />)

    expect(getByTestId('untrusted-fallback-handler-warning')).toBeInTheDocument()
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
