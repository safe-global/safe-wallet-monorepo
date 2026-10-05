import type { ReactNode } from 'react'
import { render } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { UpsertRecoveryFlowReview } from './UpsertRecoveryFlowReview'
import { UpsertRecoveryFlowFields, type UpsertRecoveryFlowProps } from '.'
import { DAY_IN_SECONDS } from './useRecoveryPeriods'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { chainId: '1' }, safeAddress: '0x0000000000000000000000000000000000000001' }),
}))

jest.mock('@/components/common/EthHashInfo', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/hooks/wallets/web3ReadOnly', () => ({
  __esModule: true,
  useWeb3ReadOnly: () => undefined,
}))

jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

const renderReview = (data: Partial<UpsertRecoveryFlowProps>) => {
  const context: TxFlowContextType<UpsertRecoveryFlowProps> = {
    ...initialContext,
    data: {
      [UpsertRecoveryFlowFields.recoverer]: faker.finance.ethereumAddress(),
      [UpsertRecoveryFlowFields.delay]: `${DAY_IN_SECONDS * 28}`,
      [UpsertRecoveryFlowFields.customDelay]: '',
      [UpsertRecoveryFlowFields.selectedDelay]: `${DAY_IN_SECONDS * 28}`,
      [UpsertRecoveryFlowFields.expiry]: '0',
      ...data,
    },
  }

  return render(
    <TxFlowContext.Provider value={context as TxFlowContextType}>
      <UpsertRecoveryFlowReview onSubmit={jest.fn()} />
    </TxFlowContext.Provider>,
  )
}

describe('UpsertRecoveryFlowReview', () => {
  it('renders a non-standard delay and expiry read back from an existing Delay module', () => {
    const delay = `${DAY_IN_SECONDS * 3 + 60 * 60 * 5}`
    const expiry = `${DAY_IN_SECONDS * 10}`

    const { getByText } = renderReview({
      delay,
      selectedDelay: delay,
      expiry,
      moduleAddress: faker.finance.ethereumAddress(),
    })

    expect(getByText('3 days, 5 hours')).toBeInTheDocument()
    expect(getByText('Proposal expiry')).toBeInTheDocument()
    expect(getByText('10 days')).toBeInTheDocument()
  })

  it('renders the label of a dropdown delay and expiry', () => {
    const { getByText } = renderReview({ expiry: `${DAY_IN_SECONDS * 7}` })

    expect(getByText('28 days')).toBeInTheDocument()
    expect(getByText('7 days')).toBeInTheDocument()
  })

  it('renders a custom delay entered in days', () => {
    const { getByText } = renderReview({ delay: `${DAY_IN_SECONDS}`, selectedDelay: '0', customDelay: '1' })

    expect(getByText('1 day')).toBeInTheDocument()
  })

  it('hides the expiry row when the expiry is never', () => {
    const { queryByText } = renderReview({ expiry: '0' })

    expect(queryByText('Proposal expiry')).not.toBeInTheDocument()
  })
})
