import { getSidebarVariant, SafeSidebarContent, SpacesSidebarContent } from '../variants'

describe('getSidebarVariant', () => {
  it('returns SafeSidebarContent when type is "safe"', () => {
    const variant = getSidebarVariant('safe')
    expect(variant).toBe(SafeSidebarContent)
  })

  it('returns SpacesSidebarContent when type is "spaces"', () => {
    const variant = getSidebarVariant('spaces')
    expect(variant).toBe(SpacesSidebarContent)
  })
})
