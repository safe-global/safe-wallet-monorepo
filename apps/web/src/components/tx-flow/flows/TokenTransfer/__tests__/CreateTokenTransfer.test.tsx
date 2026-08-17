import { TokenTransferType } from '@/components/tx-flow/flows/TokenTransfer'
import TokenTransferFlow from '@/components/tx-flow/flows/TokenTransfer'
import CreateTokenTransfer, {
  type CreateTokenTransferProps,
} from '@/components/tx-flow/flows/TokenTransfer/CreateTokenTransfer'
import * as tokenUtils from '@/components/tx-flow/flows/TokenTransfer/utils'
import * as useHasPermission from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/config'
import { render } from '@/tests/test-utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { TokenType } from '@safe-global/store/gateway/types'
import TxFlowProvider from '@/components/tx-flow/TxFlowProvider'
import { SafeShieldProvider } from '@/features/safe-shield/SafeShieldContext'
import * as useRecipientAnalysis from '@/features/safe-shield'
import * as useBalances from '@/hooks/useBalances'
import * as useTrustedTokenBalances from '@/hooks/loadables/useTrustedTokenBalances'
import * as chainHooks from '@/hooks/useChains'
import * as gtfHooks from '@/features/gtf'
import * as remoteSafeAppsHooks from '@/hooks/safe-apps/useRemoteSafeApps'
import type { SafeApp } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { fireEvent, waitFor } from '@testing-library/react'

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

  describe('GTF fee banner', () => {
    const useHasFeatureSpy = jest.spyOn(chainHooks, 'useHasFeature')
    const useResolvedGasTokenSpy = jest.spyOn(gtfHooks, 'useResolvedGasToken')

    const mockResolvedToSentToken = () =>
      useResolvedGasTokenSpy.mockImplementation(
        (sent?: string) => ({ status: 'resolved', address: sent ?? ZERO_ADDRESS }) as never,
      )

    const mockBalancesForGtf = () => {
      const balances = {
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
        ],
      }

      jest.spyOn(useTrustedTokenBalances, 'useTrustedTokenBalances').mockReturnValue([balances, undefined, false])
      jest.spyOn(useBalances, 'default').mockReturnValue({
        balances,
        loaded: true,
        loading: false,
        error: undefined,
      })
    }

    it('shows fee banner after MAX click when resolved gas token equals sent token', async () => {
      useHasFeatureSpy.mockImplementation(() => true)
      mockBalancesForGtf()
      mockResolvedToSentToken()

      const { getByTestId, queryByTestId } = renderCreateTokenTransfer()

      expect(queryByTestId('gtf-fee-banner')).not.toBeInTheDocument()

      fireEvent.click(getByTestId('max-btn'))

      await waitFor(() => {
        expect(getByTestId('gtf-fee-banner')).toBeInTheDocument()
      })
    })

    it('does not show fee banner when GTF is disabled', () => {
      useHasFeatureSpy.mockImplementation(() => false)
      mockBalancesForGtf()

      const { getByTestId, queryByTestId } = renderCreateTokenTransfer()

      fireEvent.click(getByTestId('max-btn'))

      expect(queryByTestId('gtf-fee-banner')).not.toBeInTheDocument()
    })

    it('does not show fee banner when resolved gas token differs from sent token', () => {
      useHasFeatureSpy.mockImplementation(() => true)
      mockBalancesForGtf()
      // Resolve to a different address → sent ≠ fee → banner should stay hidden even after MAX
      useResolvedGasTokenSpy.mockReturnValue({
        status: 'resolved',
        address: '0x1111111111111111111111111111111111111111',
      } as never)

      const { getByTestId, queryByTestId } = renderCreateTokenTransfer()

      fireEvent.click(getByTestId('max-btn'))

      expect(queryByTestId('gtf-fee-banner')).not.toBeInTheDocument()
    })

    it('dismisses fee banner on close button click', async () => {
      useHasFeatureSpy.mockImplementation(() => true)
      mockBalancesForGtf()
      mockResolvedToSentToken()

      const { getByTestId, queryByTestId, getByLabelText } = renderCreateTokenTransfer()

      fireEvent.click(getByTestId('max-btn'))

      await waitFor(() => {
        expect(getByTestId('gtf-fee-banner')).toBeInTheDocument()
      })

      fireEvent.click(getByLabelText('Dismiss fee banner'))

      expect(queryByTestId('gtf-fee-banner')).not.toBeInTheDocument()
    })

    // WA-3185: the fee banner must render as a toned-down "info" alert (matching the pre-migration
    // MUI `severity="info"`), not the plain/unstyled default alert it silently fell back to post-migration.
    it('renders the fee banner with the info alert styling, not the plain default alert', async () => {
      useHasFeatureSpy.mockImplementation(() => true)
      mockBalancesForGtf()
      mockResolvedToSentToken()

      const { getByTestId } = renderCreateTokenTransfer()

      fireEvent.click(getByTestId('max-btn'))

      await waitFor(() => {
        expect(getByTestId('gtf-fee-banner')).toBeInTheDocument()
      })

      expect(getByTestId('gtf-fee-banner')).toHaveClass('bg-muted', 'text-foreground', 'border-transparent')
    })

    it('renders the standard info icon inside the fee banner', async () => {
      useHasFeatureSpy.mockImplementation(() => true)
      mockBalancesForGtf()
      mockResolvedToSentToken()

      const { getByTestId } = renderCreateTokenTransfer()

      fireEvent.click(getByTestId('max-btn'))

      await waitFor(() => {
        expect(getByTestId('gtf-fee-banner')).toBeInTheDocument()
      })

      expect(getByTestId('gtf-fee-banner').querySelector('svg.lucide-info')).toBeInTheDocument()
    })
  })

  // WA-3185: the CSV airdrop hint must render as a toned-down "info" alert (matching the pre-migration
  // MUI `severity="info"`), not the plain/unstyled default alert it silently fell back to post-migration.
  describe('CSV airdrop hint', () => {
    const useHasFeatureSpy = jest.spyOn(chainHooks, 'useHasFeature')
    const useRemoteSafeAppsSpy = jest.spyOn(remoteSafeAppsHooks, 'useRemoteSafeApps')

    const csvApp: SafeApp = {
      id: 1,
      name: 'CSV Airdrop',
      url: 'https://example.com/csv-airdrop',
      description: '',
      chainIds: [],
      accessControl: { type: 'NO_RESTRICTIONS' },
      tags: [],
      features: [],
      socialProfiles: [],
      featured: false,
    }

    beforeEach(() => {
      // Only enable MASS_PAYOUTS (needed to show "Add recipient"/the CSV hint) — leave GTF off so
      // the unrelated fee-preview machinery in RecipientRow stays inert for this describe block.
      useHasFeatureSpy.mockImplementation((feature) => feature === FEATURES.MASS_PAYOUTS)
      useRemoteSafeAppsSpy.mockReturnValue([[csvApp], undefined, false])
    })

    it('shows the CSV hint as an info alert after adding a second recipient', () => {
      const { getByTestId } = renderCreateTokenTransfer()

      fireEvent.click(getByTestId('add-recipient-btn'))

      const csvHint = getByTestId('csv-airdrop-hint')
      expect(csvHint).toBeInTheDocument()
      expect(csvHint).toHaveClass('bg-muted', 'text-foreground', 'border-transparent')
    })

    it('renders the standard info icon inside the CSV hint', () => {
      const { getByTestId } = renderCreateTokenTransfer()

      fireEvent.click(getByTestId('add-recipient-btn'))

      expect(getByTestId('csv-airdrop-hint').querySelector('svg.lucide-info')).toBeInTheDocument()
    })

    it('dismisses the CSV hint on close button click', () => {
      const { getByTestId, queryByTestId, getByLabelText } = renderCreateTokenTransfer()

      fireEvent.click(getByTestId('add-recipient-btn'))
      expect(getByTestId('csv-airdrop-hint')).toBeInTheDocument()

      fireEvent.click(getByLabelText('close'))

      expect(queryByTestId('csv-airdrop-hint')).not.toBeInTheDocument()
    })

    it('renders the standard warning icon on the max-recipients-reached alert', () => {
      const { getByTestId } = renderCreateTokenTransfer()

      // MAX_RECIPIENTS is 5 — starting from 1 recipient, 4 more clicks fills the cap.
      for (let i = 0; i < 4; i++) {
        fireEvent.click(getByTestId('add-recipient-btn'))
      }

      const maxReached = getByTestId('max-recipients-reached')
      expect(maxReached).toBeInTheDocument()
      expect(maxReached.querySelector('svg.lucide-triangle-alert')).toBeInTheDocument()
    })

    // WA-3185: filled (outlined=false) alerts use the Obra design system's borderless
    // severity-tinted background — matching the pre-migration MUI standard alert.
    it('renders the max-recipients-reached alert filled (tinted background, no border)', () => {
      const { getByTestId } = renderCreateTokenTransfer()

      for (let i = 0; i < 4; i++) {
        fireEvent.click(getByTestId('add-recipient-btn'))
      }

      const maxReached = getByTestId('max-recipients-reached')
      expect(maxReached).toHaveClass('bg-warning-subtle', 'border-transparent', 'text-warning-strong')
      expect(maxReached).not.toHaveClass('bg-card')
    })
  })

  // WA-3185: lock in that the destructive insufficient-balance alert carries the standard
  // severity icon, matching its warning/info siblings in this same form.
  describe('Insufficient balance alert', () => {
    const useHasFeatureSpy = jest.spyOn(chainHooks, 'useHasFeature')

    beforeEach(() => {
      useHasFeatureSpy.mockImplementation((feature) => feature === FEATURES.MASS_PAYOUTS)

      const balances = {
        fiatTotal: '0',
        items: [
          {
            balance: '1000000', // 1 USDC
            tokenInfo: {
              address: USDC_ADDRESS,
              decimals: 6,
              logoUri: '',
              name: 'USD Coin',
              symbol: 'USDC',
              type: TokenType.ERC20,
            },
            fiatBalance: '1',
            fiatConversion: '1',
          },
        ],
      }

      jest.spyOn(useTrustedTokenBalances, 'useTrustedTokenBalances').mockReturnValue([balances, undefined, false])
      jest.spyOn(useBalances, 'default').mockReturnValue({
        balances,
        loaded: true,
        loading: false,
        error: undefined,
      })
      // Another test in this file (`should display a type selection...`) mocks `useTokenAmount`
      // with a fixed totalAmount and never restores it, which otherwise leaks a stale balance into
      // this describe when the full suite runs. Re-derive it from *this* test's balances so the
      // "exceeds available balance" assertion below is deterministic regardless of run order.
      jest.spyOn(tokenUtils, 'useTokenAmount').mockImplementation((selectedToken) => ({
        totalAmount: BigInt(selectedToken?.balance || 0),
        spendingLimitAmount: 0n,
      }))
    })

    it('renders the standard destructive icon once the assigned total exceeds the balance', async () => {
      const twoRecipientParams = {
        recipients: [
          { recipient: '', tokenAddress: USDC_ADDRESS, amount: '' },
          { recipient: '', tokenAddress: USDC_ADDRESS, amount: '' },
        ],
        type: TokenTransferType.multiSig,
      }

      const { getByTestId, getAllByTestId } = render(
        <SafeShieldProvider>
          <TxFlowProvider step={0} data={twoRecipientParams} prevStep={() => {}} nextStep={jest.fn()}>
            <CreateTokenTransfer />
          </TxFlowProvider>
        </SafeShieldProvider>,
      )

      const amountFields = getAllByTestId('token-amount-field')
      // 0.6 + 0.6 USDC assigned against a 1 USDC balance — sum exceeds what's available.
      fireEvent.change(amountFields[0], { target: { value: '0.6' } })
      fireEvent.change(amountFields[1], { target: { value: '0.6' } })

      await waitFor(() => {
        expect(getByTestId('insufficient-balance-error')).toBeInTheDocument()
      })

      expect(getByTestId('insufficient-balance-error').querySelector('svg.lucide-circle-alert')).toBeInTheDocument()
    })

    // WA-3185: filled (outlined=false) alerts use the Obra design system's borderless
    // severity-tinted background — matching the pre-migration MUI standard alert.
    it('renders the insufficient-balance alert filled (tinted background, no border)', async () => {
      const twoRecipientParams = {
        recipients: [
          { recipient: '', tokenAddress: USDC_ADDRESS, amount: '' },
          { recipient: '', tokenAddress: USDC_ADDRESS, amount: '' },
        ],
        type: TokenTransferType.multiSig,
      }

      const { getByTestId, getAllByTestId } = render(
        <SafeShieldProvider>
          <TxFlowProvider step={0} data={twoRecipientParams} prevStep={() => {}} nextStep={jest.fn()}>
            <CreateTokenTransfer />
          </TxFlowProvider>
        </SafeShieldProvider>,
      )

      const amountFields = getAllByTestId('token-amount-field')
      fireEvent.change(amountFields[0], { target: { value: '0.6' } })
      fireEvent.change(amountFields[1], { target: { value: '0.6' } })

      await waitFor(() => {
        expect(getByTestId('insufficient-balance-error')).toBeInTheDocument()
      })

      const alert = getByTestId('insufficient-balance-error')
      expect(alert).toHaveClass('bg-error-subtle', 'border-transparent', 'text-error-strong')
      expect(alert).not.toHaveClass('bg-card')
    })
  })
})
