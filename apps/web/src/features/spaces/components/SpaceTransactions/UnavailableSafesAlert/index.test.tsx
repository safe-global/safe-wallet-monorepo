import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fireEvent, render, screen, within } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
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

  it('counts the unavailable Safe accounts in the title', () => {
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} />)

    expect(screen.getByText("2 Safe accounts couldn't be loaded")).toBeInTheDocument()
    expect(screen.queryByText('Treasury')).not.toBeInTheDocument()
  })

  it('names each Safe account and its network once expanded', () => {
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Show Safe accounts' }))

    const list = screen.getByRole('list', { name: "Safe accounts that couldn't be loaded" })
    const items = within(list).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('Treasury')
    expect(items[0]).toHaveTextContent('on Ethereum')
    expect(items[1]).toHaveTextContent(shortenAddress(unnamed))
    expect(items[1]).toHaveTextContent('on Polygon')
  })

  it('explains the limit when the Workspace holds more Safe accounts than the queue reads', async () => {
    respondWithSpaceSafes({ '1': Array.from({ length: SPACE_QUEUE_MAX_SAFES + 1 }, address) })

    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} />)

    expect(await screen.findByText(/covers up to 100 Safe accounts/)).toBeInTheDocument()
    expect(screen.getByText(/may not be deployed on that network yet/)).toBeInTheDocument()
  })

  it('suggests why when the Workspace is within the limit', async () => {
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} />)

    expect(await screen.findByText(/may not be deployed on that network yet/)).toBeInTheDocument()
    expect(screen.queryByText(/covers up to/)).not.toBeInTheDocument()
  })

  it('tries again', () => {
    const onRetry = jest.fn()
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('disables trying again while a retry is running', () => {
    render(<UnavailableSafesAlert spaceId={spaceId} safes={safes} onRetry={jest.fn()} isRetrying />)

    expect(screen.getByRole('button', { name: 'Try again' })).toBeDisabled()
  })
})

describe('getUnavailableTitle', () => {
  it('uses the singular for one Safe account', () => {
    expect(getUnavailableTitle(1)).toBe("1 Safe account couldn't be loaded")
  })

  it('uses the plural for several Safe accounts', () => {
    expect(getUnavailableTitle(3)).toBe("3 Safe accounts couldn't be loaded")
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
