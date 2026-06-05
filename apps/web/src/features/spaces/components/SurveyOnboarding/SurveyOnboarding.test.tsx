import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { SurveyStateDto } from '@safe-global/store/gateway/AUTO_GENERATED/surveys'
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
  surveyResponse: null,
}

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: routerQuery,
    isReady: routerIsReady,
    replace: mockReplace,
    push: mockPush,
  }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/surveys', () => ({
  useSurveysGetStateV1Query: () => queryResult,
  useSurveysSubmitResponseV1Mutation: () => [mockSubmit, mutationState],
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesGetOneV1Query: () => ({ data: undefined }),
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

jest.mock('@/features/spaces/components/OnboardingLayout', () => ({
  OnboardingLayout: ({ main, footer }: { main: React.ReactNode; footer?: React.ReactNode }) => (
    <div>
      {main}
      {footer}
    </div>
  ),
  StepCounter: () => <div data-testid="step-counter" />,
  SafeAppMockup: () => <div data-testid="safe-app-mockup" />,
  deriveSidePanelAccountsFromSpace: () => [],
  useSafeNameLookup: () => new Map<string, string>(),
}))

jest.mock('@/hooks/safes', () => ({
  flattenSafeItems: () => [],
  isMultiChainSafeItem: () => false,
}))

jest.mock('@/features/spaces/hooks/useSpaceSafes', () => ({
  useSpaceSafes: () => ({ allSafes: [], isLoading: false, isError: false, error: undefined, refetch: jest.fn() }),
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
    expect(screen.getByRole('button', { name: 'Run payments' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Hold assets' })).toBeInTheDocument()
  })

  it('keeps the Create Workspace button disabled until at least one chip is selected', () => {
    render(<SurveyOnboarding />)

    const finish = screen.getByTestId('survey-finish-button')
    expect(finish).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Run payments' }))

    expect(finish).not.toBeDisabled()
  })

  it('deselects a chip when clicked a second time', () => {
    render(<SurveyOnboarding />)

    const chip = screen.getByRole('button', { name: 'Run payments' })
    const finish = screen.getByTestId('survey-finish-button')

    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(finish).not.toBeDisabled()

    fireEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    expect(finish).toBeDisabled()
  })

  it('renders the loading spinner while the survey state query is in flight', () => {
    setQueryResult({ isLoading: true })

    render(<SurveyOnboarding />)

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Run payments' })).not.toBeInTheDocument()
  })

  it('submits selections nested under the page id (sorted) and routes to the Space dashboard', async () => {
    render(<SurveyOnboarding />)

    fireEvent.click(screen.getByRole('button', { name: 'Run payments' }))
    fireEvent.click(screen.getByRole('button', { name: 'Hold assets' }))
    fireEvent.click(screen.getByTestId('survey-finish-button'))

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        spaceId: 42,
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

    fireEvent.click(screen.getByRole('button', { name: 'Run payments' }))
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
