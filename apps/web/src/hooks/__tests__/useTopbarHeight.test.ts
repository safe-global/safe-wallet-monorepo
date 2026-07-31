import { renderHook } from '@testing-library/react'
import { useTopbarHeight } from '../useTopbarHeight'

const TOPBAR_HEIGHT_VAR = '--topbar-height'

const makeNode = (height: number): HTMLDivElement => {
  const node = document.createElement('div')
  Object.defineProperty(node, 'offsetHeight', { configurable: true, value: height })
  return node
}

const readVar = () => document.documentElement.style.getPropertyValue(TOPBAR_HEIGHT_VAR)

describe('useTopbarHeight', () => {
  let observeMock: jest.Mock
  let disconnectMock: jest.Mock
  let resizeCallback: ResizeObserverCallback
  const originalResizeObserver = globalThis.ResizeObserver

  beforeEach(() => {
    observeMock = jest.fn()
    disconnectMock = jest.fn()
    ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = jest.fn((cb: ResizeObserverCallback) => {
      resizeCallback = cb
      return { observe: observeMock, unobserve: jest.fn(), disconnect: disconnectMock }
    })
  })

  afterEach(() => {
    document.documentElement.style.removeProperty(TOPBAR_HEIGHT_VAR)
    ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = originalResizeObserver
    jest.clearAllMocks()
  })

  it('publishes the node height to the CSS variable and observes it', () => {
    const { result } = renderHook(() => useTopbarHeight())
    const node = makeNode(88)

    result.current(node)

    expect(readVar()).toBe('88px')
    expect(observeMock).toHaveBeenCalledWith(node)
  })

  it('updates the variable when the observed element resizes', () => {
    const { result } = renderHook(() => useTopbarHeight())
    const node = makeNode(88)
    result.current(node)

    Object.defineProperty(node, 'offsetHeight', { configurable: true, value: 148 })
    resizeCallback([], {} as ResizeObserver)

    expect(readVar()).toBe('148px')
  })

  it('removes the variable and disconnects when the node detaches', () => {
    const { result } = renderHook(() => useTopbarHeight())
    result.current(makeNode(88))

    result.current(null)

    expect(disconnectMock).toHaveBeenCalledTimes(1)
    expect(readVar()).toBe('')
  })

  it('rebinds to a new node, disconnecting the previous observer', () => {
    const { result } = renderHook(() => useTopbarHeight())
    result.current(makeNode(88))

    result.current(makeNode(120))

    expect(disconnectMock).toHaveBeenCalledTimes(1)
    expect(readVar()).toBe('120px')
  })

  it('keeps the static default when ResizeObserver is unavailable', () => {
    ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = undefined
    const { result } = renderHook(() => useTopbarHeight())

    result.current(makeNode(88))

    expect(readVar()).toBe('')
    expect(observeMock).not.toHaveBeenCalled()
  })
})
