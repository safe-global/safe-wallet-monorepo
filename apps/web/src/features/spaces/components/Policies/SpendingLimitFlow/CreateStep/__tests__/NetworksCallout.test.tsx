import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { render, renderWithUserEvent, screen } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { NETWORKS_CALLOUT_TITLE } from '../../constants'
import * as safeAccountsHooks from '../../hooks/useSpendingLimitSafeAccounts'
import NetworksCallout from '../NetworksCallout'

const mockChains = (names: string[]) =>
  jest.spyOn(safeAccountsHooks, 'useSpendingLimitChains').mockReturnValue(
    names.map(
      (chainName, index) =>
        chainBuilder()
          .with({ chainName, chainId: `${index + 1}` })
          .build() as Chain,
    ),
  )

describe('NetworksCallout', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('counts the chains that support spending limits', () => {
    mockChains(['Ethereum', 'Polygon', 'Gnosis'])

    render(<NetworksCallout />)

    expect(screen.getByTestId('networks-callout')).toHaveTextContent('Spending limits are available on 3 networks.')
    expect(screen.getByText(NETWORKS_CALLOUT_TITLE)).toBeInTheDocument()
  })

  it('keeps the wording singular for a lone network', () => {
    mockChains(['Ethereum'])

    render(<NetworksCallout />)

    expect(screen.getByTestId('networks-callout')).toHaveTextContent('Spending limits are available on 1 network.')
  })

  it('names every supported chain on hover', async () => {
    mockChains(['Ethereum', 'Polygon', 'Gnosis'])
    const { user } = renderWithUserEvent(<NetworksCallout />)

    await user.hover(screen.getByTestId('networks-callout-count'))

    expect(await screen.findByText('Ethereum, Polygon, Gnosis')).toBeInTheDocument()
  })

  it('renders nothing while no chain supports spending limits', () => {
    mockChains([])

    render(<NetworksCallout />)

    expect(screen.queryByTestId('networks-callout')).not.toBeInTheDocument()
  })

  it('cannot be dismissed', () => {
    mockChains(['Ethereum', 'Polygon'])

    render(<NetworksCallout />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
