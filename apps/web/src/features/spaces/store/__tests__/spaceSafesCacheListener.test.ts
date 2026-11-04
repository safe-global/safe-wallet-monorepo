import { faker } from '@faker-js/faker'
import { delay, http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import {
  useSpaceSafesCreateV1Mutation,
  useSpaceSafesGetV1Query,
  type GetSpaceSafeResponse,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { addSafesToSpaceSafes } from '../spaceSafesCacheListener'

const spaceId = faker.string.uuid()
const spaceSafesUrl = `${GATEWAY_URL}/v1/spaces/${spaceId}/safes`

const respondWithSpaceSafes = (spaceSafes: GetSpaceSafeResponse) => {
  let getCount = 0
  server.use(
    http.get(spaceSafesUrl, async () => {
      getCount += 1
      // The refetch after the invalidation never answers, so only the listener can change the list
      if (getCount > 1) await delay('infinite')
      return HttpResponse.json(spaceSafes)
    }),
  )
}

const renderSpaceSafes = async () => {
  const hook = renderHook(() => ({
    spaceSafes: useSpaceSafesGetV1Query({ spaceId }),
    addSafes: useSpaceSafesCreateV1Mutation()[0],
  }))
  await waitFor(() => expect(hook.result.current.spaceSafes.currentData).toBeDefined())
  return hook
}

const addSafe = async (result: Awaited<ReturnType<typeof renderSpaceSafes>>['result'], address: string) => {
  await act(async () => {
    await result.current.addSafes({ spaceId, createSpaceSafesDto: { safes: [{ chainId: '137', address }] } })
  })
}

describe('spaceSafesCacheListener', () => {
  it('should add the Safe to the cached Workspace list before the refetch answers', async () => {
    const listed = faker.finance.ethereumAddress()
    const added = faker.finance.ethereumAddress()
    respondWithSpaceSafes({ safes: { '1': [listed] } })
    server.use(http.post(spaceSafesUrl, () => new HttpResponse(null, { status: 201 })))
    const { result } = await renderSpaceSafes()

    await addSafe(result, added)

    expect(result.current.spaceSafes.currentData?.safes).toEqual({ '1': [listed], '137': [added] })
  })

  it('should keep the cached Workspace list when the add fails', async () => {
    const listed = faker.finance.ethereumAddress()
    respondWithSpaceSafes({ safes: { '1': [listed] } })
    server.use(http.post(spaceSafesUrl, () => new HttpResponse(null, { status: 403 })))
    const { result } = await renderSpaceSafes()

    await addSafe(result, faker.finance.ethereumAddress())

    expect(result.current.spaceSafes.currentData?.safes).toEqual({ '1': [listed] })
  })
})

describe('addSafesToSpaceSafes', () => {
  it('should add a Safe to the list of its chain', () => {
    const listed = faker.finance.ethereumAddress()
    const added = faker.finance.ethereumAddress()
    const spaceSafes: GetSpaceSafeResponse = { safes: { '1': [listed] } }

    addSafesToSpaceSafes(spaceSafes, [{ chainId: '1', address: added }])

    expect(spaceSafes.safes).toEqual({ '1': [listed, added] })
  })

  it('should create the list of a chain that has no Safes yet', () => {
    const added = faker.finance.ethereumAddress()
    const spaceSafes: GetSpaceSafeResponse = { safes: {} }

    addSafesToSpaceSafes(spaceSafes, [{ chainId: '137', address: added }])

    expect(spaceSafes.safes).toEqual({ '137': [added] })
  })

  it('should not add an address that the chain already lists in another case', () => {
    const listed = faker.finance.ethereumAddress()
    const spaceSafes: GetSpaceSafeResponse = { safes: { '1': [listed] } }

    addSafesToSpaceSafes(spaceSafes, [{ chainId: '1', address: listed.toUpperCase().replace('0X', '0x') }])

    expect(spaceSafes.safes).toEqual({ '1': [listed] })
  })
})
