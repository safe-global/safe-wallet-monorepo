import { render, waitFor } from '@/tests/test-utils'
import SafeAppIconCard, { _svgAttributesToProps } from '.'

describe('SafeAppIconCard', () => {
  it('should render an icon', () => {
    const src = 'https://safe-transaction-assets.safe.global/safe_apps/160/icon.png'
    const { queryByAltText } = render(
      <SafeAppIconCard src={src} fallback="/fallback.png" height={100} width={100} alt="test" />,
    )

    const img = queryByAltText('test')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', src)
    expect(img).toHaveAttribute('height', '100')
    expect(img).toHaveAttribute('width', '100')
    expect(img).not.toHaveAttribute('crossorigin')
  })

  it('should render an svg icon', async () => {
    const className = 'test-class'
    const viewBox = '0 0 100 100'

    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        text: () =>
          Promise.resolve(
            `<svg class="${className}" viewBox="${viewBox}" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" /></svg>`,
          ),
      }),
    ) as jest.Mock

    const src = 'https://fake.url.com/image.svg'
    const { container } = render(
      <SafeAppIconCard src={src} fallback="/fallback.png" height={100} width={100} alt="test" />,
    )

    await waitFor(() => {
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('class', className)
      expect(svg).toHaveAttribute('viewBox', viewBox)
      expect(svg).toHaveAttribute('height', '100')
      expect(svg).toHaveAttribute('width', '100')
    })
  })
})

describe('svgAttributesToProps', () => {
  it('should convert svg attributes to props', () => {
    const el = document.createElement('svg')
    el.setAttribute('class', 'test-class')
    el.setAttribute('for', 'test-for')
    el.setAttribute('viewBox', '0 0 100 100')
    el.setAttribute('tabindex', '1')
    el.setAttribute('readonly', 'true')
    el.setAttribute('maxlength', '10')
    el.setAttribute('contenteditable', 'true')
    el.setAttribute('crossorigin', 'use-credentials')

    const result = _svgAttributesToProps(el.attributes)

    expect(result).toEqual({
      className: 'test-class',
      htmlFor: 'test-for',
      viewBox: '0 0 100 100',
      tabIndex: '1',
      readOnly: 'true',
      maxLength: '10',
      contentEditable: 'true',
      crossOrigin: 'use-credentials',
    })
  })
})
