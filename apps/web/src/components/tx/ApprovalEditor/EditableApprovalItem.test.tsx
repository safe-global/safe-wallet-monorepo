import { render, screen, waitFor } from '@/tests/test-utils'
import { userEvent } from '@testing-library/user-event'
import { FormProvider, useForm } from 'react-hook-form'
import { faker } from '@faker-js/faker'
import { TokenType } from '@safe-global/store/gateway/types'
import { PSEUDO_APPROVAL_VALUES } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import EditableApprovalItem from './EditableApprovalItem'
import type { ApprovalInfo } from './hooks/useApprovalInfos'

const FIELD_NAME = 'approvals.0'
const SYMBOL = 'TST'

const buildApproval = (): ApprovalInfo => {
  const tokenAddress = faker.finance.ethereumAddress()
  return {
    tokenInfo: { symbol: SYMBOL, decimals: 18, address: tokenAddress, type: TokenType.ERC20 },
    tokenAddress,
    spender: faker.finance.ethereumAddress(),
    amount: 4200000n,
    amountFormatted: '420.0',
    method: 'approve',
    transactionIndex: 0,
  }
}

const Harness = ({ onSave = jest.fn() }: { onSave?: () => void }) => {
  const formMethods = useForm({
    defaultValues: { approvals: [PSEUDO_APPROVAL_VALUES.UNLIMITED as string] },
    mode: 'onChange',
  })

  return (
    <FormProvider {...formMethods}>
      <EditableApprovalItem approval={buildApproval()} name={FIELD_NAME} onSave={onSave} />
    </FormProvider>
  )
}

describe('EditableApprovalItem', () => {
  // Regression: the token icon and the Edit/Save control used to be flex siblings of the whole
  // label-plus-input column, so `items-center` centred them on the column and they drifted above
  // the input whenever the label or the helper text changed the column's height. They now live in
  // the field's grid, on the input's own row. Anything that moves them back out of the field
  // reintroduces the misalignment.
  it('renders the token icon and the edit control inside the field, alongside the input', () => {
    const { container } = render(<Harness />)

    const field = container.querySelector('[data-slot="field"]')
    expect(field).toBeInTheDocument()
    expect(field).toContainElement(screen.getByRole('combobox'))
    expect(field).toContainElement(screen.getByTitle('Edit'))
    expect(field).toContainElement(container.querySelector(`iframe[title="${SYMBOL}"]`))
    // The alignment depends on the field laying its parts out as grid rows, not as a flex column.
    expect(field).toHaveClass('grid')
  })

  it('enters edit mode when the row is clicked', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    expect(screen.getByTitle('Edit')).toBeInTheDocument()

    await user.click(screen.getByRole('combobox'))

    await waitFor(() => expect(screen.getByTitle('Save')).toBeInTheDocument())
    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument()
  })

  it('keeps Save disabled until the amount actually changes, then reports the change', async () => {
    const user = userEvent.setup()
    const onSave = jest.fn()
    render(<Harness onSave={onSave} />)

    await user.click(screen.getByTitle('Edit'))

    const save = await screen.findByTitle('Save')
    expect(save).toBeDisabled()

    const input = screen.getByRole('combobox')
    await user.clear(input)
    await user.type(input, '100')

    await waitFor(() => expect(screen.getByTitle('Save')).toBeEnabled())

    await user.click(screen.getByTitle('Save'))

    expect(onSave).toHaveBeenCalledTimes(1)
    // Saving returns the row to read-only.
    await waitFor(() => expect(screen.getByTitle('Edit')).toBeInTheDocument())
  })
})
