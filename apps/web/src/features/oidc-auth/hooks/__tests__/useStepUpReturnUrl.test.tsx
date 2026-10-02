import type { ReactNode } from 'react'
import { configureStore } from '@reduxjs/toolkit'
import { Provider } from 'react-redux'
import { renderHook } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { useStepUpReturnUrl } from '../useStepUpReturnUrl'
import { stepUpSlice } from '../../store/stepUpSlice'

const createTestStore = () => configureStore({ reducer: { [stepUpSlice.name]: stepUpSlice.reducer } })

const renderWithStore = (initialUrl: string | undefined) => {
  const store = createTestStore()
  const wrapper = ({ children }: { children: ReactNode }) => <Provider store={store}>{children}</Provider>
  const hook = renderHook(({ url }: { url: string | undefined }) => useStepUpReturnUrl(url), {
    initialProps: { url: initialUrl },
    wrapper,
  })
  return { store, ...hook }
}

describe('useStepUpReturnUrl', () => {
  it('should, while mounted, set the return URL for a step-up', () => {
    const returnUrl = `/welcome/select-safes?spaceId=${faker.string.uuid()}`

    const { store } = renderWithStore(returnUrl)

    expect(store.getState().stepUp.returnUrl).toBe(returnUrl)
  })

  it('should, when unmounted, clear the return URL', () => {
    const { store, unmount } = renderWithStore(faker.internet.url())

    unmount()

    expect(store.getState().stepUp.returnUrl).toBeUndefined()
  })

  it('should, when the URL changes, replace the stored one', () => {
    const nextUrl = `${faker.internet.url()}/next`
    const { store, rerender } = renderWithStore(faker.internet.url())

    rerender({ url: nextUrl })

    expect(store.getState().stepUp.returnUrl).toBe(nextUrl)
  })

  it('should, when no URL is given, leave the return URL unset', () => {
    const { store } = renderWithStore(undefined)

    expect(store.getState().stepUp.returnUrl).toBeUndefined()
  })
})
