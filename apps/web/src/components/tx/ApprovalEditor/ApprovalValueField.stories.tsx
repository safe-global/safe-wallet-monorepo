import type { Meta, StoryObj } from '@storybook/react'
import { FormProvider, useForm } from 'react-hook-form'
import { ApprovalValueField } from './ApprovalValueField'
import type { ApprovalInfo } from './hooks/useApprovalInfos'
import { TokenType } from '@safe-global/store/gateway/types'
import { mockAddress } from '@/stories/mocks/address'

const FIELD_NAME = 'approvals.0'

const tokenAddress = mockAddress(1)

const approval: ApprovalInfo = {
  tokenInfo: { symbol: 'TST', decimals: 18, address: tokenAddress, type: TokenType.ERC20 },
  tokenAddress,
  spender: mockAddress(2),
  amount: 4200000n,
  amountFormatted: '420.0',
  method: 'approve',
  transactionIndex: 0,
}

type HarnessProps = {
  /** Starting amount in the field. */
  amount?: string
  readOnly?: boolean
}

/**
 * ApprovalValueField reads its value from the surrounding react-hook-form context, so the story
 * supplies one. Opening the preset list and dismissing it is the interaction that regressed: the
 * edited amount used to be discarded, and the preset list used to render empty.
 */
const ApprovalHarness = ({ amount = '420.0', readOnly = false }: HarnessProps) => {
  const methods = useForm({ defaultValues: { approvals: [amount] }, mode: 'all' })

  return (
    <FormProvider {...methods}>
      {/* Tall enough that the preset list opens downward in a stable position for snapshots. */}
      <div className="flex min-h-[18rem] w-80 items-start p-4">
        <ApprovalValueField name={FIELD_NAME} tx={approval} readOnly={readOnly} />
      </div>
    </FormProvider>
  )
}

const meta: Meta<typeof ApprovalHarness> = {
  title: 'Components/TxFlow/ApprovalValueField',
  component: ApprovalHarness,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

/** Editable allowance. The "Unlimited amount" preset stays listed even once an amount is typed. */
export const Editable: Story = {
  args: { amount: '420.0' },
}

/** Pre-set to the unlimited preset rather than a numeric amount. */
export const UnlimitedAmount: Story = {
  args: { amount: 'Unlimited amount' },
}

/** Read-only rendering used once the approval transaction carries signatures. */
export const ReadOnly: Story = {
  args: { amount: '420.0', readOnly: true },
}
