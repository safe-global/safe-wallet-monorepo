import { faker } from '@faker-js/faker'
import type { CreateSpaceSetupDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { AppRoutes } from '@/config/routes'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { createSetupHandler, userHandler, workspacesHandler } from '@/tests/msw/workspaceWizard'
import { act, fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import { navigateTo } from '@/utils/navigation'
import { MemberRole } from '../../../memberRole'
import type { WizardStepId } from '../steps'
import { useStepAdvance } from '../hooks/useStepAdvance'
import { useWorkspaceDraft } from '../hooks/useWorkspaceDraft'

jest.mock('@/utils/navigation')

let mockIsSafePro = false
let mockIsSurveyEnabled = false
jest.mock('@/hooks/useIsSafeProEnabled', () => ({
  useIsSafeProEnabled: () => mockIsSafePro,
  useSafeProFlag: () => mockIsSafePro,
}))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => mockIsSurveyEnabled }))

const renderStep = async (step: WizardStepId) => {
  const ownerId = fakeUserId()
  server.use(userHandler(ownerId), workspacesHandler())
  const draft = workspaceDraftBuilder().with({ ownerId, name: fakeWorkspaceName() }).build()
  const push = jest.fn(() => Promise.resolve(true))
  const view = renderHook(() => ({ step: useStepAdvance(step), workspace: useWorkspaceDraft() }), {
    routerProps: { push },
    initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft },
  })
  await waitFor(() => expect(view.result.current.workspace.isReady).toBe(true))
  return { ...view, push }
}

describe('useStepAdvance', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.mocked(navigateTo).mockClear()
  })

  it('saves the changes of a middle step and goes to the next step', async () => {
    mockIsSafePro = false
    mockIsSurveyEnabled = false
    const { chainId, address } = safeItemBuilder().build()
    const { result, push } = await renderStep('safes')

    act(() => result.current.step.advance({ safes: [{ chainId, address }] }))

    expect(result.current.workspace.draft.safes).toEqual([{ chainId, address }])
    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.inviteMembers, query: {} })
  })

  it('creates the Workspace with the changes of the last step', async () => {
    mockIsSafePro = true
    mockIsSurveyEnabled = true
    const bodies: CreateSpaceSetupDto[] = []
    const checkoutUrl = faker.internet.url()
    server.use(createSetupHandler(bodies, { spaceId: faker.string.uuid(), checkoutUrl }))
    const { result } = await renderStep('survey')

    act(() => result.current.step.advance({ surveySelections: { page1: ['earn_yield'] } }))

    await waitFor(() => expect(navigateTo).toHaveBeenCalledWith(checkoutUrl))
    expect(bodies[0].survey).toEqual({ slug: 'onboarding', selections: { page1: ['earn_yield'] } })
  })

  it('saves the changes of a step and goes back', async () => {
    mockIsSafePro = false
    mockIsSurveyEnabled = false
    const invites = [{ identifier: fakerChecksummedAddress(), role: MemberRole.MEMBER }]
    const { result, push } = await renderStep('invite')

    act(() => result.current.step.retreat({ invites }))

    expect(result.current.workspace.draft.invites).toEqual(invites)
    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.selectSafes, query: {} })
  })

  it.each([
    ['Next', 'a middle step', true, 'safes'],
    ['Start free trial', 'the last step with Safe Pro', true, 'invite'],
    ['Create Workspace', 'the last step without Safe Pro', false, 'invite'],
  ] as const)('labels the continue button "%s" on %s', async (label, _, isSafePro, step) => {
    mockIsSafePro = isSafePro
    mockIsSurveyEnabled = false

    const { result } = await renderStep(step)

    expect(result.current.step.continueLabel).toBe(label)
  })
})
