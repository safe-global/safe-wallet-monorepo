import { faker } from '@faker-js/faker'
import { stepUpReturnUrlCleared, stepUpReturnUrlSet, stepUpSettled, stepUpSlice } from '../stepUpSlice'

const { reducer } = stepUpSlice

describe('stepUpSlice return URL', () => {
  it('should, when a return URL is set, store it', () => {
    const returnUrl = faker.internet.url()

    const state = reducer(undefined, stepUpReturnUrlSet(returnUrl))

    expect(state.returnUrl).toBe(returnUrl)
  })

  it('should, when the stored return URL is cleared, remove it', () => {
    const returnUrl = faker.internet.url()

    const state = reducer(reducer(undefined, stepUpReturnUrlSet(returnUrl)), stepUpReturnUrlCleared(returnUrl))

    expect(state.returnUrl).toBeUndefined()
  })

  it('should, when another return URL is cleared, keep the stored one', () => {
    const returnUrl = faker.internet.url()

    const state = reducer(
      reducer(undefined, stepUpReturnUrlSet(returnUrl)),
      stepUpReturnUrlCleared(`${returnUrl}/other`),
    )

    expect(state.returnUrl).toBe(returnUrl)
  })

  it('should, when the step-up settles, keep the return URL for the next one', () => {
    const returnUrl = faker.internet.url()

    const state = reducer(reducer(undefined, stepUpReturnUrlSet(returnUrl)), stepUpSettled())

    expect(state.returnUrl).toBe(returnUrl)
  })
})
