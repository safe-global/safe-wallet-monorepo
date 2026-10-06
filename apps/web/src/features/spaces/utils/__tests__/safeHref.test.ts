import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '../safeHref'

describe('buildSafeHref', () => {
  const address = '0x1234567890123456789012345678901234567890'

  it('builds a link to the given page with a prefixed safe param', () => {
    expect(buildSafeHref(AppRoutes.settings.setup, 'eth', address, null)).toEqual({
      pathname: AppRoutes.settings.setup,
      query: { safe: `eth:${address}` },
    })
  })

  it('keeps the Workspace in the link', () => {
    const spaceId = '11111111-1111-1111-1111-111111111111'

    expect(buildSafeHref(AppRoutes.settings.setup, 'eth', address, spaceId)).toEqual({
      pathname: AppRoutes.settings.setup,
      query: { safe: `eth:${address}`, spaceId },
    })
  })

  it('returns undefined when the chain has no short name', () => {
    expect(buildSafeHref(AppRoutes.settings.setup, undefined, address, null)).toBeUndefined()
    expect(buildSafeHref(AppRoutes.settings.setup, '', address, null)).toBeUndefined()
  })
})
