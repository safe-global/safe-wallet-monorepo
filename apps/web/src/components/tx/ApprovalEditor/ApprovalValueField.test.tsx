import type { ReactNode } from 'react'
import { render, screen, waitFor } from '@/tests/test-utils'
import { userEvent } from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'
import { faker } from '@faker-js/faker'
import { TokenType } from '@safe-global/store/gateway/types'
import { PSEUDO_APPROVAL_VALUES } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import { ApprovalValueField } from './ApprovalValueField'
import type { ApprovalInfo } from './hooks/useApprovalInfos'

const FIELD_NAME = 'approvals.0'
const INITIAL_AMOUNT = '420.0'

const buildApproval = (overrides: Partial<ApprovalInfo> = {}): ApprovalInfo => {
  const tokenAddress = faker.finance.ethereumAddress()
  return {
    tokenInfo: { symbol: 'TST', decimals: 18, address: tokenAddress, type: TokenType.ERC20 },
    tokenAddress,
    spender: faker.finance.ethereumAddress(),
    amount: 4200000n,
    amountFormatted: INITIAL_AMOUNT,
    method: 'approve',
    transactionIndex: 0,
    ...overrides,
  }
}

type ApprovalFormValues = { approvals: string[] }

const Harness = ({
  approval,
  onFormChange,
  startAdornment,
  endAdornment,
}: {
  approval: ApprovalInfo
  onFormChange?: (values: string[]) => void
  startAdornment?: ReactNode
  endAdornment?: ReactNode
}) => {
  const formMethods = useForm<ApprovalFormValues>({
    defaultValues: { approvals: [INITIAL_AMOUNT] },
    mode: 'onChange',
  })

  onFormChange?.(formMethods.watch('approvals'))

  return (
    <FormProvider {...formMethods}>
      <ApprovalValueField
        name={FIELD_NAME}
        tx={approval}
        readOnly={false}
        startAdornment={startAdornment}
        endAdornment={endAdornment}
      />
    </FormProvider>
  )
}

const getAmountInput = () => screen.getByRole('combobox') as HTMLInputElement

describe('ApprovalValueField', () => {
  it('renders the current approval amount', () => {
    render(<Harness approval={buildApproval()} />)
    expect(getAmountInput()).toHaveValue(INITIAL_AMOUNT)
  })

  // Regression: the Combobox is controlled through `inputValue` only — no `value`/`onValueChange` —
  // so Base UI's single-selection close handler resets the input to the (empty) selected value and
  // the edited amount is discarded as soon as the preset dropdown closes.
  it('keeps the edited amount when the preset dropdown is dismissed with Escape', async () => {
    const user = userEvent.setup()
    const formValues: string[][] = []
    render(<Harness approval={buildApproval()} onFormChange={(values) => formValues.push(values)} />)

    const input = getAmountInput()
    await user.click(input)
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument())

    await user.clear(input)
    await user.type(input, '100')
    expect(input).toHaveValue('100')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'))

    expect(input).toHaveValue('100')
    expect(formValues.at(-1)).toEqual(['100'])
  })

  it('keeps the edited amount when the preset dropdown is dismissed by clicking outside', async () => {
    const user = userEvent.setup()
    render(<Harness approval={buildApproval()} />)

    const input = getAmountInput()
    await user.click(input)
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument())

    await user.clear(input)
    await user.type(input, '100')
    expect(input).toHaveValue('100')

    await user.click(document.body)
    await waitFor(() => expect(input).toHaveAttribute('aria-expanded', 'false'))

    expect(input).toHaveValue('100')
  })

  // Same root cause: with no `value` wired up, Base UI has no selected value, so its
  // single-selection filter treats the current amount in the input as a search query and filters
  // the only preset out — the dropdown opens empty.
  it('lists the "Unlimited amount" preset and applies it when selected', async () => {
    const user = userEvent.setup()
    render(<Harness approval={buildApproval()} />)

    const input = getAmountInput()
    await user.click(input)
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument())

    const preset = await screen.findByRole('option', { name: PSEUDO_APPROVAL_VALUES.UNLIMITED })
    await user.click(preset)

    await waitFor(() => expect(input).toHaveValue(PSEUDO_APPROVAL_VALUES.UNLIMITED))
  })

  // The adornments have to render inside the field, not as siblings of it: that is what keeps them
  // on the input's grid row instead of centred on a column whose height the label and the helper
  // text change.
  it('renders the adornments inside the field, on the input row', () => {
    const { container } = render(
      <Harness
        approval={buildApproval()}
        startAdornment={<span data-testid="start-adornment" />}
        endAdornment={<span data-testid="end-adornment" />}
      />,
    )

    const field = container.querySelector('[data-slot="field"]')
    expect(field).toContainElement(screen.getByTestId('start-adornment'))
    expect(field).toContainElement(screen.getByTestId('end-adornment'))
  })
})
