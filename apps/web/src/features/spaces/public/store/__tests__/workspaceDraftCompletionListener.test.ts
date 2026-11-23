import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { cgwApi as billingApi, type Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { cgwApi as spacesApi, type GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { GATEWAY_URL } from '@/config/gateway'
import { makeStore } from '@/store'
import { server } from '@/tests/server'
import { spaceBuilder } from '@/tests/builders/space'
import { subscriptionBuilder } from '@/tests/builders/subscription'
import { CHECKOUT_SESSION_QUERY_PARAM } from '../../../hooks/billing/returnUrl'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { EMPTY_WORKSPACE_DRAFT, type WorkspaceDraft } from '../workspaceDraftSlice'

const subscriptionsHandler = (subscriptions: Subscription[]) =>
  http.get(`${GATEWAY_URL}/v1/billing/spaces/:spaceId/subscriptions`, () => HttpResponse.json(subscriptions))

const draftOf = (createdSpaceId: string | null): WorkspaceDraft =>
  workspaceDraftBuilder()
    .with({ ownerId: fakeUserId(), name: fakeWorkspaceName(), updatedAt: Date.now(), createdSpaceId })
    .build()

const loadSubscriptions = async (draft: WorkspaceDraft, spaceId: string) => {
  const store = makeStore({ workspaceDraft: draft })
  await store.dispatch(billingApi.endpoints.billingGetSubscriptionsV1.initiate({ spaceId }))
  return store
}

const spacesHandler = (spaces: GetSpaceResponse[]) =>
  http.get(`${GATEWAY_URL}/v1/spaces`, () => HttpResponse.json(spaces))

const loadSpaces = async (draft: WorkspaceDraft) => {
  const store = makeStore({ workspaceDraft: draft })
  await store.dispatch(spacesApi.endpoints.spacesGetV1.initiate())
  return store
}

describe('workspaceDraftCompletionListener', () => {
  beforeEach(() => localStorage.clear())

  it.each(['trialing', 'active'] as const)('clears the draft once its Workspace has a %s plan', async (status) => {
    const spaceId = faker.string.uuid()
    server.use(subscriptionsHandler([subscriptionBuilder().with({ status }).build()]))

    const store = await loadSubscriptions(draftOf(spaceId), spaceId)

    expect(store.getState().workspaceDraft).toEqual(EMPTY_WORKSPACE_DRAFT)
  })

  it('keeps the draft while its Workspace has no plan, as after a cancelled checkout', async () => {
    const spaceId = faker.string.uuid()
    const draft = draftOf(spaceId)
    server.use(subscriptionsHandler([]))

    const store = await loadSubscriptions(draft, spaceId)

    expect(store.getState().workspaceDraft).toEqual(draft)
  })

  it.each(['past_due', 'incomplete', 'canceled'] as const)(
    'keeps the draft while its Workspace plan is %s',
    async (status) => {
      const spaceId = faker.string.uuid()
      const draft = draftOf(spaceId)
      server.use(subscriptionsHandler([subscriptionBuilder().with({ status }).build()]))

      const store = await loadSubscriptions(draft, spaceId)

      expect(store.getState().workspaceDraft).toEqual(draft)
    },
  )

  describe('on a checkout return, whose page clears the draft once it opened the Workspace', () => {
    beforeEach(() => {
      window.history.replaceState(
        null,
        '',
        `/welcome/survey?${CHECKOUT_SESSION_QUERY_PARAM}=cs_${faker.string.alphanumeric(24)}`,
      )
    })
    afterEach(() => window.history.replaceState(null, '', '/'))

    it('keeps the draft although its Workspace has a live plan', async () => {
      const spaceId = faker.string.uuid()
      const draft = draftOf(spaceId)
      server.use(subscriptionsHandler([subscriptionBuilder().with({ status: 'trialing' }).build()]))

      const store = await loadSubscriptions(draft, spaceId)

      expect(store.getState().workspaceDraft).toEqual(draft)
    })

    it('keeps the draft although the Workspace list reports its setup as applied', async () => {
      const spaceId = faker.string.uuid()
      const draft = draftOf(spaceId)
      server.use(spacesHandler([spaceBuilder().with({ uuid: spaceId, setupStatus: 'applied' }).build()]))

      const store = await loadSpaces(draft)

      expect(store.getState().workspaceDraft).toEqual(draft)
    })
  })

  it('clears the draft once the Workspace list reports its setup as applied', async () => {
    const spaceId = faker.string.uuid()
    server.use(spacesHandler([spaceBuilder().with({ uuid: spaceId, setupStatus: 'applied' }).build()]))

    const store = await loadSpaces(draftOf(spaceId))

    expect(store.getState().workspaceDraft).toEqual(EMPTY_WORKSPACE_DRAFT)
  })

  it('keeps the draft when another Workspace has a plan', async () => {
    const draft = draftOf(faker.string.uuid())
    server.use(subscriptionsHandler([subscriptionBuilder().build()]))

    const store = await loadSubscriptions(draft, faker.string.uuid())

    expect(store.getState().workspaceDraft).toEqual(draft)
  })
})
