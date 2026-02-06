import { TokenTransferType } from '@/components/tx-flow/flows/TokenTransfer'
import TokenTransferFlow from '@/components/tx-flow/flows/TokenTransfer'
import CreateTokenTransfer, {
  type CreateTokenTransferProps,
} from '@/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer'
import * as tokenUtils from '@/components/tx-flow/flows/TokenTransfer/utils'
import * as useHasPermission from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { render } from '@/tests/test-utils'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import { TokenType } from '@safe-global/store/gateway/types'
import TxFlowProvider from '@/components/tx-flow/TxFlowProvider'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'
import * as useRecipientAnalysis from '@/features/safe-shield/hooks/useRecipientAnalysis'
import * as useBalances from '@/hooks/useBalances'
import * as useTrustedTokenBalances from '@/hooks/loadables/useTrustedTokenBalances'

// Mock the SpendingLimitRowWrapper component with the same "Send as" label as the real component
jest.mock('@/components/tx-flow/flows/TokenTransfer/SpendingLimitRow', () => ({
  __esModule: true,
  default: () => (
    <div data-testid="spending-limit-row">
      <label>Send as</label>
    </div>
  ),
}))

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

describe('CreateTokenTransfer', () => {
  const mockParams = {
    recipients: [
      {
        recipient: '',
        tokenAddress: ZERO_ADDRESS,
        amount: '',
      },
    ],
    type: TokenTransferType.multiSig,
  }

  const useHasPermissionSpy = jest.spyOn(useHasPermission, 'useHasPermission')
  const useRecipientAnalysisSpy = jest.spyOn(useRecipientAnalysis, 'useRecipientAnalysis')

  beforeEach(() => {
    jest.clearAllMocks()
    useHasPermissionSpy.mockReturnValue(true)
    useRecipientAnalysisSpy.mockReturnValue([undefined, undefined, false])
  })

  const renderCreateTokenTransfer = (
    props: CreateTokenTransferProps = {},
    options: Parameters<typeof render>[1] = undefined,
  ) => {
    return render(
      <SafeShieldProvider>
        <TxFlowProvider step={0} data={mockParams} prevStep={() => {}} nextStep={jest.fn()}>
          <CreateTokenTransfer {...props} />
        </TxFlowProvider>
      </SafeShieldProvider>,
      options,
    )
  }

  it('should display a token amount input', () => {
    const { getByText } = renderCreateTokenTransfer()

    expect(getByText('Amount')).toBeInTheDocument()
  })

  it('should display a recipient input', () => {
    const { getAllByText } = renderCreateTokenTransfer()

    expect(getAllByText('Recipient address')[0]).toBeInTheDocument()
  })

  it('should display a type selection if a spending limit token is selected', () => {
    jest
      .spyOn(tokenUtils, 'useTokenAmount')
      .mockReturnValue({ totalAmount: BigInt(1000), spendingLimitAmount: BigInt(500) })

    const tokenAddress = ZERO_ADDRESS

    jest.spyOn(useBalances, 'default').mockReturnValue({
      balances: {
        fiatTotal: '0',
        items: [
          {
            balance: '10',
            tokenInfo: {
              address: tokenAddress,
              decimals: 18,
              logoUri: 'someurl',
              name: 'Test token',
              symbol: 'TST',
              type: TokenType.ERC20,
            },
            fiatBalance: '10',
            fiatConversion: '1',
          },
        ],
      },
      loaded: true,
      loading: false,
      error: undefined,
    })

    const { getByText } = renderCreateTokenTransfer()

    expect(getByText('Send as')).toBeInTheDocument()

    expect(useHasPermissionSpy).toHaveBeenCalledWith(Permission.CreateSpendingLimitTransaction)
  })

  it('should not display a type selection if user does not have `CreateSpendingLimitTransaction` permission', () => {
    useHasPermissionSpy.mockReturnValueOnce(false)
    const { queryByText } = renderCreateTokenTransfer({ txNonce: 1 })

    expect(queryByText('Send as')).not.toBeInTheDocument()
    expect(useHasPermissionSpy).toHaveBeenCalledWith(Permission.CreateSpendingLimitTransaction)
  })

  it('should not display a type selection if there is a txNonce', () => {
    const { queryByText } = renderCreateTokenTransfer({ txNonce: 1 })

    expect(queryByText('Send as')).not.toBeInTheDocument()
  })

  it('should preselect a specific token (USDC) when passed in data', () => {
    const mockBalances = {
      fiatTotal: '0',
      items: [
        {
          balance: '1000000000000000000',
          tokenInfo: {
            address: ZERO_ADDRESS,
            decimals: 18,
            logoUri: '',
            name: 'Ether',
            symbol: 'ETH',
            type: TokenType.NATIVE_TOKEN,
          },
          fiatBalance: '1000',
          fiatConversion: '1000',
        },
        {
          balance: '1000000000',
          tokenInfo: {
            address: USDC_ADDRESS,
            decimals: 6,
            logoUri: '',
            name: 'USD Coin',
            symbol: 'USDC',
            type: TokenType.ERC20,
          },
          fiatBalance: '1000',
          fiatConversion: '1',
        },
      ],
    }

    jest.spyOn(useTrustedTokenBalances, 'useTrustedTokenBalances').mockReturnValue([mockBalances, undefined, false])

    jest.spyOn(useBalances, 'default').mockReturnValue({
      balances: mockBalances,
      loaded: true,
      loading: false,
      error: undefined,
    })

    const usdcParams = {
      recipients: [
        {
          recipient: '',
          tokenAddress: USDC_ADDRESS,
          amount: '',
        },
      ],
      type: TokenTransferType.multiSig,
    }

    const { getByTestId, getByText } = render(
      <SafeShieldProvider>
        <TxFlowProvider step={0} data={usdcParams} prevStep={() => {}} nextStep={jest.fn()}>
          <CreateTokenTransfer />
        </TxFlowProvider>
      </SafeShieldProvider>,
    )

    const tokenSelector = getByTestId('token-selector')
    const input = tokenSelector.querySelector('input')

    // Check that USDC is displayed, not ETH
    expect(getByText('USD Coin')).toBeInTheDocument()
    expect(input?.value).toBe(USDC_ADDRESS)
  })

  // Test WITHOUT mocking useTrustedTokenBalances - simulates real app where balances load async
  it('should preselect USDC when balances are NOT immediately available', async () => {
    // Only mock useBalances, NOT useTrustedTokenBalances
    // This simulates the real app where useTrustedTokenBalances returns empty initially
    jest.spyOn(useTrustedTokenBalances, 'useTrustedTokenBalances').mockReturnValue([undefined, undefined, true])

    const usdcParams = {
      recipients: [
        {
          recipient: '',
          tokenAddress: USDC_ADDRESS,
          amount: '',
        },
      ],
      type: TokenTransferType.multiSig,
    }

    const { getByTestId } = render(
      <SafeShieldProvider>
        <TxFlowProvider step={0} data={usdcParams} prevStep={() => {}} nextStep={jest.fn()}>
          <CreateTokenTransfer />
        </TxFlowProvider>
      </SafeShieldProvider>,
    )

    const tokenSelector = getByTestId('token-selector')
    const input = tokenSelector.querySelector('input')

    // The input should still have USDC address even though balances aren't loaded
    // This is the critical test - does the form preserve the token address?
    expect(input?.value).toBe(USDC_ADDRESS)
  })

  // Test exactly how SendButton opens the flow - only tokenAddress is passed
  it('should preselect token when opened from SendButton (only tokenAddress passed)', () => {
    const mockBalances = {
      fiatTotal: '0',
      items: [
        {
          balance: '1000000000000000000',
          tokenInfo: {
            address: ZERO_ADDRESS,
            decimals: 18,
            logoUri: '',
            name: 'Ether',
            symbol: 'ETH',
            type: TokenType.NATIVE_TOKEN,
          },
          fiatBalance: '1000',
          fiatConversion: '1000',
        },
        {
          balance: '1000000000',
          tokenInfo: {
            address: USDC_ADDRESS,
            decimals: 6,
            logoUri: '',
            name: 'USD Coin',
            symbol: 'USDC',
            type: TokenType.ERC20,
          },
          fiatBalance: '1000',
          fiatConversion: '1',
        },
      ],
    }

    jest.spyOn(useTrustedTokenBalances, 'useTrustedTokenBalances').mockReturnValue([mockBalances, undefined, false])
    jest.spyOn(useBalances, 'default').mockReturnValue({
      balances: mockBalances,
      loaded: true,
      loading: false,
      error: undefined,
    })

    // This is EXACTLY what SendButton passes - only tokenAddress, no recipient or amount
    // SendButton: setTxFlow(<TokenTransferFlow recipients={[{ tokenAddress: tokenInfo.address }]} />)
    const { getByTestId, getByText } = render(
      <SafeShieldProvider>
        <TokenTransferFlow recipients={[{ tokenAddress: USDC_ADDRESS }]} />
      </SafeShieldProvider>,
    )

    const tokenSelector = getByTestId('token-selector')
    const input = tokenSelector.querySelector('input')

    // USDC should be preselected
    expect(getByText('USD Coin')).toBeInTheDocument()
    expect(input?.value).toBe(USDC_ADDRESS)
  })

  // Test for spending-limit-only user
  it('should preselect passed token for spending-limit-only user (NOT override to first balance)', () => {
    const mockBalances = {
      fiatTotal: '0',
      items: [
        {
          balance: '1000000000000000000',
          tokenInfo: {
            address: ZERO_ADDRESS,
            decimals: 18,
            logoUri: '',
            name: 'Ether',
            symbol: 'ETH',
            type: TokenType.NATIVE_TOKEN,
          },
          fiatBalance: '1000',
          fiatConversion: '1000',
        },
        {
          balance: '1000000000',
          tokenInfo: {
            address: USDC_ADDRESS,
            decimals: 6,
            logoUri: '',
            name: 'USD Coin',
            symbol: 'USDC',
            type: TokenType.ERC20,
          },
          fiatBalance: '1000',
          fiatConversion: '1',
        },
      ],
    }

    jest.spyOn(useTrustedTokenBalances, 'useTrustedTokenBalances').mockReturnValue([mockBalances, undefined, false])
    jest.spyOn(useBalances, 'default').mockReturnValue({
      balances: mockBalances,
      loaded: true,
      loading: false,
      error: undefined,
    })

    // Simulate spending-limit-only user: canCreateSpendingLimitTx=true, canCreateStandardTx=false
    useHasPermissionSpy.mockImplementation((...args) => {
      const permission = args[0] as Permission
      if (permission === Permission.CreateTransaction) return false
      if (permission === Permission.CreateSpendingLimitTransaction) return true
      return true
    })

    const { getByTestId } = render(
      <SafeShieldProvider>
        <TokenTransferFlow recipients={[{ tokenAddress: USDC_ADDRESS }]} />
      </SafeShieldProvider>,
    )

    const tokenSelector = getByTestId('token-selector')
    const input = tokenSelector.querySelector('input')

    // USDC should be preselected (not ETH which is balancesItems[0])
    expect(input?.value).toBe(USDC_ADDRESS)
  })
})
