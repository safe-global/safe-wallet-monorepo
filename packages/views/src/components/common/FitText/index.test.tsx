import { act, render, screen } from '@testing-library/react'
import { FitText } from '.'

const MAX_FONT_SIZE = 30
const MIN_FONT_SIZE = 18
const VALUE = '$1,278,243,618.88'

let containerWidth = 0
let textWidthAtMaxFontSize = 0
let resizeCallbacks: Array<() => void> = []
const disconnect = jest.fn()
const fontListeners = new Set<() => void>()

const fontSizeOf = (element: HTMLElement) => parseFloat(element.style.fontSize)
const textWidthAt = (fontSize: number) => (textWidthAtMaxFontSize * fontSize) / MAX_FONT_SIZE

const renderFitText = (text = VALUE) =>
  render(
    <FitText maxFontSize={MAX_FONT_SIZE} minFontSize={MIN_FONT_SIZE}>
      {text}
    </FitText>,
  )

const resizeContainer = (width: number) => {
  containerWidth = width
  act(() => resizeCallbacks.forEach((callback) => callback()))
}

const finishLoadingFonts = () => act(() => fontListeners.forEach((listener) => listener()))

const fittedElement = () => screen.getByText(VALUE).parentElement as HTMLElement

describe('FitText', () => {
  beforeEach(() => {
    resizeCallbacks = []
    fontListeners.clear()
    disconnect.mockClear()

    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.style.fontSize) return { width: containerWidth } as DOMRect
      return { width: textWidthAt(fontSizeOf(this.parentElement as HTMLElement)) } as DOMRect
    })

    global.ResizeObserver = class {
      constructor(callback: () => void) {
        resizeCallbacks.push(callback)
      }
      observe() {}
      unobserve() {}
      disconnect = disconnect
    } as unknown as typeof ResizeObserver

    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: {
        addEventListener: (_: string, listener: () => void) => fontListeners.add(listener),
        removeEventListener: (_: string, listener: () => void) => fontListeners.delete(listener),
      },
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('keeps the maximum font size when the text fits', () => {
    containerWidth = 400
    textWidthAtMaxFontSize = 300

    renderFitText()

    expect(fontSizeOf(fittedElement())).toBe(MAX_FONT_SIZE)
    expect(fittedElement()).not.toHaveAttribute('title')
  })

  it('shrinks the font size so the text fits the container', () => {
    containerWidth = 300
    textWidthAtMaxFontSize = 400

    renderFitText()

    expect(fontSizeOf(fittedElement())).toBe(22)
    expect(fittedElement()).not.toHaveAttribute('title')
  })

  it('stops at the minimum font size and shows the full text on hover when it still overflows', () => {
    containerWidth = 200
    textWidthAtMaxFontSize = 600

    renderFitText()

    expect(fontSizeOf(fittedElement())).toBe(MIN_FONT_SIZE)
    expect(fittedElement()).toHaveAttribute('title', VALUE)
  })

  it('shows the full text of rich children on hover when truncated', () => {
    containerWidth = 200
    textWidthAtMaxFontSize = 600

    render(
      <FitText maxFontSize={MAX_FONT_SIZE} minFontSize={MIN_FONT_SIZE}>
        $1,278,243,618<span>.88</span>
      </FitText>,
    )

    expect(screen.getByTitle(VALUE)).toBeInTheDocument()
  })

  it('keeps its size in a parent sized by its own fractional text width', () => {
    textWidthAtMaxFontSize = 300.4
    containerWidth = 300.4

    renderFitText()
    resizeContainer(300.4)

    expect(fontSizeOf(fittedElement())).toBe(MAX_FONT_SIZE)
  })

  it('steps down instead of truncating when the text overflows by less than a pixel', () => {
    containerWidth = 299.7
    textWidthAtMaxFontSize = 300

    renderFitText()

    expect(fontSizeOf(fittedElement())).toBe(29)
    expect(fittedElement()).not.toHaveAttribute('title')
  })

  it('grows back to the maximum font size when the container widens', () => {
    containerWidth = 300
    textWidthAtMaxFontSize = 400
    renderFitText()

    resizeContainer(800)

    expect(fontSizeOf(fittedElement())).toBe(MAX_FONT_SIZE)
  })

  it('refits when the text changes', () => {
    containerWidth = 300
    textWidthAtMaxFontSize = 600
    const { rerender } = renderFitText('$1')

    textWidthAtMaxFontSize = 400
    rerender(
      <FitText maxFontSize={MAX_FONT_SIZE} minFontSize={MIN_FONT_SIZE}>
        {VALUE}
      </FitText>,
    )

    expect(fontSizeOf(fittedElement())).toBe(22)
  })

  it('refits when web fonts finish loading and change the text width', () => {
    containerWidth = 300
    textWidthAtMaxFontSize = 300
    renderFitText()

    textWidthAtMaxFontSize = 400
    finishLoadingFonts()

    expect(fontSizeOf(fittedElement())).toBe(22)
  })

  it('stops observing resizes and font loads when unmounted', () => {
    containerWidth = 300
    textWidthAtMaxFontSize = 300
    const { unmount } = renderFitText()

    unmount()

    expect(disconnect).toHaveBeenCalled()
    expect(fontListeners.size).toBe(0)
  })
})
