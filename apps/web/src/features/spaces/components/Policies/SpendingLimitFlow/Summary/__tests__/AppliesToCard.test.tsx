import { render, screen } from '@/tests/test-utils'
import AppliesToCard from '../AppliesToCard'
import { APPLIES_TO_LABEL } from '../constants'
import { safeAccountOptionBuilder } from '../SpendingLimitSummary.fixtures'

jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

describe('AppliesToCard', () => {
  it('labels the row and shows the Safe with its threshold, chain and fiat balance', () => {
    const safe = safeAccountOptionBuilder()
      .with({ name: 'Treasury', threshold: 3, owners: 5, fiatTotal: '123720' })
      .build()

    render(<AppliesToCard safe={safe} />)

    const row = screen.getByTestId('spending-limit-summary-applies-to')
    expect(row).toHaveTextContent(APPLIES_TO_LABEL)
    expect(row).toHaveTextContent('Treasury')
    expect(screen.getByTestId('account-threshold')).toHaveTextContent('3/5')
    expect(screen.getByTestId('chain-logo-img')).toHaveAttribute('alt', 'chain-1')
    expect(screen.getByTestId('row-end-column')).toHaveTextContent('$')
  })
})
