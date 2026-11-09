import {
  imageFormat,
  imageUrls,
  isMirroredImage,
  localMirrorUrl,
  mirrorPath,
} from '../../../apps/web/.storybook/mockAssetUrls'

describe('isMirroredImage', () => {
  it.each([
    'https://safe-transaction-assets.safe.global/chains/1/chain_logo.png',
    'https://cdn.zerion.io/0x6b175474e89094c44da98b954eedeac495271d0f.PNG',
    'https://protocol-icons.s3.amazonaws.com/icons/aave-pool-v3.jpg',
    'https://assets.coingecko.com/coins/images/279/small/ethereum',
  ])('mirrors %s', (url) => {
    expect(isMirroredImage(new URL(url))).toBe(true)
  })

  it.each([
    ['a non-image URL', 'https://safe-client.safe.global/v1/chains'],
    ['plain http', 'http://cdn.zerion.io/logo.png'],
    ['a host stories use to show a broken image', 'https://example.com/logo.png'],
    ['a host that no longer exists', 'https://via.placeholder.com/26.png'],
    ['an SVG, which could run script on the origin that serves it', 'https://cdn.zerion.io/logo.svg'],
  ])('skips %s', (_, url) => {
    expect(isMirroredImage(new URL(url))).toBe(false)
  })
})

describe('mirrorPath', () => {
  it('maps host and path to a file path and drops the query', () => {
    expect(mirrorPath(new URL('https://assets.coingecko.com/coins/images/279/small/eth.png?1696501628'))).toBe(
      'assets.coingecko.com/coins/images/279/small/eth.png',
    )
  })

  it('decodes the path so the file name matches what the static server looks up', () => {
    expect(mirrorPath(new URL('https://cdn.zerion.io/my%20token.png'))).toBe('cdn.zerion.io/my token.png')
  })
})

describe('localMirrorUrl', () => {
  it('points a mirrorable image at the same-origin mirror, keeping the path encoded for the static server', () => {
    expect(localMirrorUrl('https://assets.coingecko.com/coins/images/32882/small/WETH_%281%29.png?1699716492')).toBe(
      '/mock-assets/assets.coingecko.com/coins/images/32882/small/WETH_%281%29.png',
    )
  })

  it.each([
    ['a local path', '/images/common/token-placeholder.svg'],
    ['a host stories use to show a broken image', 'https://example.com/logo.png'],
    ['an empty string', ''],
  ])('leaves %s unchanged', (_, src) => {
    expect(localMirrorUrl(src)).toBe(src)
  })
})

describe('imageUrls', () => {
  it('keeps one URL per mirror path, sorted, and drops everything else', () => {
    const urls = imageUrls([
      'https://cdn.zerion.io/b.png?v=2',
      'https://cdn.zerion.io/b.png?v=1',
      'https://cdn.zerion.io/a.png',
      'https://example.com/logo.png',
      'https://safe-client.safe.global/v1/chains',
      'not a url',
    ])

    expect(urls).toEqual(['https://cdn.zerion.io/a.png', 'https://cdn.zerion.io/b.png?v=2'])
  })

  it.each([
    ['dot-dot segments behind encoded slashes', 'https://cdn.zerion.io/a%2F..%2F..%2F..%2Fscripts%2Fx.png'],
    ['an encoded dot segment', 'https://cdn.zerion.io/a%2F.%2Fx.png'],
    ['an encoded backslash', 'https://cdn.zerion.io/a%5C..%5Cx.png'],
  ])('drops a URL whose decoded path could leave the mirror: %s', (_, url) => {
    expect(imageUrls([url])).toEqual([])
  })
})

describe('imageFormat', () => {
  const bytes = (...values: Array<number | string>) =>
    Uint8Array.from(values.flatMap((v) => (typeof v === 'string' ? [...v].map((c) => c.charCodeAt(0)) : [v])))

  it.each([
    ['png', bytes(0x89, 'PNG', 0x0d, 0x0a, 0x1a, 0x0a, 0)],
    ['jpeg', bytes(0xff, 0xd8, 0xff, 0xe0)],
    ['gif', bytes('GIF89a')],
    ['webp', bytes('RIFF', 0, 0, 0, 0, 'WEBPVP8 ')],
  ])('recognises %s by its first bytes', (format, data) => {
    expect(imageFormat(data)).toBe(format)
  })

  it.each([
    ['an SVG', bytes('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')],
    ['an HTML error page', bytes('<!doctype html><html>')],
    ['an empty file', bytes()],
  ])('rejects %s', (_, data) => {
    expect(imageFormat(data)).toBeUndefined()
  })
})
