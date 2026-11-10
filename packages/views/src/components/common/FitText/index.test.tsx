import { act, render, screen } from '@testing-library/react'
import { FitText } from '.'

const MAX_FONT_SIZE = 30
const MIN_FONT_SIZE = 18
const VALUE = '$1,278,243,618.88'

let containerWidth = 0
let textWidthAtMaxFontSize = 0
let resizeCallbacks: Array<() => void> = []

const fontSizeOf = (element: HTMLElement) => parseFloat(element.style.fontSize)

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

const fittedElement = () => screen.getByText(VALUE).parentElement as HTMLElement

describe('FitText', () => {
  beforeEach(() => {
    resizeCallbacks = []

    jest.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => containerWidth)
    jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      const fontSize = fontSizeOf(this.parentElement as HTMLElement) || MAX_FONT_SIZE
      return { width: (textWidthAtMaxFontSize * fontSize) / MAX_FONT_SIZE } as DOMRect
    })

    global.ResizeObserver = class {
      constructor(callback: () => void) {
        resizeCallbacks.push(callback)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
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
})
