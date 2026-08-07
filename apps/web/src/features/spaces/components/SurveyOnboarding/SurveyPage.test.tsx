import { render, screen, waitFor } from '@testing-library/react'
import SurveyPage from '@/pages/welcome/survey'

const mockReplace = jest.fn()

let routerQuery: Record<string, string | undefined> = { spaceId: '42' }
let routerIsReady = true
let surveyEnabled: boolean | undefined = true

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: routerQuery,
    isReady: routerIsReady,
    replace: mockReplace,
  }),
}))

jest.mock('@/hooks/useIsSurveyEnabled', () => ({
  __esModule: true,
  default: () => surveyEnabled,
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

describe('SurveyPage (chains-config flag gate)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    routerQuery = { spaceId: '42' }
    routerIsReady = true
    surveyEnabled = true
  })

  it('renders SurveyOnboarding when the flag is enabled', () => {
    render(<SurveyPage />)
    expect(screen.getByTestId('survey-onboarding')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to the Space dashboard when the flag is off and spaceId is in the query', async () => {
    surveyEnabled = false
    render(<SurveyPage />)

    expect(screen.queryByTestId('survey-onboarding')).not.toBeInTheDocument()
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/spaces', query: { spaceId: '42' } })
    })
  })

  it('redirects to create-space when the flag is off and spaceId is missing', async () => {
    surveyEnabled = false
    routerQuery = {}
    render(<SurveyPage />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/welcome/create-space' })
    })
  })

  it('does not redirect while the chains config is still loading (hook returns undefined)', () => {
    surveyEnabled = undefined
    render(<SurveyPage />)

    expect(screen.queryByTestId('survey-onboarding')).not.toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('does not redirect before the router is ready', () => {
    surveyEnabled = false
    routerIsReady = false
    render(<SurveyPage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })
})
