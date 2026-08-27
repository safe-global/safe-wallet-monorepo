import type { Meta, StoryObj } from '@storybook/react'
import { FormProvider, useForm } from 'react-hook-form'
import { faker } from '@faker-js/faker'
import { TokenType } from '@safe-global/store/gateway/types'
import { PSEUDO_APPROVAL_VALUES } from '@safe-global/utils/components/tx/ApprovalEditor/utils/approvals'
import EditableApprovalItem from './EditableApprovalItem'
import type { ApprovalInfo } from './hooks/useApprovalInfos'

// Seed faker for deterministic visual regression tests
faker.seed(3448)

const FIELD_NAME = 'approvals.0'

const buildApproval = (symbol: string): ApprovalInfo => {
  const tokenAddress = faker.finance.ethereumAddress()
  return {
    tokenInfo: { symbol, decimals: 18, address: tokenAddress, type: TokenType.ERC20 },
    tokenAddress,
    spender: faker.finance.ethereumAddress(),
    amount: 4200000n,
    amountFormatted: '420.0',
    method: 'approve',
    transactionIndex: 0,
  }
}

type HarnessProps = {
  amount?: string
  symbol?: string
  /** Container width, to reproduce the label wrapping at narrow viewports. */
  width?: string
}

/**
 * The row reads its value from the surrounding react-hook-form context, so the story supplies one.
 * What these stories pin is the alignment: the token icon on the left and the Edit/Save control on
 * the right must stay level with the amount input in every state, including the states where the
 * label above the input or the helper text below it changes the column's height.
 */
const ApprovalRowHarness = ({
  amount = PSEUDO_APPROVAL_VALUES.UNLIMITED,
  symbol = 'TST',
  width = '480px',
}: HarnessProps) => {
  const methods = useForm({ defaultValues: { approvals: [amount] }, mode: 'all' })

  return (
    <FormProvider {...methods}>
      <div className="p-4" style={{ width }}>
        <EditableApprovalItem approval={buildApproval(symbol)} name={FIELD_NAME} onSave={() => {}} />
      </div>
    </FormProvider>
  )
}

const meta: Meta<typeof ApprovalRowHarness> = {
  title: 'Components/TxFlow/EditableApprovalItem',
  component: ApprovalRowHarness,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const enterEditMode = async (canvasElement: HTMLElement) => {
  const { userEvent, within } = await import('storybook/test')
  await userEvent.click(within(canvasElement).getByTitle('Edit'))
}

/** Default state: the amount is shown read-only until the row is clicked. */
export const ReadOnly: Story = {}

/** Edit mode with the amount untouched, so Save is still disabled and no helper text shows. */
export const EditMode: Story = {
  play: async ({ canvasElement }) => {
    await enterEditMode(canvasElement)
  },
}

/**
 * Edit mode after typing, which renders "Save to apply changes" below the input. This was the only
 * state that looked correct before the fix, because the helper text happened to balance the label
 * above the input — so it is the state a naive offset fix breaks.
 */
export const EditModeDirty: Story = {
  play: async ({ canvasElement }) => {
    const { userEvent, within } = await import('storybook/test')
    await enterEditMode(canvasElement)
    const input = within(canvasElement).getByRole('combobox')
    await userEvent.clear(input)
    await userEvent.type(input, '100')
  },
}

/** A long symbol in a narrow container wraps the label onto a second line. */
export const WrappedLabel: Story = {
  args: { symbol: 'LONGTOKENSYMBOL', width: '260px' },
}

/** The same wrapping case in edit mode, where the Save button is wider than the pencil. */
export const WrappedLabelEditMode: Story = {
  args: { symbol: 'LONGTOKENSYMBOL', width: '260px' },
  play: async ({ canvasElement }) => {
    await enterEditMode(canvasElement)
  },
}
