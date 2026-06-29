import { render, screen, waitFor } from '@testing-library/react'
import CreateSpaceOnboarding from './index'

let mockIsCheckingAccess: boolean | undefined = false
let mockExistingSpace: {
  spaceId: string | undefined
  isEditMode: boolean
  isSpaceLoading: boolean
  existingSpace: { name: string } | undefined
} = { spaceId: undefined, isEditMode: false, isSpaceLoading: false, existingSpace: undefined }

jest.mock('@/hooks/useRouterGuard', () => ({
  useIsCheckingAccess: () => mockIsCheckingAccess,
}))

jest.mock('./hooks/useExistingSpace', () => ({
  __esModule: true,
  default: () => mockExistingSpace,
}))

jest.mock('./hooks/useOnboardingExit', () => ({
  __esModule: true,
  default: () => ({ onExit: jest.fn(), hasNoSpaces: false }),
}))

jest.mock('./hooks/useSpaceSubmit', () => ({
  __esModule: true,
  default: () => ({ error: undefined, isSubmitting: false, onSubmit: jest.fn() }),
}))

jest.mock('../../hooks/useSpaceSafes', () => ({
  useSpaceSafes: () => ({ allSafes: [] }),
}))

jest.mock('../../hooks/useOnboardingStepCount', () => ({
  useOnboardingStepCount: () => 2,
}))

jest.mock('../OnboardingLayout', () => ({
  OnboardingLayout: ({ main }: { main: React.ReactNode }) => <div>{main}</div>,
  StepCounter: () => null,
  SafeAppMockup: () => null,
  deriveSidePanelAccountsFromSpace: () => [],
  useSafeNameLookup: () => ({}),
}))

jest.mock('@/hooks/safes', () => ({
  flattenSafeItems: () => [],
}))

describe('CreateSpaceOnboarding', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsCheckingAccess = false
    mockExistingSpace = { spaceId: undefined, isEditMode: false, isSpaceLoading: false, existingSpace: undefined }
  })

  it('focuses the workspace name input on load in create mode', async () => {
    render(<CreateSpaceOnboarding />)

    await waitFor(() => expect(screen.getByTestId('space-name-input')).toHaveFocus())
  })

  it('focuses the input once access checking finishes', async () => {
    mockIsCheckingAccess = true
    const { rerender } = render(<CreateSpaceOnboarding />)

    expect(screen.getByTestId('space-name-input')).not.toHaveFocus()

    mockIsCheckingAccess = false
    rerender(<CreateSpaceOnboarding />)

    await waitFor(() => expect(screen.getByTestId('space-name-input')).toHaveFocus())
  })

  it('does not focus the input in edit mode', async () => {
    mockExistingSpace = {
      spaceId: '1',
      isEditMode: true,
      isSpaceLoading: false,
      existingSpace: { name: 'Existing' },
    }
    render(<CreateSpaceOnboarding />)

    await waitFor(() => expect(screen.getByTestId('space-name-input')).not.toHaveFocus())
  })
})
