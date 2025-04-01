import { useCallback, useEffect, useState } from 'react'
import { asError } from '@safe-global/utils/services/exceptions/utils'

export type AsyncResult<T> = [result: T | undefined, error: Error | undefined, loading: boolean]

const useAsync = <T>(
  asyncCall: () => Promise<T> | undefined,
  dependencies: unknown[],
  clearData = true,
): AsyncResult<T> => {
  const [data, setData] = useState<T | undefined>()
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState<boolean>(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const callback = useCallback(asyncCall, dependencies)

  useEffect(() => {
    setError(undefined)

    const promise = callback()

    // Not a promise, exit early
    if (!promise) {
      setData(undefined)
      setLoading(false)
      return
    }

    let isCurrent = true
    clearData && setData(undefined)
    setLoading(true)

    promise
      .then((val: T) => {
        isCurrent && setData(val)
      })
      .catch((err) => {
        isCurrent && setError(asError(err))
      })
      .finally(() => {
        isCurrent && setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [callback, clearData])

  return [data, error, loading]
}

export default useAsync

export const useAsyncCallback = <T extends (...args: any) => Promise<any>>(
  callback: T,
): {
  asyncCallback: (...args: Parameters<T>) => Promise<ReturnType<T>> | undefined
  error: Error | undefined
  isLoading: boolean
} => {
  const [error, setError] = useState<Error>()
  const [isLoading, setLoading] = useState<boolean>(false)

  const asyncCallback = useCallback(
    async (...args: Parameters<T>) => {
      setError(undefined)

      const result = callback(...args)

      // Not a promise, exit early
      if (!result) {
        setLoading(false)
        return result
      }

      setLoading(true)

      result
        .catch((err) => {
          setError(asError(err))
        })
        .finally(() => {
          setLoading(false)
        })

      return result
    },
    [callback],
  )

  return { asyncCallback, error, isLoading }
}
