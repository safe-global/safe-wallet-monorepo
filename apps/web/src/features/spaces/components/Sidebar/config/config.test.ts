import { spacesMainNavigation } from './index'
import { AppRoutes } from '@/config/routes'

describe('spacesMainNavigation', () => {
  it('includes the Nested safes entry pointing at the nested-safes route', () => {
    const item = spacesMainNavigation.find((navItem) => navItem.label === 'Nested safes')
    expect(item).toBeDefined()
    expect(item?.href).toBe(AppRoutes.spaces.nestedSafes)
  })
})
