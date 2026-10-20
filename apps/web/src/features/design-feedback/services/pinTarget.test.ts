import {
  buildPinLink,
  cssPath,
  describeTarget,
  findByCssPath,
  parsePin,
  parsePinIssue,
  resolvePinTarget,
} from './pinTarget'

const render = (html: string) => {
  document.body.innerHTML = html
}

describe('cssPath', () => {
  it('finds the same element again', () => {
    render('<main><ul><li>One</li><li><button>Two</button></li></ul></main>')
    const button = document.querySelector('button')!
    const path = cssPath(button)
    expect(path).toBe('main > ul > li:nth-of-type(2) > button')
    expect(findByCssPath(path)).toBe(button)
  })

  it('stops at a stable id but ignores generated ones', () => {
    render('<div id="proposal-signers"><div id="base-ui-r1"><span>Ana</span></div></div>')
    expect(cssPath(document.querySelector('span')!)).toBe('#proposal-signers > div > span')
  })

  it('returns null for a path that no longer matches', () => {
    expect(findByCssPath('section > ::invalid')).toBeNull()
  })
})

describe('describeTarget', () => {
  it('names the element area, the control and the row transaction', () => {
    render(`
      <section data-prototype-element="Table"><table><tbody><tr>
        <td><button aria-label="Open Send to Tailspin Labs">Send</button></td>
        <td><span id="target">2/3</span></td>
      </tr></tbody></table></section>`)
    expect(describeTarget(document.getElementById('target')!)).toEqual({
      where: 'Table › "2/3" cell',
      row: 'Send to Tailspin Labs',
    })
  })

  it('prefers the accessible name of a button', () => {
    render(
      '<div data-prototype-element="Filters"><button aria-label="Ready to sign, 4"><span>icon</span></button></div>',
    )
    expect(describeTarget(document.querySelector('span')!).where).toBe('Filters › "Ready to sign, 4" button')
  })
})

describe('resolvePinTarget', () => {
  it('looks through the drawer scrim and the comment layer', () => {
    render('<div data-pin-layer><span>marker</span></div><div data-slot="sheet-overlay"></div><p>Row</p>')
    const [layer, scrim, row] = [
      document.querySelector('span')!,
      document.querySelector('[data-slot]')!,
      document.querySelector('p')!,
    ]
    document.elementsFromPoint = jest.fn(() => [layer, scrim, row, document.body])
    row.getBoundingClientRect = () => ({ left: 100, top: 50, width: 200, height: 40 }) as DOMRect

    expect(resolvePinTarget(150, 60)).toEqual({ element: row, x: 25, y: 25 })
  })
})

describe('pin links', () => {
  it('round-trips the pin and sets the open transaction and theme', () => {
    const link = buildPinLink(
      'https://preview.test/prototypes/pending-queue?scenario=realistic',
      { path: 'main > ul > li:nth-of-type(2)', x: 12.5, y: 80 },
      { tx: 'treasury-42', theme: 'dark' },
    )
    const url = new URL(link)
    expect(url.searchParams.get('scenario')).toBe('realistic')
    expect(url.searchParams.get('tx')).toBe('treasury-42')
    expect(url.searchParams.get('theme')).toBe('dark')
    expect(parsePin(url.search)).toEqual({ path: 'main > ul > li:nth-of-type(2)', x: 12.5, y: 80 })
  })

  it('ignores a malformed pin', () => {
    expect(parsePin('?pin=nonsense')).toBeNull()
  })

  it('reads the Linear issue added after triage, and ignores anything else', () => {
    expect(parsePinIssue('?pin=1:2@main&issue=DES-201')).toBe('DES-201')
    expect(parsePinIssue('?issue=javascript:alert(1)')).toBeUndefined()
  })
})
