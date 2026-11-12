import { useForm } from 'react-hook-form'
import type { WorkspaceDraft } from '@/features/spaces/store'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { fakeUserId, fakeWorkspaceName, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { userHandler } from '@/tests/msw/workspaceWizard'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { useFormFromDraft } from '../hooks/useFormFromDraft'
import { useWorkspaceDraft } from '../hooks/useWorkspaceDraft'

const toNameForm = (draft: WorkspaceDraft) => ({ name: draft.name })

const renderNameForm = (draft: WorkspaceDraft) =>
  renderHook(
    () => {
      const form = useForm({ defaultValues: { name: '' } })
      const isReady = useFormFromDraft(form.reset, toNameForm)
      return { form, isReady, workspaceDraft: useWorkspaceDraft() }
    },
    { initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft } },
  )

describe('useFormFromDraft', () => {
  beforeEach(() => localStorage.clear())

  it('fills the form from the draft once the owner is known', async () => {
    const ownerId = fakeUserId()
    const draft = workspaceDraftBuilder().with({ ownerId, name: fakeWorkspaceName() }).build()
    server.use(userHandler(ownerId))

    const { result } = renderNameForm(draft)

    await waitFor(() => expect(result.current.isReady).toBe(true))
    expect(result.current.form.getValues('name')).toBe(draft.name)
  })

  it('keeps what the user typed when the draft changes later', async () => {
    const ownerId = fakeUserId()
    const draft = workspaceDraftBuilder().with({ ownerId, name: fakeWorkspaceName() }).build()
    server.use(userHandler(ownerId))
    const { result } = renderNameForm(draft)
    await waitFor(() => expect(result.current.isReady).toBe(true))
    const typed = fakeWorkspaceName()

    act(() => result.current.form.setValue('name', typed))
    act(() => result.current.workspaceDraft.update({ name: fakeWorkspaceName() }))

    expect(result.current.form.getValues('name')).toBe(typed)
  })
})
