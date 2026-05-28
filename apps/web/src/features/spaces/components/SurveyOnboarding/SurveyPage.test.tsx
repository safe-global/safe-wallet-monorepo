import { render, screen, waitFor } from '@testing-library/react'
import SurveyPage from '@/pages/welcome/survey'

const mockReplace = jest.fn()

let routerQuery: Record<string, string | undefined> = { spaceId: '42' }
let routerIsReady = true
let isFlagEnabled = true

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: routerQuery,
    isReady: routerIsReady,
    replace: mockReplace,
  }),
}))

jest.mock('@/config/constants', () => ({
  get BRAND_NAME() {
    return 'Safe{Wallet}'
  },
  get IS_SURVEY_ONBOARDING_ENABLED() {
    return isFlagEnabled
  },
}))

jest.mock('@/config/routes', () => ({
  AppRoutes: {
    welcome: { createSpace: '/welcome/create-space' },
    spaces: { index: '/spaces' },
  },
}))

jest.mock('@/features/__core__', () => ({
  useLoadFeature: () => ({
    SurveyOnboarding: () => <div data-testid="survey-onboarding" />,
  }),
}))

jest.mock('@/features/spaces', () => ({
  SpacesFeature: { name: 'spaces' },
}))

describe('SurveyPage (env flag gate)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    routerQuery = { spaceId: '42' }
    routerIsReady = true
    isFlagEnabled = true
  })

  it('renders SurveyOnboarding when the flag is enabled', () => {
    render(<SurveyPage />)
    expect(screen.getByTestId('survey-onboarding')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to the Space dashboard when the flag is off and spaceId is in the query', async () => {
    isFlagEnabled = false
    render(<SurveyPage />)

    expect(screen.queryByTestId('survey-onboarding')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: '42' } })
    })
  })

  it('redirects to create-space when the flag is off and spaceId is missing', async () => {
    isFlagEnabled = false
    routerQuery = {}
    render(<SurveyPage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/welcome/create-space' })
    })
  })

  it('does not redirect before the router is ready', () => {
    isFlagEnabled = false
    routerIsReady = false
    render(<SurveyPage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })
})
