import { FormProvider, useForm, useFormContext } from 'react-hook-form'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { spendingLimitStateBuilder } from '@/tests/builders/spendingLimits'
import { ADD_TOKEN_LABEL, DUPLICATE_SPENDER_ERROR, REMOVE_SPENDER_LABEL, SPENDER_HELPER_TEXT } from '../../constants'
import { createEmptySpender, type SpenderFormValues, type SpendingLimitPolicyFormValues } from '../../types'
import { useExistingSpendingLimits } from '../../ExistingSpendingLimitsProvider'
import { EditModeProvider } from '../../EditFlow/EditModeContext'
import SpenderCard from '../SpenderCard'

// The address book field has its own suite; a registered input keeps the card's validity about its own rules.
jest.mock('@/components/common/AddressBookInput', () => {
  const MockAddressBookInput = ({
    name,
    validate,
    deps,
    excludeAddresses = [],
    disabled,
    'data-testid': testId,
  }: {
    name: string
    validate?: (value: string) => string | undefined | Promise<string | undefined>
    deps?: string[]
    excludeAddresses?: readonly string[]
    disabled?: boolean
    'data-testid'?: string
  }) => {
    const {
      register,
      formState: { errors },
    } = useFormContext()
    const error = name
      .split('.')
      .reduce<unknown>((acc, key) => (acc as Record<string, unknown> | undefined)?.[key], errors) as
      { message?: string } | undefined
    return (
      <div>
        <input
          data-testid={testId}
          data-excluded={excludeAddresses.join(',')}
          disabled={disabled}
          {...register(name, { required: true, validate, deps })}
        />
        {error?.message && <span>{error.message}</span>}
      </div>
    )
  }
  return { __esModule: true, default: MockAddressBookInput }
})

jest.mock('../TokenLimitCard', () => ({
  __esModule: true,
  default: ({ limitIndex, removable, onRemove }: { limitIndex: number; removable: boolean; onRemove: () => void }) => (
    <div data-testid="token-limit-card">
      limit {limitIndex}
      {removable && (
        <button type="button" onClick={onRemove}>
          remove limit {limitIndex}
        </button>
      )}
    </div>
  ),
}))

jest.mock('../../ExistingSpendingLimitsProvider', () => ({
  useExistingSpendingLimits: jest.fn(() => ({ loading: false })),
}))

const mockUseExisting = useExistingSpendingLimits as jest.MockedFunction<typeof useExistingSpendingLimits>

const SPENDER = '0x1234567890123456789012345678901234567890'
const OTHER_SPENDER = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'

const Harness = ({
  spenders,
  onRemove = jest.fn(),
  edit = false,
}: {
  spenders: SpenderFormValues[]
  onRemove?: () => void
  edit?: boolean
}) => {
  const methods = useForm<SpendingLimitPolicyFormValues>({ mode: 'onChange', defaultValues: { safe: '', spenders } })
  const cards = (
    <FormProvider {...methods}>
      {spenders.map((_, index) => (
        <SpenderCard
          key={index}
          spenderIndex={index}
          spenderCount={spenders.length}
          removable={spenders.length > 1}
          onRemove={onRemove}
        />
      ))}
      <button type="button" onClick={() => methods.trigger()}>
        validate
      </button>
    </FormProvider>
  )

  return edit ? <EditModeProvider>{cards}</EditModeProvider> : cards
}

describe('SpenderCard', () => {
  it('starts with one limit row and explains who the spender is', () => {
    renderWithUserEvent(<Harness spenders={[createEmptySpender()]} />)

    expect(screen.getAllByTestId('token-limit-card')).toHaveLength(1)
    expect(screen.getByText(SPENDER_HELPER_TEXT)).toBeInTheDocument()
  })

  it('adds a limit row per "Add token" and lets rows be removed while more than one remain', async () => {
    const { user } = renderWithUserEvent(<Harness spenders={[createEmptySpender()]} />)

    await user.click(screen.getByRole('button', { name: ADD_TOKEN_LABEL }))
    expect(screen.getAllByTestId('token-limit-card')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'remove limit 0' }))
    expect(screen.getAllByTestId('token-limit-card')).toHaveLength(1)
    expect(screen.getByTestId('token-limit-card')).toHaveTextContent('limit 0')
    expect(screen.queryByRole('button', { name: /remove row/ })).not.toBeInTheDocument()
  })

  it('rejects a spender that is already in the policy', async () => {
    const { user } = renderWithUserEvent(
      <Harness
        spenders={[
          { ...createEmptySpender(), address: SPENDER },
          { ...createEmptySpender(), address: SPENDER },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'validate' }))

    expect(await screen.findAllByText(DUPLICATE_SPENDER_ERROR)).toHaveLength(2)
  })

  it('keeps the spenders already in the policy out of the suggestions', () => {
    renderWithUserEvent(
      <Harness
        spenders={[
          { ...createEmptySpender(), address: SPENDER },
          { ...createEmptySpender(), address: OTHER_SPENDER },
        ]}
      />,
    )

    const [first, second] = screen.getAllByTestId('spender-address-input')
    expect(first).toHaveAttribute('data-excluded', OTHER_SPENDER)
    expect(second).toHaveAttribute('data-excluded', SPENDER)
  })

  it('leaves the remove button clickable across its whole face', () => {
    renderWithUserEvent(<Harness spenders={[createEmptySpender(), createEmptySpender()]} />)

    // The address field's wrapper is `position: relative` and follows the button in the DOM, so
    // without a stacking bump its label paints over the button and eats the click.
    const button = screen.getAllByRole('button', { name: REMOVE_SPENDER_LABEL })[0]
    expect(button.className).toContain('z-10')
  })

  it('offers to remove the spender only when it is not the last one', async () => {
    const onRemove = jest.fn()
    const { user, unmount } = renderWithUserEvent(
      <Harness spenders={[createEmptySpender(), createEmptySpender()]} onRemove={onRemove} />,
    )

    await user.click(screen.getAllByRole('button', { name: REMOVE_SPENDER_LABEL })[1])
    expect(onRemove).toHaveBeenCalled()

    unmount()
    renderWithUserEvent(<Harness spenders={[createEmptySpender()]} />)
    expect(screen.queryByRole('button', { name: REMOVE_SPENDER_LABEL })).not.toBeInTheDocument()
  })

  describe('in edit mode', () => {
    const onChainSpender = spendingLimitStateBuilder().with({ beneficiary: SPENDER }).build()

    it('keeps the same field for a spender the Safe already limits, only not editable', () => {
      mockUseExisting.mockReturnValue({ limits: [onChainSpender], loading: false })

      renderWithUserEvent(<Harness spenders={[{ ...createEmptySpender(), address: SPENDER }]} edit />)

      expect(screen.getByTestId('spender-address-input')).toBeDisabled()
      expect(screen.getByText(SPENDER_HELPER_TEXT)).toBeInTheDocument()
    })

    it('still lets a spender added during this edit be typed', () => {
      mockUseExisting.mockReturnValue({ limits: [onChainSpender], loading: false })

      renderWithUserEvent(<Harness spenders={[createEmptySpender()]} edit />)

      expect(screen.getByTestId('spender-address-input')).toBeEnabled()
    })
  })
})
