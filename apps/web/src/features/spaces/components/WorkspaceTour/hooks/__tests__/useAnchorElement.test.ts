import { act, renderHook } from '@/tests/test-utils'
import { ANCHOR_TIMEOUT_MS, useAnchorElement } from '../useAnchorElement'

const addElement = (testId: string) => {
  const element = document.createElement('div')
  element.dataset.testid = testId
  document.body.appendChild(element)
  return element
}

describe('useAnchorElement', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns an element that is already on the page', () => {
    const element = addElement('anchor')

    const { result } = renderHook(() => useAnchorElement('[data-testid="anchor"]'))

    expect(result.current).toEqual({ element, isMissing: false })
  })

  it('returns an element that renders after the hook starts waiting', async () => {
    const { result } = renderHook(() => useAnchorElement('[data-testid="anchor"]'))

    const element = await act(async () => addElement('anchor'))

    expect(result.current).toEqual({ element, isMissing: false })
  })

  it('follows the selector to the element that replaces the first match', async () => {
    const first = addElement('anchor')
    const { result } = renderHook(() => useAnchorElement('[data-testid="anchor"]'))

    const replacement = await act(async () => {
      first.remove()
      return addElement('anchor')
    })

    expect(result.current).toEqual({ element: replacement, isMissing: false })
  })

  it('reports the anchor as missing when it never renders', () => {
    const { result } = renderHook(() => useAnchorElement('[data-testid="anchor"]'))

    act(() => jest.advanceTimersByTime(ANCHOR_TIMEOUT_MS))

    expect(result.current).toEqual({ element: null, isMissing: true })
  })

  it('waits for nothing when no selector is given', () => {
    const { result } = renderHook(() => useAnchorElement(undefined))

    act(() => jest.advanceTimersByTime(ANCHOR_TIMEOUT_MS))

    expect(result.current).toEqual({ element: null, isMissing: false })
  })
})
