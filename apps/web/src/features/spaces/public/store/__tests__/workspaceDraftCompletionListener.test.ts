import { http, HttpResponse } from 'msw'
import { faker } from '@faker-js/faker'
import { cgwApi as billingApi, type Subscription } from '@safe-global/store/gateway/AUTO_GENERATED/billing'
import { GATEWAY_URL } from '@/config/gateway'
import { makeStore } from '@/store'
import { server } from '@/tests/server'
import { subscriptionBuilder } from '@/tests/builders/subscription'
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

  it('keeps the draft when another Workspace has a plan', async () => {
    const draft = draftOf(faker.string.uuid())
    server.use(subscriptionsHandler([subscriptionBuilder().build()]))

    const store = await loadSubscriptions(draft, faker.string.uuid())

    expect(store.getState().workspaceDraft).toEqual(draft)
  })
})
