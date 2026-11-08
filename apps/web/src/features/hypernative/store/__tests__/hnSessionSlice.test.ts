import { faker } from '@faker-js/faker'
import { configureStore } from '@reduxjs/toolkit'
import type { RootState } from '@/store'
import {
  hnSessionRejected,
  hnSessionRejectionCleared,
  hnSessionSlice,
  selectRejectedHypernativeToken,
} from '../hnSessionSlice'

const makeStore = () => configureStore({ reducer: { [hnSessionSlice.name]: hnSessionSlice.reducer } })

const rejectedToken = (store: ReturnType<typeof makeStore>) =>
  selectRejectedHypernativeToken(store.getState() as unknown as RootState)

describe('hnSessionSlice', () => {
  it('starts with no rejected token', () => {
    const store = makeStore()

    expect(rejectedToken(store)).toBeUndefined()
  })

  it('remembers the token the API rejected', () => {
    const store = makeStore()
    const token = `Bearer ${faker.string.alphanumeric(40)}`

    store.dispatch(hnSessionRejected(token))

    expect(rejectedToken(store)).toBe(token)
  })

  it('forgets the rejected token once cleared', () => {
    const store = makeStore()
    store.dispatch(hnSessionRejected(`Bearer ${faker.string.alphanumeric(40)}`))

    store.dispatch(hnSessionRejectionCleared())

    expect(rejectedToken(store)).toBeUndefined()
  })
})
