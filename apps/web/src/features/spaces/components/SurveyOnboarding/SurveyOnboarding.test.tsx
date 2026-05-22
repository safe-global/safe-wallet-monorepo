import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { SurveyStateDto } from '@safe-global/store/gateway/surveys'
import SurveyOnboarding from '.'

const mockReplace = jest.fn()
const mockPush = jest.fn()
const mockSubmit = jest.fn()
const mockUnwrap = jest.fn()

let routerQuery: Record<string, string | undefined> = { spaceId: '42' }
let routerIsReady = true
let queryResult: {
  data: SurveyStateDto | undefined
  isLoading: boolean
  error: unknown
} = { data: undefined, isLoading: false, error: undefined }
let mutationState: { isLoading: boolean; error: unknown } = { isLoading: false, error: undefined }

const surveyFixture: SurveyStateDto = {
  survey: {
    id: 1,
    slug: 'onboarding',
    version: 1,
    title: 'Space Onboarding Survey',
    subtitle: null,
    surveyContent: {
      pages: [
        {
          id: 'use_cases',
          title: 'How will you use Safe?',
          subtitle: 'Select all that apply.',
          multiSelect: true,
          options: [
            { key: 'run_payments', label: 'Run payments', icon: 'cash' },
            { key: 'hold_assets', label: 'Hold assets', icon: 'bank' },
          ],
        },
      ],
    },
  },
  spaceResponse: null,
}

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: routerQuery,
    isReady: routerIsReady,
    replace: mockReplace,
    push: mockPush,
  }),
}))

jest.mock('@safe-global/store/gateway/surveys', () => ({
  useSurveysGetStateV1Query: () => queryResult,
  useSurveysSubmitResponseV1Mutation: () => [mockSubmit, mutationState],
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => false,
}))

jest.mock('@/config/routes', () => ({
  AppRoutes: {
    welcome: {
      createSpace: '/welcome/create-space',
      inviteMembers: '/welcome/invite-members',
    },
    spaces: { index: '/spaces' },
  },
}))

function setQueryResult(result: Partial<typeof queryResult>): void {
  queryResult = { data: undefined, isLoading: false, error: undefined, ...result }
}

describe('SurveyOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    routerQuery = { spaceId: '42' }
    routerIsReady = true
    setQueryResult({ data: surveyFixture })
    mutationState = { isLoading: false, error: undefined }
    mockSubmit.mockReturnValue({ unwrap: mockUnwrap })
    mockUnwrap.mockResolvedValue({})
  })

  it('renders the active survey page with all options when data is loaded', () => {
    render(<SurveyOnboarding />)

    expect(screen.getByText('How will you use Safe?')).toBeInTheDocument()
    expect(screen.getByText('Run payments')).toBeInTheDocument()
    expect(screen.getByText('Hold assets')).toBeInTheDocument()
  })

  it('keeps the Finish button disabled until at least one card is selected', () => {
    render(<SurveyOnboarding />)

    const finish = screen.getByTestId('survey-finish-button')
    expect(finish).toBeDisabled()

    fireEvent.click(screen.getByText('Run payments').closest('[role="checkbox"]')!)

    expect(finish).not.toBeDisabled()
  })

  it('deselects a card when clicked a second time', () => {
    render(<SurveyOnboarding />)

    const card = screen.getByText('Run payments').closest('[role="checkbox"]')!
    const finish = screen.getByTestId('survey-finish-button')

    fireEvent.click(card)
    expect(card).toHaveAttribute('aria-checked', 'true')
    expect(finish).not.toBeDisabled()

    fireEvent.click(card)
    expect(card).toHaveAttribute('aria-checked', 'false')
    expect(finish).toBeDisabled()
  })

  it('renders the loading spinner while the survey state query is in flight', () => {
    setQueryResult({ isLoading: true })

    render(<SurveyOnboarding />)

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.queryByText('Run payments')).not.toBeInTheDocument()
  })

  it('submits selections nested under the page id (sorted) and routes to the Space dashboard', async () => {
    render(<SurveyOnboarding />)

    fireEvent.click(screen.getByText('Run payments').closest('[role="checkbox"]')!)
    fireEvent.click(screen.getByText('Hold assets').closest('[role="checkbox"]')!)
    fireEvent.click(screen.getByTestId('survey-finish-button'))

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        spaceId: '42',
        slug: 'onboarding',
        submitSurveyResponseDto: {
          // Selections are sorted alphabetically before submit so the same set
          // always serialises to the same array.
          selections: { use_cases: ['hold_assets', 'run_payments'] },
        },
      })
    })

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/spaces',
        query: { spaceId: '42' },
      })
    })
  })

  it('shows the submit-error alert and does not navigate when the mutation rejects', async () => {
    mutationState = { isLoading: false, error: { status: 500, data: { message: 'boom' } } }
    mockUnwrap.mockRejectedValue(new Error('boom'))

    render(<SurveyOnboarding />)

    fireEvent.click(screen.getByText('Run payments').closest('[role="checkbox"]')!)
    fireEvent.click(screen.getByTestId('survey-finish-button'))

    await waitFor(() => {
      expect(screen.getByText('Failed to submit. Please try again.')).toBeInTheDocument()
    })
    expect(mockPush).not.toHaveBeenCalled()
  })

  it('silently redirects to the Space dashboard when the state endpoint returns 404 (survey turned off)', async () => {
    setQueryResult({ error: { status: 404, data: { message: 'not found' } } })

    render(<SurveyOnboarding />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/spaces',
        query: { spaceId: '42' },
      })
    })
    expect(screen.queryByText('Failed to load survey. Please refresh.')).not.toBeInTheDocument()
  })

  it('shows the destructive alert for non-404 errors instead of redirecting', () => {
    setQueryResult({ error: { status: 500, data: { message: 'kaboom' } } })

    render(<SurveyOnboarding />)

    expect(screen.getByText('Failed to load survey. Please refresh.')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to create-space when spaceId is missing from the query', async () => {
    routerQuery = {}

    render(<SurveyOnboarding />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({ pathname: '/welcome/create-space' })
    })
  })
})
