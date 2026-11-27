import { faker } from '@faker-js/faker'
import type { TransactionData } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { Operation } from '@safe-global/store/gateway/types'
import { render } from '@/tests/test-utils'
import { SpendingLimitBatchSummary } from '../SpendingLimitBatchSummary'
import type { SpendingLimitBatch } from '../spendingLimitBatch'

const txData: TransactionData = { to: { value: faker.finance.ethereumAddress() }, operation: Operation.DELEGATE }
const SPENDER = faker.finance.ethereumAddress()

const renderSummary = (batch: Partial<SpendingLimitBatch>) =>
  render(
    <SpendingLimitBatchSummary
      txData={txData}
      batch={{ enablesModule: false, changes: [], removedSpenders: [], ...batch }}
    />,
  )

describe('SpendingLimitBatchSummary', () => {
  it('says when the batch enables the spending limit module', () => {
    const { getByText } = renderSummary({ enablesModule: true })

    expect(getByText('Enable the spending limit module')).toBeInTheDocument()
  })

  it('omits the module line when the module is already on', () => {
    const { queryByText } = renderSummary({ removedSpenders: [SPENDER] })

    expect(queryByText('Enable the spending limit module')).not.toBeInTheDocument()
  })

  it('lists each removed spender', () => {
    const other = faker.finance.ethereumAddress()
    const { getAllByText } = renderSummary({ removedSpenders: [SPENDER, other] })

    expect(getAllByText('Remove spender:')).toHaveLength(2)
  })

  it('renders one block per allowance change', () => {
    const token = faker.finance.ethereumAddress()
    const { getByText } = renderSummary({
      changes: [
        {
          method: 'setAllowance',
          dataDecoded: { method: 'setAllowance', parameters: [] },
          resetsSpent: false,
        },
        {
          method: 'deleteAllowance',
          dataDecoded: {
            method: 'deleteAllowance',
            parameters: [
              { name: 'delegate', type: 'address', value: SPENDER },
              { name: 'token', type: 'address', value: token },
            ],
          },
          resetsSpent: false,
        },
      ],
    })

    expect(getByText('Modify spending limit:')).toBeInTheDocument()
    expect(getByText('Delete spending limit:')).toBeInTheDocument()
  })
})
