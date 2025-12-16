import { useState, useEffect } from 'react'
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import useDebounce from '../useDebounce'

const useTestHook = (): string => {
  const [inputValue, setInputValue] = useState<string>('foo')
  const debouncedValue = useDebounce(inputValue, 10)

  useEffect(() => {
    setInputValue('bar')
  }, [setInputValue])

  return debouncedValue
}

describe('useDebounce', () => {
  it('should debounce the value', async () => {
    const { result } = renderHook(() => useTestHook())

    expect(result.current).toBe('foo')

    await act(
      () =>
        new Promise((resolve) => {
          setTimeout(resolve, 10)
        }),
    )

    expect(result.current).toBe('bar')
  })
})
