import {
  stepUpFailed,
  stepUpPopupBlocked,
  stepUpPopupOpened,
  stepUpRequested,
  stepUpSettled,
  stepUpSlice,
} from '../stepUpSlice'

const { reducer } = stepUpSlice

describe('stepUpSlice', () => {
  it('starts idle', () => {
    expect(reducer(undefined, { type: 'init' })).toEqual({ status: 'idle' })
  })

  it.each([
    [stepUpRequested(), 'prompt'],
    [stepUpPopupOpened(), 'waiting'],
    [stepUpPopupBlocked(), 'blocked'],
    [stepUpFailed(), 'failed'],
  ])('moves to the status of %p', (action, status) => {
    expect(reducer(undefined, action)).toEqual({ status })
  })

  it('returns to idle when the step-up settles', () => {
    const waiting = reducer(reducer(undefined, stepUpRequested()), stepUpPopupOpened())

    expect(reducer(waiting, stepUpSettled())).toEqual({ status: 'idle' })
  })
})
