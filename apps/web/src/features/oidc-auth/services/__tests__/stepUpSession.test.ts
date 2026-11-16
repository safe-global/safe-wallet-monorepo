import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { waitFor } from '@testing-library/react'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { GATEWAY_URL } from '@/config/gateway'
import { makeStore } from '@/store'
import { server } from '@/tests/server'
import { ELEVATION_REQUIRED_ERROR } from '../../utils/elevation'
import { registerStepUpRecovery, requestStepUp, settleStepUp } from '../stepUpSession'

const spaceId = faker.string.uuid()

/** Answers the first `elevatedAfter` requests with `elevation_required`, then succeeds. */
const respondToUpdate = (elevatedAfter: number) => {
  const bodies: unknown[] = []
  server.use(
    http.patch(`${GATEWAY_URL}/v1/spaces/${spaceId}`, async ({ request }) => {
      bodies.push(await request.json())
      if (bodies.length <= elevatedAfter) {
        return HttpResponse.json({ message: ELEVATION_REQUIRED_ERROR, statusCode: 403 }, { status: 403 })
      }
      return HttpResponse.json({ id: 1, uuid: spaceId, name: 'Renamed' })
    }),
  )
  return bodies
}

const setup = () => {
  const store = makeStore()
  const unregister = registerStepUpRecovery(store.dispatch)
  const update = (name: string) =>
    store.dispatch(cgwApi.endpoints.spacesUpdateV1.initiate({ id: spaceId, updateSpaceDto: { name } }))
  const waitForStatus = (status: string) =>
    new Promise<void>((resolve) => {
      const check = () => store.getState().stepUp.status === status && resolve()
      check()
      const unsubscribe = store.subscribe(() => {
        check()
        if (store.getState().stepUp.status === status) unsubscribe()
      })
    })
  return { store, unregister, update, waitForStatus }
}

describe('stepUpSession', () => {
  let cleanup: (() => void) | undefined

  afterEach(() => {
    cleanup?.()
  })

  it('opens the dialog on elevation_required and sends the same request again once elevated', async () => {
    const bodies = respondToUpdate(1)
    const { store, unregister, update, waitForStatus } = setup()
    cleanup = unregister

    const request = update('Renamed')
    await waitForStatus('prompt')
    settleStepUp(store.dispatch, true)
    const result = await request

    expect(result.data).toEqual(expect.objectContaining({ name: 'Renamed' }))
    expect(bodies).toEqual([{ name: 'Renamed' }, { name: 'Renamed' }])
    expect(store.getState().stepUp.status).toBe('idle')
  })

  it('returns the elevation_required error without a retry when the user cancels', async () => {
    const bodies = respondToUpdate(1)
    const { store, unregister, update, waitForStatus } = setup()
    cleanup = unregister

    const request = update('Renamed')
    await waitForStatus('prompt')
    settleStepUp(store.dispatch, false)
    const result = await request

    expect(result.error).toEqual(expect.objectContaining({ status: 403 }))
    expect(bodies).toHaveLength(1)
  })

  it('lets requests rejected at the same time share one verification', async () => {
    const bodies = respondToUpdate(2)
    const { store, unregister, update, waitForStatus } = setup()
    cleanup = unregister

    const first = update('First')
    const second = update('Second')
    await waitForStatus('prompt')
    // Both rejections must reach the hook before the dialog settles.
    await waitFor(() => expect(bodies).toHaveLength(2))
    await new Promise((resolve) => setTimeout(resolve, 50))
    const shared = requestStepUp(store.dispatch)
    settleStepUp(store.dispatch, true)
    const results = await Promise.all([first, second, shared])

    expect(results[0].data).toBeDefined()
    expect(results[1].data).toBeDefined()
    expect(results[2]).toBe(true)
    expect(bodies).toHaveLength(4)
  })

  it('does not start a verification for any other 403', async () => {
    server.use(
      http.patch(`${GATEWAY_URL}/v1/spaces/${spaceId}`, () =>
        HttpResponse.json({ message: 'Forbidden resource', statusCode: 403 }, { status: 403 }),
      ),
    )
    const { store, unregister, update } = setup()
    cleanup = unregister

    const result = await update('Renamed')

    expect(result.error).toEqual(expect.objectContaining({ status: 403 }))
    expect(store.getState().stepUp.status).toBe('idle')
  })
})
