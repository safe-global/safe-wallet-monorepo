import { useCallback, useEffect, useReducer } from 'react'
import { asError } from '@safe-global/utils/services/exceptions/utils'

export type AsyncResult<T> = [result: T | undefined, error: Error | undefined, loading: boolean]

interface AsyncState<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
}

type AsyncAction<T> =
  | { type: 'reset' }
  | { type: 'start'; clearData: boolean }
  | { type: 'success'; data: T }
  | { type: 'error'; error: Error }
  | { type: 'loading_done' }

function asyncReducer<T>(state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case 'reset':
      return { data: undefined, error: undefined, loading: false }
    case 'start':
      return { data: action.clearData ? undefined : state.data, error: undefined, loading: true }
    case 'success':
      return { data: action.data, error: undefined, loading: false }
    case 'error':
      return { data: undefined, error: action.error, loading: false }
    case 'loading_done':
      return state.loading ? { ...state, loading: false } : state
  }
}

const INITIAL_STATE: AsyncState<unknown> = { data: undefined, error: undefined, loading: false }

const useAsync = <T>(
  asyncCall: () => Promise<T> | undefined,
  dependencies: unknown[],
  clearData = true,
): AsyncResult<T> => {
  const [state, dispatch] = useReducer(asyncReducer<T>, INITIAL_STATE as AsyncState<T>)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callback = useCallback(asyncCall, dependencies)

  useEffect(() => {
    const promise = callback()

    // Not a promise, exit early
    if (!promise) {
      dispatch({ type: 'reset' })
      return
    }

    let isCurrent = true
    dispatch({ type: 'start', clearData })

    promise
      .then((val: T) => {
        isCurrent && dispatch({ type: 'success', data: val })
      })
      .catch((err) => {
        isCurrent && dispatch({ type: 'error', error: asError(err) })
      })

    return () => {
      isCurrent = false
    }
  }, [callback, clearData])

  return [state.data, state.error, state.loading]
}

export default useAsync

export const useAsyncCallback = <T extends (...args: any) => Promise<any>>(
  callback: T,
): {
  asyncCallback: (...args: Parameters<T>) => Promise<ReturnType<T>> | undefined
  error: Error | undefined
  isLoading: boolean
} => {
  const [state, dispatch] = useReducer(asyncReducer<ReturnType<T>>, INITIAL_STATE as AsyncState<ReturnType<T>>)

  const asyncCallback = useCallback(
    async (...args: Parameters<T>) => {
      dispatch({ type: 'reset' })

      const result = callback(...args)

      // Not a promise, exit early
      if (!result) {
        dispatch({ type: 'loading_done' })
        return result
      }

      dispatch({ type: 'start', clearData: false })

      result
        .catch((err) => {
          dispatch({ type: 'error', error: asError(err) })
        })
        .finally(() => {
          dispatch({ type: 'loading_done' })
        })

      return result
    },
    [callback],
  )

  return { asyncCallback, error: state.error, isLoading: state.loading }
}
