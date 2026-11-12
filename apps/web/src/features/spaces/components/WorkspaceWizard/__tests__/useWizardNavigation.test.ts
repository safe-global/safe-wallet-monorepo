import { faker } from '@faker-js/faker'
import { AppRoutes } from '@/config/routes'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { spaceBuilder } from '@/tests/builders/space'
import { workspacesHandler } from '@/tests/msw/workspaceWizard'
import { act, fakerChecksummedAddress, renderHook, waitFor } from '@/tests/test-utils'
import type { WizardStepId } from '../steps'
import { useWizardNavigation } from '../hooks/useWizardNavigation'

let mockIsSafePro = false
let mockIsSurveyEnabled = false
jest.mock('@/hooks/useIsSafeProEnabled', () => ({ useIsSafeProEnabled: () => mockIsSafePro }))
jest.mock('@/hooks/useIsSurveyEnabled', () => ({ __esModule: true, default: () => mockIsSurveyEnabled }))

const renderNavigation = (step: WizardStepId, query: Record<string, string> = {}) => {
  const push = jest.fn(() => Promise.resolve(true))
  const view = renderHook(() => useWizardNavigation(step), { routerProps: { push, query } })
  return { ...view, push }
}

describe('useWizardNavigation', () => {
  it.each([
    ['the name step', 'with Safe Pro', true, false, 'name', AppRoutes.welcome.plan],
    ['the name step', 'without Safe Pro', false, false, 'name', AppRoutes.welcome.selectSafes],
    ['the invite step', 'with the survey', false, true, 'invite', AppRoutes.welcome.survey],
  ] as const)('goes on from %s %s to %s', (_, __, isSafePro, isSurveyEnabled, step, route) => {
    mockIsSafePro = isSafePro
    mockIsSurveyEnabled = isSurveyEnabled
    const { result, push } = renderNavigation(step)

    act(() => result.current.goNext())

    expect(push).toHaveBeenCalledWith({ pathname: route, query: {} })
  })

  it('goes nowhere on Next from the last step', () => {
    mockIsSafePro = false
    mockIsSurveyEnabled = false
    const { result, push } = renderNavigation('invite')

    act(() => result.current.goNext())

    expect(result.current.isLastStep).toBe(true)
    expect(push).not.toHaveBeenCalled()
  })

  it.each([
    ['with Safe Pro', true, AppRoutes.welcome.plan],
    ['without Safe Pro', false, AppRoutes.welcome.createSpace],
  ])('goes back from the Safes step %s to %s', (_, isSafePro, route) => {
    mockIsSafePro = isSafePro
    mockIsSurveyEnabled = false
    const { result, push } = renderNavigation('safes')

    act(() => result.current.goBack())

    expect(push).toHaveBeenCalledWith({ pathname: route, query: {} })
  })

  it('leaves for the Workspace list on Back from the first step', async () => {
    mockIsSafePro = false
    mockIsSurveyEnabled = false
    server.use(workspacesHandler([spaceBuilder().build()]))
    const push = jest.fn(() => Promise.resolve(true))
    const { result } = renderHook(() => useWizardNavigation('name'), {
      routerProps: { push },
      initialReduxState: { auth: signedInAuthState() },
    })
    await waitFor(() => expect(result.current.hasNoSpaces).toBe(false))

    act(() => result.current.goBack())

    expect(push).toHaveBeenCalledWith(AppRoutes.welcome.spaces)
  })

  it('keeps the Safe of the link into the onboarding on every step', () => {
    mockIsSafePro = false
    mockIsSurveyEnabled = false
    const safe = `${faker.string.numeric(3)}:${fakerChecksummedAddress()}`
    const { result, push } = renderNavigation('safes', { safe })

    act(() => result.current.goNext())

    expect(push).toHaveBeenCalledWith({ pathname: AppRoutes.welcome.inviteMembers, query: { safe } })
  })
})
