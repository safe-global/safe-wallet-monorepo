import { faker } from '@faker-js/faker'
import { fireEvent, render, screen } from '@/tests/test-utils'
import TokenApprovalsList, { type TokenApprovalItem } from './index'

const buildApproval = (overrides: Partial<TokenApprovalItem> = {}): TokenApprovalItem => ({
  key: faker.string.uuid(),
  tokenAddress: faker.finance.ethereumAddress(),
  tokenSymbol: faker.finance.currencyCode(),
  spenderAddress: faker.finance.ethereumAddress(),
  spenderLabel: faker.company.name(),
  amountLabel: '10 TKN',
  isUnlimited: false,
  ...overrides,
})

describe('TokenApprovalsList', () => {
  it('lists each approval with its token, spender and allowance', () => {
    const approval = buildApproval({ tokenSymbol: 'DAI', spenderLabel: 'Uniswap', amountLabel: '100 DAI' })

    render(<TokenApprovalsList approvals={[approval]} checkedAtLabel="just now" onRescan={jest.fn()} />)

    expect(screen.getByText('DAI')).toBeInTheDocument()
    expect(screen.getByText('Spender: Uniswap')).toBeInTheDocument()
    expect(screen.getByText('100 DAI')).toBeInTheDocument()
  })

  it('links the spender to the block explorer when a link is given', () => {
    const href = faker.internet.url()

    render(
      <TokenApprovalsList approvals={[buildApproval({ spenderHref: href })]} checkedAtLabel="" onRescan={jest.fn()} />,
    )

    expect(screen.getByTestId('explorer-btn')).toHaveAttribute('href', href)
  })

  it('rescans when Rescan is clicked', () => {
    const onRescan = jest.fn()
    render(<TokenApprovalsList approvals={[]} checkedAtLabel="just now" onRescan={onRescan} />)

    fireEvent.click(screen.getByRole('button', { name: 'Rescan' }))

    expect(onRescan).toHaveBeenCalledTimes(1)
  })
})
