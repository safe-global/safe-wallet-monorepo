import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { renderHook, waitFor } from '@/tests/test-utils'
import { useLockedSafeBarItem } from '../useLockedSafeBarItem'

const chainId = '1'
const randomAddress = () => checksumAddress(faker.finance.ethereumAddress())

const buildOverview = (safeAddress: string, owners: string[], threshold: number): SafeOverview => ({
  address: { value: safeAddress },
  chainId,
  threshold,
  owners: owners.map((value) => ({ value })),
  fiatTotal: '1234.56',
  queued: 2,
})

const renderLockedItem = (safeAddress: string, name?: string) =>
  renderHook(() => useLockedSafeBarItem({ chainId, safeAddress }), {
    initialReduxState: name ? { addressBook: { [chainId]: { [safeAddress]: name } } } : undefined,
  })

describe('useLockedSafeBarItem', () => {
  it('builds the item of the flow Safe from its overview, so signers see which Safe they sign with', async () => {
    const safeAddress = randomAddress()
    const owners = [randomAddress(), randomAddress(), randomAddress()]
    server.use(http.get(`${GATEWAY_URL}/v2/safes`, () => HttpResponse.json([buildOverview(safeAddress, owners, 2)])))

    const { result } = renderLockedItem(safeAddress, 'Treasury')

    await waitFor(() => expect(result.current.item.threshold).toBe(2))
    expect(result.current.item).toMatchObject({
      id: `${chainId}:${safeAddress}`,
      address: safeAddress,
      name: 'Treasury',
      owners: owners.length,
      balance: '1234.56',
    })
    expect(result.current.chain.chainId).toBe(chainId)
    expect(result.current.item.chains).toEqual([result.current.chain])
  })

  it('leaves the name empty for a Safe with no name, so only the address shows', async () => {
    const safeAddress = randomAddress()
    server.use(http.get(`${GATEWAY_URL}/v2/safes`, () => HttpResponse.json([buildOverview(safeAddress, [], 1)])))

    const { result } = renderLockedItem(safeAddress)

    await waitFor(() => expect(result.current.item.threshold).toBe(1))
    expect(result.current.item.name).toBe('')
    expect(result.current.item.address).toBe(safeAddress)
  })

  it('keeps a long name whole for the view to truncate', async () => {
    const safeAddress = randomAddress()
    const longName = faker.string.alpha(120)
    server.use(http.get(`${GATEWAY_URL}/v2/safes`, () => HttpResponse.json([buildOverview(safeAddress, [], 1)])))

    const { result } = renderLockedItem(safeAddress, longName)

    await waitFor(() => expect(result.current.item.threshold).toBe(1))
    expect(result.current.item.name).toBe(longName)
  })
})
