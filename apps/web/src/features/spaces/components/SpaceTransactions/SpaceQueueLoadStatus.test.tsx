import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import type { SpaceQueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import SpaceQueueLoadStatus from './SpaceQueueLoadStatus'

const spaceId = faker.string.uuid()
const queueUrl = `${GATEWAY_URL}/v1/spaces/${spaceId}/transactions/queued`

const page = (unavailableSafes: SpaceQueuedItemPage['unavailableSafes']): SpaceQueuedItemPage => ({
  count: 0,
  next: null,
  previous: null,
  results: {},
  unavailableSafes,
  counts: {
    total: 0,
    execute: 0,
    sign: 0,
    blocked: 0,
    waiting: 0,
    conflicting: 0,
    stale: 0,
    safes: [],
    chains: [],
    signers: [],
  },
})

const unavailableSafe = () => ({ chainId: '1', safeAddress: checksumAddress(faker.finance.ethereumAddress()) })

describe('SpaceQueueLoadStatus', () => {
  beforeEach(() => {
    setBaseUrl(GATEWAY_URL)
    server.use(http.get(`${GATEWAY_URL}/v1/spaces/${spaceId}/safes`, () => HttpResponse.json({ safes: {} })))
  })

  it('counts the Safes whose queue did not load, from the unfiltered queue', async () => {
    const requests: URL[] = []
    server.use(
      http.get(queueUrl, ({ request }) => {
        requests.push(new URL(request.url))
        return HttpResponse.json(page([unavailableSafe(), unavailableSafe()]))
      }),
    )

    render(<SpaceQueueLoadStatus spaceId={spaceId} />)

    expect(await screen.findByTestId('unavailable-safes-alert')).toHaveTextContent('2 Safe accounts not loaded')
    expect(requests.every((url) => url.search === '')).toBe(true)
  })

  it('shows nothing when every Safe loaded', async () => {
    let answered = false
    server.use(
      http.get(queueUrl, () => {
        answered = true
        return HttpResponse.json(page([]))
      }),
    )

    render(<SpaceQueueLoadStatus spaceId={spaceId} />)

    await waitFor(() => expect(answered).toBe(true))
    expect(screen.queryByTestId('unavailable-safes-alert')).not.toBeInTheDocument()
  })

  it('reloads the queue', async () => {
    let calls = 0
    server.use(
      http.get(queueUrl, () => {
        calls += 1
        return HttpResponse.json(page([unavailableSafe()]))
      }),
    )
    render(<SpaceQueueLoadStatus spaceId={spaceId} />)

    fireEvent.click(await screen.findByTestId('unavailable-safes-alert'))
    fireEvent.click(await screen.findByRole('button', { name: 'Reload' }))

    await waitFor(() => expect(calls).toBe(2))
  })
})
