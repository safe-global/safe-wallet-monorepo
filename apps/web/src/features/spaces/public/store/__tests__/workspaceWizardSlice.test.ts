import { makeStore } from '@/store'
import { resumeOfferAnswered, selectIsResumeOffered, wizardLeft, wizardStepOpened } from '../workspaceWizardSlice'

describe('workspaceWizardSlice', () => {
  it('offers the saved draft when the wizard opens on its first step', () => {
    const store = makeStore()

    store.dispatch(wizardStepOpened(true))

    expect(selectIsResumeOffered(store.getState())).toBe(true)
  })

  it('offers nothing when the wizard opens on a later step', () => {
    const store = makeStore()

    store.dispatch(wizardStepOpened(false))

    expect(selectIsResumeOffered(store.getState())).toBe(false)
  })

  it('offers nothing when the user comes back to the first step from a later one', () => {
    const store = makeStore()

    store.dispatch(wizardStepOpened(true))
    store.dispatch(wizardStepOpened(false))
    store.dispatch(wizardStepOpened(true))

    expect(selectIsResumeOffered(store.getState())).toBe(false)
  })

  it('offers the saved draft again when the user comes back after leaving the wizard', () => {
    const store = makeStore()
    store.dispatch(wizardStepOpened(true))
    store.dispatch(wizardStepOpened(false))

    store.dispatch(wizardLeft())
    store.dispatch(wizardStepOpened(true))

    expect(selectIsResumeOffered(store.getState())).toBe(true)
  })

  it('ends the offer once the user answers it', () => {
    const store = makeStore()
    store.dispatch(wizardStepOpened(true))

    store.dispatch(resumeOfferAnswered())

    expect(selectIsResumeOffered(store.getState())).toBe(false)
  })
})
