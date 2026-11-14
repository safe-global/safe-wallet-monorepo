import { getMultiChainSafeId } from '@safe-global/views/features/spaces/components/SelectSafesOnboarding/utils/safeIds'
import type { WorkspaceDraft } from '@/features/spaces/store'
import type { AllSafeItems, MultiChainSafeItem, SafeItem } from '@/hooks/safes'
import { server } from '@/tests/server'
import { signedInAuthState } from '@/tests/builders/authState'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { fakeUserId, workspaceDraftBuilder } from '@/tests/builders/workspaceDraft'
import { userHandler } from '@/tests/msw/workspaceWizard'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { useSafesStepForm } from '../hooks/useSafesStepForm'

const noSafes: AllSafeItems = []

const renderSafesForm = (draft: WorkspaceDraft, query: Record<string, string> = {}) => {
  const advance = jest.fn()
  const retreat = jest.fn()
  const view = renderHook(
    ({ allSafes }: { allSafes: AllSafeItems }) =>
      useSafesStepForm({ draft, allSafes, flaggedAddresses: new Set(), limit: null, advance, retreat }),
    {
      initialProps: { allSafes: noSafes },
      routerProps: { query },
      initialReduxState: { auth: signedInAuthState(), workspaceDraft: draft },
    },
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

const multiChainGroup = (safes: SafeItem[]): MultiChainSafeItem => ({
  address: safes[0].address,
  safes,
  isPinned: false,
  lastVisited: 0,
  name: undefined,
})

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

  it('selects every chain of the linked Safe once its multichain group loads', async () => {
    const mainnet = safeItemBuilder().with({ chainId: '1' }).build()
    const gnosis = { ...mainnet, chainId: '100' }
    const { result, rerender } = renderSafesForm(signedInDraft(), { safe: `1:${mainnet.address}` })
    await waitFor(() => expect(result.current.pickedSafes).toHaveLength(1))

    rerender({ allSafes: [multiChainGroup([mainnet, gnosis])] })

    await waitFor(() => expect(result.current.pickedSafes).toHaveLength(2))
    expect(result.current.pickedSafes).toEqual(
      expect.arrayContaining([
        { chainId: '1', address: mainnet.address },
        { chainId: '100', address: mainnet.address },
      ]),
    )
    expect(result.current.formMethods.getValues('selectedSafes')).toHaveProperty([getMultiChainSafeId(mainnet)], true)
  })

  it('keeps the Safes of the draft when the linked Safe turns out to be multichain', async () => {
    const saved = draftSafe()
    const mainnet = safeItemBuilder().with({ chainId: '1' }).build()
    const { result, rerender } = renderSafesForm(signedInDraft({ safes: [saved] }), { safe: `1:${mainnet.address}` })
    await waitFor(() => expect(result.current.pickedSafes).toEqual([saved]))

    rerender({ allSafes: [multiChainGroup([mainnet, { ...mainnet, chainId: '100' }])] })

    await act(async () => {})
    expect(result.current.pickedSafes).toEqual([saved])
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
