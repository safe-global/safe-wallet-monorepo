import { REMOTE_COMPONENTS } from './components'
import { allowRemoteUrlHosts, isAllowedUrl } from './html'

describe('REMOTE_COMPONENTS', () => {
  it('maps allowed elements to their own renderers', () => {
    const fallback = REMOTE_COMPONENTS.get('script')
    for (const element of ['h-div', 'h-button', 'h-svg', 'h-path', 'ui-slot', 'remote-fragment']) {
      expect(REMOTE_COMPONENTS.get(element)).not.toBe(fallback)
    }
  })

  it('renders nothing for elements outside the allowlist', () => {
    for (const element of ['script', 'iframe', 'style', 'object', 'embed', 'h-unknown', 'h-script']) {
      const Renderer = REMOTE_COMPONENTS.get(element) as () => null
      expect(Renderer()).toBeNull()
    }
  })
})

describe('isAllowedUrl', () => {
  it('allows same-origin and relative URLs', () => {
    expect(isAllowedUrl('/settings', 'href')).toBe(true)
    expect(isAllowedUrl(`${window.location.origin}/home`, 'href')).toBe(true)
  })

  it('allows https URLs on allowed hosts only', () => {
    expect(isAllowedUrl('https://help.safe.global/article', 'href')).toBe(true)
    expect(isAllowedUrl('https://evil.example/phish', 'href')).toBe(false)
    expect(isAllowedUrl('https://safe.global.evil.example/', 'href')).toBe(false)
    expect(isAllowedUrl('http://help.safe.global/', 'href')).toBe(false)
    expect(isAllowedUrl('https://etherscan.io/tx/0x2', 'href', new Set(['https://etherscan.io']))).toBe(true)
    expect(isAllowedUrl('https://evil.example/x', 'href', new Set(['https://etherscan.io']))).toBe(false)
    allowRemoteUrlHosts(['etherscan.io'])
    expect(isAllowedUrl('https://etherscan.io/address/0x1', 'href')).toBe(true)
  })

  it('rejects scripts and non-image data URLs', () => {
    expect(isAllowedUrl('javascript:alert(1)', 'href')).toBe(false)
    expect(isAllowedUrl('data:text/html,<script>', 'src')).toBe(false)
    expect(isAllowedUrl('data:image/png;base64,AAAA', 'src')).toBe(true)
    expect(isAllowedUrl('data:image/svg+xml;base64,AAAA', 'src')).toBe(false)
  })
})
