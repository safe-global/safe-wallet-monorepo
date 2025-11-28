import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook that tracks whether the component is mounted.
 * Useful for preventing state updates or navigation after unmount.
 *
 * @returns A function that returns true if the component is still mounted
 *
 * @example
 * const isMounted = useIsMounted()
 *
 * const handleAsync = async () => {
 *   const result = await asyncOperation()
 *   if (isMounted()) {
 *     setState(result)
 *   }
 * }
 */
export const useIsMounted = () => {
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  return useCallback(() => isMountedRef.current, [])
}
