import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fireEvent, render, screen, within } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import type { RootState } from '@/store'
import UnavailableSafesAlert, { countSafeAddresses, getUnavailableTitle, SPACE_QUEUE_MAX_SAFES } from '.'

const mockNames = new Map<string, string>()
jest.mock('@/hooks/useAllAddressBooks', () => ({
  useSafeNameResolver: () => (address: string) => mockNames.get(address) ?? '',
}))

const mockChains = [
  chainBuilder().with({ chainId: '1', chainName: 'Ethereum' }).build(),
  chainBuilder().with({ chainId: '137', chainName: 'Polygon' }).build(),
]
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains }),
}))

const address = () => checksumAddress(faker.finance.ethereumAddress())

describe('UnavailableSafesAlert', () => {
  const spaceId = faker.string.uuid()
  const named = address()
  const unnamed = address()
  const safes = [
    { chainId: '1', safeAddress: named },
    { chainId: '137', safeAddress: unnamed },
  ]

  const respondWithSpaceSafes = (spaceSafes: Record<string, string[]>) =>
    server.use(http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () => HttpResponse.json({ safes: spaceSafes })))

  beforeEach(() => {
    setBaseUrl(GATEWAY_URL)
    respondWithSpaceSafes({ '1': [named], '137': [unnamed] })
    mockNames.clear()
    mockNames.set(named, 'Treasury')
  })

  const openList = (count = 2) =>
    fireEvent.click(
      screen.getByRole('button', { name: `${count} ${count === 1 ? 'Safe account' : 'Safe accounts'} not loaded` }),
    )

  it('shows a chip that counts the unavailable Safe accounts, with the list closed', () => {
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} />)

    expect(screen.getByTestId('unavailable-safes-alert')).toHaveTextContent('2 Safe accounts not loaded')
    expect(screen.queryByText('Treasury')).not.toBeInTheDocument()
  })

  it('names each Safe account and its network once opened', async () => {
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} />)

    openList()

    const list = await screen.findByRole('list', { name: "Safe accounts that couldn't be loaded" })
    const items = within(list).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Treasury')
    expect(items[0]).toHaveTextContent('on Ethereum')
    expect(items[1]).toHaveTextContent(shortenAddress(unnamed))
    expect(items[1]).toHaveTextContent('on Polygon')
  })

  it('says the transactions are not shown when the Workspace is within the limit', async () => {
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} />)

    openList()

    expect(
      await screen.findByText(
        "Their transactions aren't shown in the table. They may not be deployed on that network yet, or the network may be unreachable.",
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/covers up to/)).not.toBeInTheDocument()
  })

  it('adds the limit and still offers a plain Reload when the Workspace holds more Safe accounts than the queue reads', async () => {
    respondWithSpaceSafes({ '1': Array.from({ length: SPACE_QUEUE_MAX_SAFES + 1 }, address) })
    const onRetry = jest.fn()

    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={onRetry} />)

    openList()

    expect(
      await screen.findByText(/covers up to 100 Safe accounts, so some of these may not be included/),
    ).toBeInTheDocument()
    expect(screen.getByText(/Their transactions aren't shown in the table\./)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Reload all/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reload' }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('reloads the whole queue', async () => {
    const onRetry = jest.fn()
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={onRetry} />)

    openList()
    fireEvent.click(await screen.findByRole('button', { name: 'Reload all 2' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('says Reload for a single Safe account', async () => {
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes.slice(0, 1)} onRetry={jest.fn()} />)

    openList(1)

    expect(await screen.findByRole('button', { name: 'Reload' })).toBeInTheDocument()
  })

  const withUndeployed = (chainId: string, safeAddress: string) => ({
    initialReduxState: {
      undeployedSafes: {
        [chainId]: {
          [safeAddress]: {
            status: { status: 'AWAITING_EXECUTION' },
            props: { safeAccountConfig: { owners: [address()], threshold: 1 } },
          },
        },
      },
    } as unknown as Partial<RootState>,
  })

  it('leaves out a counterfactual Safe, which has no queue to load', () => {
    render(
      <UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} />,
      withUndeployed('137', unnamed),
    )

    expect(screen.getByTestId('unavailable-safes-alert')).toHaveTextContent('1 Safe account not loaded')
  })

  it('matches a counterfactual Safe in any address case', () => {
    render(
      <UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} />,
      withUndeployed('137', unnamed.toLowerCase()),
    )

    expect(screen.getByTestId('unavailable-safes-alert')).toHaveTextContent('1 Safe account not loaded')
  })

  it('still counts the same address on a network where it is deployed', () => {
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} />, withUndeployed('1', unnamed))

    expect(screen.getByTestId('unavailable-safes-alert')).toHaveTextContent('2 Safe accounts not loaded')
  })

  it('shows nothing when every unavailable Safe is counterfactual', () => {
    render(
      <UnavailableSafesAlert spaceId={spaceId} safes={safes.slice(1)} onRetry={jest.fn()} />,
      withUndeployed('137', unnamed),
    )

    expect(screen.queryByTestId('unavailable-safes-alert')).not.toBeInTheDocument()
  })

  it('disables reloading while a reload is running', async () => {
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} isRetrying />)

    openList()

    expect(await screen.findByRole('button', { name: 'Reload all 2' })).toBeDisabled()
  })
})

describe('getUnavailableTitle', () => {
  it('uses the singular for one Safe', () => {
    expect(getUnavailableTitle(1)).toBe('1 Safe account not loaded')
  })

  it('uses the plural for several Safes', () => {
    expect(getUnavailableTitle(3)).toBe('3 Safe accounts not loaded')
  })
})

describe('countSafeAddresses', () => {
  it('counts a Safe on several networks once, in any case', () => {
    const safe = address()

    expect(countSafeAddresses({ '1': [safe], '137': [safe.toLowerCase()], '10': [address()] })).toBe(2)
  })

  it('counts nothing when the Workspace Safes are not loaded', () => {
    expect(countSafeAddresses(undefined)).toBe(0)
  })
})
