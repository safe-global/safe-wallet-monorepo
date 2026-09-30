import { AppRoutes } from '@/config/routes'
import { buildSafeHref } from '../safeHref'

describe('buildSafeHref', () => {
  const address = '0x1234567890123456789012345678901234567890'

  it('builds a link to the given page with a prefixed safe param', () => {
    expect(buildSafeHref(AppRoutes.settings.setup, 'eth', address)).toEqual({
      pathname: AppRoutes.settings.setup,
      query: { safe: `eth:${address}` },
    })
  })

  it('returns undefined when the chain has no short name', () => {
    expect(buildSafeHref(AppRoutes.settings.setup, undefined, address)).toBeUndefined()
    expect(buildSafeHref(AppRoutes.settings.setup, '', address)).toBeUndefined()
  })
})
