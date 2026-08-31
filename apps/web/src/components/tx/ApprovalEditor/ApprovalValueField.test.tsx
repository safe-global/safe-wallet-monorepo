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

const Harness = ({ approval, onFormChange }: { approval: ApprovalInfo; onFormChange?: (values: string[]) => void }) => {
  const formMethods = useForm<ApprovalFormValues>({
    defaultValues: { approvals: [INITIAL_AMOUNT] },
    mode: 'onChange',
  })

  onFormChange?.(formMethods.watch('approvals'))

  return (
    <FormProvider {...formMethods}>
      <ApprovalValueField name={FIELD_NAME} tx={approval} readOnly={false} />
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

  // Regression: Base UI's default filter treats the typed amount as a search query. It matches no
  // preset, so the list empties while the popup stays open — `overflow: hidden` collapses it to
  // height 0 and only its ring paints, as a hairline under the input, while the input keeps
  // announcing an expanded listbox with nothing in it.
  it('keeps the preset listed after typing an amount that matches no preset', async () => {
    const user = userEvent.setup()
    render(<Harness approval={buildApproval()} />)

    const input = getAmountInput()
    await user.click(input)
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument())

    await user.clear(input)
    await user.type(input, '250')
    expect(input).toHaveValue('250')

    expect(input).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('option')).toHaveLength(Object.values(PSEUDO_APPROVAL_VALUES).length)
    expect(screen.getByRole('option', { name: PSEUDO_APPROVAL_VALUES.UNLIMITED })).toBeInTheDocument()
  })

  it('still applies the preset when it is selected after typing an amount', async () => {
    const user = userEvent.setup()
    render(<Harness approval={buildApproval()} />)

    const input = getAmountInput()
    await user.click(input)
    await waitFor(() => expect(screen.getByRole('listbox')).toBeInTheDocument())

    await user.clear(input)
    await user.type(input, '250')

    await user.click(await screen.findByRole('option', { name: PSEUDO_APPROVAL_VALUES.UNLIMITED }))

    await waitFor(() => expect(input).toHaveValue(PSEUDO_APPROVAL_VALUES.UNLIMITED))
  })

  // The editor is forced read-only for ERC-721 approvals today, so this label is unreachable in the
  // app. It is pinned so that relaxing that gate cannot silently ship the ERC-20 wording.
  it('labels an ERC-721 approval as a transfer permission', () => {
    render(
      <Harness
        approval={buildApproval({
          tokenInfo: {
            symbol: 'TST',
            decimals: 0,
            address: faker.finance.ethereumAddress(),
            type: TokenType.ERC721,
          },
        })}
      />,
    )

    expect(screen.getByText('Allow to transfer TST')).toBeInTheDocument()
  })
})
