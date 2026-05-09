import { faker } from '@faker-js/faker'
import type { NextRouter } from 'next/router'

import { render } from '@/tests/test-utils'
import { _FeatureWrapper } from '@/components/wrappers/FeatureWrapper'
import type * as useChains from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const mockRouter = {
  replace: jest.fn(),
} as jest.MockedObjectDeep<NextRouter>
const mockUseHasFeature: jest.MockedFn<(typeof useChains)['useHasFeature']> = jest.fn()

describe('FeatureWrapper', () => {
  beforeEach(() => {
    jest.resetAllMocks()

    jest.spyOn(require('next/navigation'), 'useRouter').mockReturnValue(mockRouter)
    jest.spyOn(require('@/hooks/useChains'), 'default').mockReturnValue(mockUseHasFeature)
  })

  it('should render the children if the feature is enabled', () => {
    mockUseHasFeature.mockReturnValue(true)

    const { queryByText } = render(
      <_FeatureWrapper
        feature={faker.helpers.objectValue(FEATURES)}
        fallbackRoute="/test"
        isFeatureEnabled={mockUseHasFeature}
      >
        <>Feature enabled</>
      </_FeatureWrapper>,
    )

    expect(queryByText('Feature enabled')).toBeTruthy()
    expect(mockRouter.replace).not.toHaveBeenCalled()
  })

  it('should replace the current route if the feature is disabled', () => {
    const route = '/test'
    mockUseHasFeature.mockReturnValue(false)

    const { queryByText } = render(
      <_FeatureWrapper
        feature={faker.helpers.objectValue(FEATURES)}
        fallbackRoute={route}
        isFeatureEnabled={mockUseHasFeature}
      >
        <>Feature enabled</>
      </_FeatureWrapper>,
    )

    expect(queryByText('Feature enabled')).toBeNull()
    expect(mockRouter.replace).toHaveBeenCalledWith(route)
  })

  it('should not render anything if the enabled features are loading', () => {
    mockUseHasFeature.mockReturnValue(undefined)

    const { queryByText } = render(
      <_FeatureWrapper
        feature={faker.helpers.objectValue(FEATURES)}
        fallbackRoute="/test"
        isFeatureEnabled={mockUseHasFeature}
      >
        <>Feature enabled</>
      </_FeatureWrapper>,
    )

    expect(queryByText('Feature enabled')).toBeNull()
    expect(mockRouter.replace).not.toHaveBeenCalled()
  })
})
