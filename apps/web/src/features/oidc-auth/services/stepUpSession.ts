import type { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { setRecoverErrorHook } from '@safe-global/store/gateway/cgwClient'
import type { AppDispatch } from '@/store'
import { stepUpRequested, stepUpSettled } from '../store/stepUpSlice'
import { isElevationRequiredError } from '../utils/elevation'

let pending: { promise: Promise<boolean>; resolve: (isElevated: boolean) => void } | undefined

/**
 * Opens the verification dialog and resolves when it closes: true when the session is elevated.
 * Requests rejected while the dialog is open share it, so one verification lets all of them retry.
 */
export const requestStepUp = (dispatch: AppDispatch): Promise<boolean> => {
  if (!pending) {
    let resolve: (isElevated: boolean) => void = () => undefined
    const promise = new Promise<boolean>((resolvePromise) => {
      resolve = resolvePromise
    })
    pending = { promise, resolve }
    dispatch(stepUpRequested())
  }
  return pending.promise
}

export const settleStepUp = (dispatch: AppDispatch, isElevated: boolean): void => {
  pending?.resolve(isElevated)
  pending = undefined
  dispatch(stepUpSettled())
}

/**
 * The gateway checks elevation in a guard, before the handler runs, so a rejected
 * request wrote nothing and is safe to send again once the session is elevated.
 */
export const registerStepUpRecovery = (dispatch: AppDispatch): (() => void) => {
  setRecoverErrorHook((error: FetchBaseQueryError) =>
    isElevationRequiredError(error) ? requestStepUp(dispatch) : Promise.resolve(false),
  )
  return () => setRecoverErrorHook(() => Promise.resolve(false))
}
