import type { ReactNode } from 'react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { act, renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useStepUpSplash } from '../useStepUpSplash'
import { stepUpLeaving, stepUpReturnUrlSet, stepUpSlice } from '../../store/stepUpSlice'
import { startStepUp } from '../../utils/stepUp'

jest.mock('../../utils/stepUp', () => ({ startStepUp: jest.fn() }))

const renderWithStore = () => {
  const store = configureStore({ reducer: { [stepUpSlice.name]: stepUpSlice.reducer } })
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  const hook = renderHook(() => useStepUpSplash(), { wrapper })
  return { store, ...hook }
}

describe('useStepUpSplash', () => {
  beforeEach(() => {
    jest.mocked(startStepUp).mockClear()
  })

  it('should, when the step-up leaves without a return URL, return to the current page', () => {
    const { store } = renderWithStore()

    act(() => {
      store.dispatch(stepUpLeaving())
    })

    expect(startStepUp).toHaveBeenCalledTimes(1)
    expect(startStepUp).toHaveBeenCalledWith(undefined)
  })

  it('should, when a return URL is set, send the challenge back there', () => {
    const returnUrl = `/welcome/select-safes?spaceId=${faker.string.uuid()}`
    const { store, result } = renderWithStore()

    act(() => {
      store.dispatch(stepUpReturnUrlSet(returnUrl))
      store.dispatch(stepUpLeaving())
    })

    expect(startStepUp).toHaveBeenCalledWith(returnUrl)
    expect(result.current).toBe('Verifying your identity…')
  })

  it('should, when the return URL changes while leaving, not start a second redirect', () => {
    const { store } = renderWithStore()

    act(() => {
      store.dispatch(stepUpLeaving())
    })
    act(() => {
      store.dispatch(stepUpReturnUrlSet(faker.internet.url()))
    })

    expect(startStepUp).toHaveBeenCalledTimes(1)
  })
})
