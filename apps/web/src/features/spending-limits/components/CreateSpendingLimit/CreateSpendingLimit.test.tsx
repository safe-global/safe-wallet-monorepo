import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { useFormContext } from 'react-hook-form'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { TokenType } from '@safe-global/store/gateway/types'
import type { Balances } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { PortfolioBalances } from '@/hooks/loadables/useLoadBalances'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SpendingLimitFields, type NewSpendingLimitFlowProps } from '../../types'
import CreateSpendingLimit, { NO_TOKEN_SELECTED_ERROR } from './index'
import * as useVisibleBalancesHook from '@/hooks/useVisibleBalances'
import * as useIsSpendingLimitSupportedHook from '../../hooks/useIsSpendingLimitSupported'

jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  useSafeShieldForAddressPoisoning: jest.fn(),
}))

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: () => '1',
}))

// The beneficiary field is not under test; a plain required input keeps the form's validity
// dependent only on the amount/token logic exercised here.
jest.mock('@/components/common/AddressBookInput', () => {
  const MockAddressBookInput = ({ name }: { name: string }) => {
    const { register } = useFormContext()
    return <input data-testid="beneficiary-input" {...register(name, { required: true })} />
  }
  return { __esModule: true, default: MockAddressBookInput }
})

const BENEFICIARY = '0x1234567890123456789012345678901234567890'

const nativeBalance: Balances['items'][number] = {
  balance: '1000000000000000000',
  fiatBalance: '1000',
  fiatConversion: '1000',
  tokenInfo: {
    address: ZERO_ADDRESS,
    decimals: 18,
    logoUri: '',
    name: 'Ether',
    symbol: 'ETH',
    type: TokenType.NATIVE_TOKEN,
  },
}

const mockBalances = (items: Balances['items']) => {
  jest.spyOn(useVisibleBalancesHook, 'useVisibleBalances').mockReturnValue({
    balances: { items, fiatTotal: '' } as PortfolioBalances,
    loaded: true,
    loading: false,
  })
}

const buildForm = (data?: Partial<NewSpendingLimitFlowProps>) => {
  const onNext = jest.fn()
  const context: TxFlowContextType<NewSpendingLimitFlowProps> = {
    ...initialContext,
    data: {
      [SpendingLimitFields.beneficiary]: '',
      [SpendingLimitFields.tokenAddress]: ZERO_ADDRESS,
      [SpendingLimitFields.amount]: '',
      [SpendingLimitFields.resetTime]: '0',
      ...data,
    },
    onNext,
  }

  // A fresh element per render call, so `rerender` cannot bail out on an identical element.
  const buildUi = () => (
    <TxFlowContext.Provider value={context as TxFlowContextType}>
      <CreateSpendingLimit />
    </TxFlowContext.Provider>
  )

  return { buildUi, onNext }
}

const renderForm = (data?: Partial<NewSpendingLimitFlowProps>) => {
  const { buildUi, onNext } = buildForm(data)
  return { ...render(buildUi()), buildUi, onNext }
}

const fillForm = async (amount: string) => {
  await userEvent.type(screen.getByTestId('beneficiary-input'), BENEFICIARY)
  await userEvent.type(screen.getByTestId('token-amount-field'), amount)
}

describe('CreateSpendingLimit', () => {
  beforeEach(() => {
    jest.spyOn(useIsSpendingLimitSupportedHook, 'default').mockReturnValue(true)
  })

  afterEach(() => jest.restoreAllMocks())

  it('does not render the raw token address in the amount selector when the Safe has no balances', () => {
    mockBalances([])

    renderForm()

    expect(screen.getByTestId('token-selector')).not.toHaveTextContent(ZERO_ADDRESS)
  })

  it('shows the selected token when it is present in the balances', () => {
    mockBalances([nativeBalance])

    renderForm()

    expect(screen.getByTestId('token-selector')).toHaveTextContent('ETH')
  })

  describe('Next button', () => {
    it('is disabled while the form is empty', () => {
      mockBalances([nativeBalance])

      renderForm()

      expect(screen.getByTestId('next-btn')).toBeDisabled()
    })

    it('stays disabled and flags the missing token when an amount is entered without a selectable token', async () => {
      mockBalances([])

      const { onNext } = renderForm()
      await fillForm('1')

      expect(await screen.findByText(NO_TOKEN_SELECTED_ERROR)).toBeInTheDocument()
      expect(screen.getByTestId('next-btn')).toBeDisabled()

      fireEvent.submit(screen.getByTestId('next-btn'))
      await waitFor(() => expect(screen.getByTestId('next-btn')).toBeDisabled())
      expect(onNext).not.toHaveBeenCalled()
    })

    it('stays disabled when the amount exceeds the allowance range of the selected token', async () => {
      mockBalances([nativeBalance])

      renderForm()
      await fillForm('100000000000000000000')

      expect(await screen.findByText('Amount is too big')).toBeInTheDocument()
      expect(screen.getByTestId('next-btn')).toBeDisabled()
    })

    it('is enabled and submits once beneficiary, token and amount are valid', async () => {
      mockBalances([nativeBalance])

      const { onNext } = renderForm()
      await fillForm('1')

      await waitFor(() => expect(screen.getByTestId('next-btn')).toBeEnabled())

      await userEvent.click(screen.getByTestId('next-btn'))

      await waitFor(() =>
        expect(onNext).toHaveBeenCalledWith(
          expect.objectContaining({
            [SpendingLimitFields.beneficiary]: BENEFICIARY,
            [SpendingLimitFields.tokenAddress]: ZERO_ADDRESS,
            [SpendingLimitFields.amount]: '1',
          }),
          expect.anything(),
        ),
      )
    })

    it('re-validates a prefilled amount once the selected token becomes available', async () => {
      mockBalances([])

      const { rerender, buildUi } = renderForm({
        [SpendingLimitFields.beneficiary]: BENEFICIARY,
        [SpendingLimitFields.amount]: '1.5',
      })

      expect(await screen.findByText(NO_TOKEN_SELECTED_ERROR)).toBeInTheDocument()
      expect(screen.getByTestId('next-btn')).toBeDisabled()

      mockBalances([nativeBalance])
      rerender(buildUi())

      await waitFor(() => expect(screen.getByTestId('next-btn')).toBeEnabled())
      expect(screen.queryByText(NO_TOKEN_SELECTED_ERROR)).not.toBeInTheDocument()
    })
  })
})
