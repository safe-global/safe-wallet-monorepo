import { AppRoutes } from '@/config/routes'
import { spacesMainNavigation, spacesSetupGroup } from '../index'

/**
 * These assertions run against the real config rather than a mock. The rest of the sidebar suite
 * mocks `../../config`, so a nav entry added to the wrong module renders nowhere while every test
 * stays green — which is exactly how the Policies entry was missed.
 */
describe('spacesMainNavigation', () => {
  const hrefs = spacesMainNavigation.map((item) => item.href)

  it('exposes the Policies entry on the policies route', () => {
    const policies = spacesMainNavigation.find((item) => item.label === 'Policies')

    expect(policies).toBeDefined()
    expect(policies?.href).toBe(AppRoutes.spaces.policies)
  })

  it('restricts Policies to active members', () => {
    expect(spacesMainNavigation.find((item) => item.label === 'Policies')?.activeMemberOnly).toBe(true)
  })

  // AC A1: the slot is "between Address book and Activity", confirmed against the Figma empty state.
  it('slots Policies between Address book and Activity', () => {
    expect(hrefs.indexOf(AppRoutes.spaces.policies)).toBe(hrefs.indexOf(AppRoutes.spaces.addressBook) + 1)
    expect(hrefs.indexOf(AppRoutes.spaces.activity)).toBe(hrefs.indexOf(AppRoutes.spaces.policies) + 1)
  })

  it('keeps every flag-gated entry reachable from a single nav module', () => {
    const gated = [AppRoutes.spaces.policies, AppRoutes.spaces.activity, AppRoutes.spaces.security]
    const allHrefs = [...hrefs, ...spacesSetupGroup.items.map((item) => item.href)]

    gated.forEach((href) => expect(allHrefs).toContain(href))
  })
})
