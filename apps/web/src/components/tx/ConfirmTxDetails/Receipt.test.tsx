import { render } from '@/tests/test-utils'
import { Receipt } from './Receipt'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import type { SafeTransaction } from '@safe-global/types-kit'

const GELATO = '0xaEf22e5f09980fC1Ba6F2ec3EC34c1B9aeC885b5'
const ZERO = '0x0000000000000000000000000000000000000000'
const GAS_TOKEN = ZERO
const NATIVE_LOGO = 'https://example.com/pol.png'
const ERC20_GAS_TOKEN = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

let mockRelayer: { type: string } | null = null
let mockBalanceItems: Array<{ tokenInfo: { address: string; logoUri: string; symbol: string } }> = []

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({
    chainId: '137',
    nativeCurrency: { symbol: 'POL', decimals: 18, logoUri: NATIVE_LOGO },
    features: ['GTF'],
    relayer: mockRelayer,
  }),
  useHasFeature: () => true,
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { threshold: 1, chainId: '137' }, safeAddress: '0xsafe' }),
}))

jest.mock('@/hooks/useBalances', () => ({
  __esModule: true,
  default: () => ({ balances: { items: mockBalanceItems } }),
}))

const mockUseGtfFeePreview = jest.fn()
jest.mock('@/features/gtf/hooks/useGtfFeePreview', () => ({
  useGtfFeePreview: () => mockUseGtfFeePreview(),
}))

jest.mock('@/components/transactions/TxDetails/Summary/SafeTxHashDataRow', () => ({
  useSafeTxHash: () => '0xsafeTxHash',
  useDomainHash: () => undefined,
  useMessageHash: () => undefined,
}))

// Stub heavy children that pull in unrelated hook chains (address book, ENS, explorer links).
jest.mock('./NameChip', () => ({ __esModule: true, default: () => null }))
jest.mock('@/components/common/EthHashInfo', () => ({
  __esModule: true,
  default: ({ address, children }: { address: string; children?: unknown }) => (
    <span>
      {address}
      {children as never}
    </span>
  ),
}))
jest.mock('@/components/transactions/HexEncodedData', () => ({
  HexEncodedData: ({ hexData }: { hexData: string }) => <span>{hexData}</span>,
}))
jest.mock('@/components/common/TokenIcon', () => ({
  __esModule: true,
  default: ({ logoUri, tokenSymbol }: { logoUri?: string; tokenSymbol?: string | null }) => (
    <span data-testid="gas-token-icon" data-logo={logoUri} data-symbol={tokenSymbol} />
  ),
}))

const baseSafeTxData = {
  to: '0x8b0aB586dF1Ca1f360cb26b34eEC2C3AF969E821',
  value: '10',
  data: '0x',
  operation: 0,
  safeTxGas: '0',
  baseGas: '0',
  gasPrice: '0',
  gasToken: GAS_TOKEN,
  refundReceiver: ZERO,
  nonce: 3,
} as unknown as SafeTransaction['data']

const renderReceipt = (ctx: Partial<SafeTxContextParams>, safeTxData: SafeTransaction['data'] = baseSafeTxData) => {
  const value = {
    gtfPaymentMode: 'safe',
    gtfSelectedGasToken: GAS_TOKEN,
    safeTx: { data: baseSafeTxData, signatures: new Map() } as unknown as SafeTransaction,
    ...ctx,
  } as unknown as SafeTxContextParams

  return render(
    <SafeTxContext.Provider value={value}>
      <Receipt safeTxData={safeTxData} />
    </SafeTxContext.Provider>,
  )
}

describe('Receipt GTF fee preview', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRelayer = {
      type: 'RELAY_FEE',
    }
  })

  it('ignores the preview on chains without a RELAY_FEE relayer', () => {
    mockRelayer = null
    mockUseGtfFeePreview.mockReturnValue({
      data: {
        txData: { safeTxGas: '12936', baseGas: '72094', gasPrice: '456199317491', refundReceiver: GELATO },
      },
    })

    const { getAllByText, queryByText } = renderReceipt({})

    expect(queryByText('12936')).not.toBeInTheDocument()
    // safeTxGas, baseGas, gasPrice all render the base "0".
    expect(getAllByText('0').length).toBeGreaterThanOrEqual(3)
  })

  it('previews the resolved gas fields before signing instead of the base zeros', () => {
    mockUseGtfFeePreview.mockReturnValue({
      data: {
        txData: { safeTxGas: '12936', baseGas: '72094', gasPrice: '456199317491', refundReceiver: GELATO },
      },
    })

    const { getByText, queryAllByText } = renderReceipt({})

    expect(getByText('12936')).toBeInTheDocument()
    expect(getByText('72094')).toBeInTheDocument()
    expect(getByText('456199317491')).toBeInTheDocument()
    // The base zeros should not be the values shown for the gas rows.
    expect(queryAllByText('0').length).toBe(0)
  })

  it('falls back to the base safeTx values when no preview is available', () => {
    mockUseGtfFeePreview.mockReturnValue({ data: undefined })

    const { getAllByText } = renderReceipt({})

    // safeTxGas, baseGas, gasPrice all render the base "0".
    expect(getAllByText('0').length).toBeGreaterThanOrEqual(3)
  })

  it('shows the signed payload values once the tx is signed (no preview)', () => {
    mockUseGtfFeePreview.mockReturnValue({ data: undefined })
    const signedData = { ...baseSafeTxData, safeTxGas: '999', baseGas: '888', gasPrice: '777' }
    const signed = {
      data: signedData,
      signatures: new Map([['0xowner', { signer: '0xowner', data: '0xsig' }]]),
    } as unknown as SafeTransaction

    const { getByText } = renderReceipt({ safeTx: signed }, signedData)

    // shouldPreviewGtf is false (signed), so the signed payload's own fields are shown.
    expect(getByText('999')).toBeInTheDocument()
    expect(getByText('888')).toBeInTheDocument()
    expect(getByText('777')).toBeInTheDocument()
  })
})

// The GasToken row shows the bare token address, which on its own says nothing about what is
// actually being spent — the logo/symbol beside it is what identifies the token to the signer.
describe('Receipt GasToken identity', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRelayer = { type: 'RELAY_FEE' }
    mockBalanceItems = []
    mockUseGtfFeePreview.mockReturnValue({ data: undefined })
  })

  it("labels a native gas token with the chain's currency logo and symbol", () => {
    const { getByTestId } = renderReceipt({})

    const icon = getByTestId('gas-token-icon')
    expect(icon).toHaveAttribute('data-logo', NATIVE_LOGO)
    expect(icon).toHaveAttribute('data-symbol', 'POL')
  })

  it('labels an ERC-20 gas token with the held token logo and symbol', () => {
    mockBalanceItems = [
      { tokenInfo: { address: ERC20_GAS_TOKEN, logoUri: 'https://example.com/uni.png', symbol: 'UNI' } },
    ]
    const erc20Data = { ...baseSafeTxData, gasToken: ERC20_GAS_TOKEN }

    const { getByTestId } = renderReceipt({ gtfSelectedGasToken: ERC20_GAS_TOKEN }, erc20Data)

    const icon = getByTestId('gas-token-icon')
    expect(icon).toHaveAttribute('data-logo', 'https://example.com/uni.png')
    expect(icon).toHaveAttribute('data-symbol', 'UNI')
  })

  it('omits the icon for an ERC-20 gas token the Safe does not hold', () => {
    const erc20Data = { ...baseSafeTxData, gasToken: ERC20_GAS_TOKEN }

    const { queryByTestId } = renderReceipt({ gtfSelectedGasToken: ERC20_GAS_TOKEN }, erc20Data)

    expect(queryByTestId('gas-token-icon')).not.toBeInTheDocument()
  })
})
