import { faker } from '@faker-js/faker'
import { makeStore } from '@/store'
import { hnSessionRejected, hnSessionRejectionCleared, selectRejectedHypernativeAuthorization } from '../hnSessionSlice'

const rejectedAuthorization = (store: ReturnType<typeof makeStore>) =>
  selectRejectedHypernativeAuthorization(store.getState())

describe('hnSessionSlice', () => {
  it('starts with no rejected authorization', () => {
    const store = makeStore()

    expect(rejectedAuthorization(store)).toBeUndefined()
  })

  it('remembers the authorization the API rejected', () => {
    const store = makeStore()
    const authorization = `Bearer ${faker.string.alphanumeric(40)}`

    store.dispatch(hnSessionRejected(authorization))

    expect(rejectedAuthorization(store)).toBe(authorization)
  })

  it('forgets the rejected authorization once cleared', () => {
    const store = makeStore()
    store.dispatch(hnSessionRejected(`Bearer ${faker.string.alphanumeric(40)}`))

    store.dispatch(hnSessionRejectionCleared())

    expect(rejectedAuthorization(store)).toBeUndefined()
  })
})
