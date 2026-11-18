import { http, HttpResponse } from 'msw'
import { createMockStory } from '@/stories/mocks/createMockStory'
import { mockOwnedSafes, mockUser } from '@/stories/mocks/handlers'
import { mockNow } from '@/stories/mocks/now'
import { EMPTY_WORKSPACE_DRAFT, type WorkspaceDraft } from '../../../public/store/workspaceDraftSlice'
import { TRIAL_LINKS } from '../../Plans/plans.storyData'

export const [STARTER_TRIAL, BUSINESS_TRIAL] = TRIAL_LINKS

export const OWNED_SAFES = mockOwnedSafes['1'].map((address) => ({ chainId: '1', address }))

export const NAMED_DRAFT: Partial<WorkspaceDraft> = { name: 'Treasury Ops', paymentLinkId: STARTER_TRIAL.id }

/** A wizard step as the signed-in owner of the mock Safes sees it, with Safe Pro on and the given draft saved. */
export const wizardStepStory = (pathname: string, draft: Partial<WorkspaceDraft> = {}) => {
  const setup = createMockStory({
    scenario: 'efSafe',
    wallet: 'owner',
    authenticated: true,
    features: { safePro: true },
    pathname,
    shadcn: true,
    store: {
      workspaceDraft: { ...EMPTY_WORKSPACE_DRAFT, ownerId: mockUser.id, updatedAt: mockNow(), ...draft },
    },
    handlers: [http.get(/\/v1\/billing\/trial-plans$/, () => HttpResponse.json(TRIAL_LINKS))],
  })
  return { parameters: { layout: 'fullscreen', ...setup.parameters }, decorators: [setup.decorator] }
}
