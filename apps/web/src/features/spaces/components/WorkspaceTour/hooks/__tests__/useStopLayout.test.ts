import { act, renderHook } from '@/tests/test-utils'
import type { TourStep } from '../../types'
import { ANCHOR_TIMEOUT_MS, useStopLayout } from '../useStopLayout'

const STEP: TourStep = {
  id: 'anchor',
  route: '/spaces',
  anchor: '[data-tour="anchor"]',
  placement: { side: 'bottom', align: 'start' },
  title: 'Anchor',
  body: 'Anchor',
}

const addAnchor = () => {
  const element = document.createElement('div')
  element.dataset.tour = 'anchor'
  document.body.appendChild(element)
  return element
}

describe('useStopLayout', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: false })
    document.body.innerHTML = ''
  })

  it('finds an anchor that is already on the page', () => {
    const element = addAnchor()

    const { result } = renderHook(() => useStopLayout(STEP, true, jest.fn()))

    expect(result.current.target).toBe(element)
  })

  it('finds an anchor that renders after the hook starts waiting', async () => {
    const { result } = renderHook(() => useStopLayout(STEP, true, jest.fn()))

    const element = await act(async () => addAnchor())

    expect(result.current.target).toBe(element)
  })

  it('follows the selector to the element that replaces the first match', async () => {
    const first = addAnchor()
    const { result } = renderHook(() => useStopLayout(STEP, true, jest.fn()))

    const replacement = await act(async () => {
      first.remove()
      return addAnchor()
    })

    expect(result.current.target).toBe(replacement)
  })

  it('reports the anchor as missing when it never renders', () => {
    const onMissing = jest.fn()
    renderHook(() => useStopLayout(STEP, true, onMissing))

    act(() => jest.advanceTimersByTime(ANCHOR_TIMEOUT_MS))

    expect(onMissing).toHaveBeenCalledTimes(1)
  })

  it('waits for nothing while the stop page is still loading', () => {
    const onMissing = jest.fn()
    addAnchor()

    const { result } = renderHook(() => useStopLayout(STEP, false, onMissing))
    act(() => jest.advanceTimersByTime(ANCHOR_TIMEOUT_MS))

    expect(result.current.target).toBeNull()
    expect(onMissing).not.toHaveBeenCalled()
  })
})
