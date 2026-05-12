import { spacesMainNavigation } from '../index'
import { AppRoutes } from '@/config/routes'

describe('spacesMainNavigation', () => {
  it('includes a Policies entry pointing at the spaces policies route', () => {
    const policies = spacesMainNavigation.find((item) => item.label === 'Policies')

    expect(policies).toBeDefined()
    expect(policies?.href).toBe(AppRoutes.spaces.policies)
  })
})
