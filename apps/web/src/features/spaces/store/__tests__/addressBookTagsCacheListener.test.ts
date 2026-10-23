import { faker } from '@faker-js/faker'
import { delay, http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { spaceAddressBookTagBuilder } from '@/tests/builders/space'
import {
  useAddressBooksCreateTagV1Mutation,
  useAddressBooksGetAddressBookItemsV1Query,
  type SpaceAddressBookDto,
} from '@safe-global/store/gateway/AUTO_GENERATED/spaces'

const spaceId = faker.string.uuid()
const addressBookUrl = `${GATEWAY_URL}/v1/spaces/${spaceId}/address-book`
const tagsUrl = `${addressBookUrl}/tags`

const existing = spaceAddressBookTagBuilder().with({ id: 1 }).build()
const book: SpaceAddressBookDto = { spaceUuid: spaceId, data: [], tags: [existing] }

const respondWithBook = () => {
  let getCount = 0
  server.use(
    http.get(addressBookUrl, async () => {
      getCount += 1
      // The refetch after the invalidation never answers, so only the listener can change the book
      if (getCount > 1) await delay('infinite')
      return HttpResponse.json(book)
    }),
  )
}

const renderBook = async () => {
  const hook = renderHook(() => ({
    book: useAddressBooksGetAddressBookItemsV1Query({ spaceId }),
    createTag: useAddressBooksCreateTagV1Mutation()[0],
  }))
  await waitFor(() => expect(hook.result.current.book.currentData).toBeDefined())
  return hook
}

const createTag = async (result: Awaited<ReturnType<typeof renderBook>>['result'], name: string) => {
  await act(async () => {
    await result.current.createTag({ spaceId, createTagDto: { name } })
  })
}

describe('addressBookTagsCacheListener', () => {
  it('should add the created tag to the cached address book before the refetch answers', async () => {
    const created = spaceAddressBookTagBuilder().with({ id: 2, contactCount: 0 }).build()
    respondWithBook()
    server.use(http.post(tagsUrl, () => HttpResponse.json({ ...book, tags: [existing, created] }, { status: 201 })))
    const { result } = await renderBook()

    await createTag(result, created.name)

    expect(result.current.book.currentData?.tags).toEqual([existing, created])
  })

  it('should keep the cached address book when the create fails', async () => {
    respondWithBook()
    server.use(http.post(tagsUrl, () => new HttpResponse(null, { status: 409 })))
    const { result } = await renderBook()

    await createTag(result, faker.word.noun())

    expect(result.current.book.currentData?.tags).toEqual([existing])
  })
})
