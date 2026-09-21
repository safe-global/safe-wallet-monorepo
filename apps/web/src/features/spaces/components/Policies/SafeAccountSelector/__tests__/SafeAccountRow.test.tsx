import { render, screen } from '@/tests/test-utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { SafeAccountSummary } from '../components/SafeAccountRow'
import { buildSafeAccountId } from '../utils'
import type { SafeAccountOption } from '../types'

jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

const ADDRESS = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'

const account = (extra: Partial<SafeAccountOption> = {}): SafeAccountOption => ({
  id: buildSafeAccountId('1', ADDRESS),
  chainId: '1',
  address: ADDRESS,
  eligibility: 'signer',
  chain: { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
  ...extra,
})

describe('SafeAccountSummary', () => {
  it('shows the name, the shortened address, the threshold and the chain', () => {
    render(<SafeAccountSummary account={account({ name: 'Treasury', threshold: 3, owners: 5 })} />)

    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.getByTestId('safe-account-address')).toHaveTextContent(shortenAddress(ADDRESS))
    expect(screen.getByTestId('account-threshold')).toHaveTextContent('3/5')
    expect(screen.getByTestId('chain-logo-img')).toHaveAttribute('alt', 'chain-1')
  })

  it('falls back to the shortened address as the display name when the Safe is unnamed', () => {
    render(<SafeAccountSummary account={account()} />)

    // Both lines then read the same shortened address — the name line is the one without the testid.
    expect(screen.getAllByText(shortenAddress(ADDRESS))).toHaveLength(2)
  })

  it('omits the owner count from the badge when the overview has not resolved the setup', () => {
    render(<SafeAccountSummary account={account({ name: 'Treasury' })} />)

    expect(screen.getByTestId('account-threshold')).not.toHaveTextContent('/')
  })

  it('shows the fiat balance in the shared trailing column', () => {
    render(<SafeAccountSummary account={account({ name: 'Treasury', fiatTotal: '1234.56' })} />)

    expect(screen.getByTestId('row-end-column')).toHaveTextContent('$')
  })

  it('leaves the balance column empty until the overview resolves a balance', () => {
    render(<SafeAccountSummary account={account({ name: 'Treasury' })} />)

    expect(screen.getByTestId('row-end-column')).toBeEmptyDOMElement()
  })
})
