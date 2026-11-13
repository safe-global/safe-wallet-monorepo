import type { WorkspaceDraft } from '@/features/spaces/store'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { fakeUserId, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { userHandler } from '@/tests/msw/workspaceWizard'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { useSafesStepForm } from '../hooks/useSafesStepForm'

const renderSafesForm = (draft: WorkspaceDraft, query: Record<string, string> = {}) => {
  const advance = jest.fn()
  const retreat = jest.fn()
  const view = renderHook(
    () => useSafesStepForm({ draft, allSafes: [], flaggedAddresses: new Set(), limit: null, advance, retreat }),
    { routerProps: { query }, initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft } },
  )
  return { ...view, advance, retreat }
}

const signedInDraft = (changes: Partial<WorkspaceDraft> = {}): WorkspaceDraft => {
  const ownerId = fakeUserId()
  server.use(userHandler(ownerId))
  return workspaceDraftBuilder()
    .with({ ownerId, ...changes })
    .build()
}

const draftSafe = () => {
  const { chainId, address } = safeItemBuilder().build()
  return { chainId, address }
}

describe('useSafesStepForm', () => {
  beforeEach(() => localStorage.clear())

  it('preselects the Safes saved in the draft', async () => {
    const safe = draftSafe()

    const { result } = renderSafesForm(signedInDraft({ safes: [safe] }))

    await waitFor(() => expect(result.current.pickedSafes).toEqual([safe]))
  })

  it('preselects the Safe of the link into the onboarding when the draft has none', async () => {
    const safe = draftSafe()

    const { result } = renderSafesForm(signedInDraft(), { safe: `${safe.chainId}:${safe.address}` })

    await waitFor(() => expect(result.current.pickedSafes).toEqual([safe]))
  })

  it('asks for the names of new Safes before it moves on', async () => {
    const { result, advance } = renderSafesForm(signedInDraft({ safes: [draftSafe()] }))

    await act(() => result.current.onSubmit())

    expect(result.current.isNameStep).toBe(true)
    expect(advance).not.toHaveBeenCalled()
  })

  it('saves the picked Safes with their sanitized names, keyed in lower case', async () => {
    const safe = draftSafe()
    const { result, advance } = renderSafesForm(signedInDraft({ safes: [safe] }))
    await act(() => result.current.onSubmit())

    act(() => result.current.formMethods.setValue(`names.${safe.address.toLowerCase()}`, '  Payroll\u200b '))
    await act(() => result.current.onSubmit())

    expect(advance).toHaveBeenCalledWith({ safes: [safe], safeNames: { [safe.address.toLowerCase()]: 'Payroll' } })
  })

  it('goes back from naming to the selection without leaving the step', async () => {
    const { result, retreat } = renderSafesForm(signedInDraft({ safes: [draftSafe()] }))
    await act(() => result.current.onSubmit())

    act(() => result.current.onBack())

    expect(result.current.isNameStep).toBe(false)
    expect(retreat).not.toHaveBeenCalled()
  })

  it('saves the picked Safes when the user goes back from the selection', async () => {
    const safe = draftSafe()
    const { result, retreat } = renderSafesForm(signedInDraft({ safes: [safe] }))
    await waitFor(() => expect(result.current.pickedSafes).toEqual([safe]))

    act(() => result.current.onBack())

    expect(retreat).toHaveBeenCalledWith({ safes: [safe], safeNames: {} })
  })

  it('saves no Safes when the user skips the step', async () => {
    const { result, advance } = renderSafesForm(signedInDraft({ safes: [draftSafe()] }))

    act(() => result.current.onSkip())

    expect(advance).toHaveBeenCalledWith({ safes: [], safeNames: {} })
  })
})
