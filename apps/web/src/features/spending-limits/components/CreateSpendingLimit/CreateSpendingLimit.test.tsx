import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { useFormContext } from 'react-hook-form'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { tokenOptionBuilder } from '@/tests/builders/tokenOptions'
import { SpendingLimitFields, type NewSpendingLimitFlowProps } from '../../types'
import CreateSpendingLimit from './index'
import { NO_TOKEN_SELECTED_ERROR } from '../../services/spendingLimitValidation'
import type { TokenOption } from '../../services/tokenOptions'
import * as useSpendingLimitTokenOptionsHook from '../../hooks/useSpendingLimitTokenOptions'
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

const nativeOption = tokenOptionBuilder()
  .with({
    address: ZERO_ADDRESS,
    symbol: 'ETH',
    name: 'Ether',
    decimals: 18,
    group: 'held',
    balance: '1000000000000000000',
  })
  .build()

const mockOptions = (options: TokenOption[]) => {
  jest.spyOn(useSpendingLimitTokenOptionsHook, 'default').mockReturnValue({
    options,
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    isPopularLoading: false,
    isPopularError: false,
    refetchPopular: jest.fn(),
    identityKey: `1:${BENEFICIARY}`,
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

  it('shows the selected token and its balance in the token picker', () => {
    mockOptions([nativeOption])

    renderForm()

    expect(screen.getByTestId('spending-limit-token-selector')).toHaveValue('ETH')
    expect(screen.getByText('1 ETH')).toBeInTheDocument()
  })

  it('resets the limit only once by default', () => {
    mockOptions([nativeOption])

    renderForm()

    expect(screen.getByTestId('time-period-section')).toHaveTextContent('One time')
  })

  describe('Next button', () => {
    it('stays disabled and asks for more than 0 when the amount is 0', async () => {
      mockOptions([nativeOption])

      renderForm()
      await fillForm('0')

      expect(await screen.findByText('The value must be greater than 0')).toBeInTheDocument()
      expect(screen.getByTestId('next-btn')).toBeDisabled()
    })

    it('is disabled while the form is empty', () => {
      mockOptions([nativeOption])

      renderForm()

      expect(screen.getByTestId('next-btn')).toBeDisabled()
    })

    it('stays disabled and flags the missing token when an amount is entered without a selectable token', async () => {
      mockOptions([])

      const { onNext } = renderForm()
      await fillForm('1')

      expect(await screen.findByText(NO_TOKEN_SELECTED_ERROR)).toBeInTheDocument()
      expect(screen.getByTestId('next-btn')).toBeDisabled()

      fireEvent.submit(screen.getByTestId('next-btn'))
      await waitFor(() => expect(screen.getByTestId('next-btn')).toBeDisabled())
      expect(onNext).not.toHaveBeenCalled()
    })

    it('stays disabled when the amount exceeds the allowance range of the selected token', async () => {
      mockOptions([nativeOption])

      renderForm()
      await fillForm('100000000000000000000')

      expect(await screen.findByText('Amount is too big')).toBeInTheDocument()
      expect(screen.getByTestId('next-btn')).toBeDisabled()
    })

    it('is enabled and submits once beneficiary, token and amount are valid', async () => {
      mockOptions([nativeOption])

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

    it('submits a popular token the Safe does not hold', async () => {
      const popular = tokenOptionBuilder().with({ symbol: 'USDC', decimals: 6, group: 'popular' }).build()
      mockOptions([nativeOption, popular])

      const { onNext } = renderForm({ [SpendingLimitFields.tokenAddress]: popular.address })
      await fillForm('1.5')

      await waitFor(() => expect(screen.getByTestId('next-btn')).toBeEnabled())
      await userEvent.click(screen.getByTestId('next-btn'))

      await waitFor(() =>
        expect(onNext).toHaveBeenCalledWith(
          expect.objectContaining({
            [SpendingLimitFields.tokenAddress]: popular.address,
            [SpendingLimitFields.amount]: '1.5',
          }),
          expect.anything(),
        ),
      )
    })

    it('re-validates a prefilled amount once the selected token becomes available', async () => {
      mockOptions([])

      const { rerender, buildUi } = renderForm({
        [SpendingLimitFields.beneficiary]: BENEFICIARY,
        [SpendingLimitFields.amount]: '1.5',
      })

      expect(await screen.findByText(NO_TOKEN_SELECTED_ERROR)).toBeInTheDocument()
      expect(screen.getByTestId('next-btn')).toBeDisabled()

      mockOptions([nativeOption])
      rerender(buildUi())

      await waitFor(() => expect(screen.getByTestId('next-btn')).toBeEnabled())
      expect(screen.queryByText(NO_TOKEN_SELECTED_ERROR)).not.toBeInTheDocument()
    })
  })
})
