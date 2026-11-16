import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import CreateSpaceOnboarding from './index'
import { DISALLOWED_CHARACTER_MESSAGE } from '@safe-global/utils/validation/names'
import { SPACE_NAME_MAX_LENGTH } from '@/features/spaces/constants'

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

const mockGoToSelectSafes = jest.fn()
let mockCreatedSpaceId: string | undefined
jest.mock('./hooks/useSpaceSubmit', () => ({
  __esModule: true,
  default: () => ({
    error: undefined,
    isSubmitting: false,
    onSubmit: jest.fn(),
    createdSpaceId: mockCreatedSpaceId,
    goToSelectSafes: mockGoToSelectSafes,
  }),
}))

const mockPush = jest.fn()
jest.mock('next/router', () => ({ useRouter: () => ({ push: mockPush, query: {} }) }))

const mockUseWorkspaceLock = jest.fn()
jest.mock('../../hooks/useWorkspaceLock', () => ({
  useWorkspaceLock: (spaceId?: string | null) => mockUseWorkspaceLock(spaceId),
}))
jest.mock('../Plans/ClaimTrialModal', () => ({
  __esModule: true,
  default: ({
    spaceId,
    variant,
    returnPathname,
    onBack,
  }: {
    spaceId: string
    variant?: string
    returnPathname?: string
    onBack: () => void
  }) => (
    <div data-testid="claim-trial-modal" data-space={spaceId} data-variant={variant} data-return={returnPathname}>
      <button onClick={onBack}>decline</button>
    </div>
  ),
}))

jest.mock('../../hooks/useSpaceSafes', () => ({
  useSpaceSafes: () => ({ allSafes: [] }),
}))

jest.mock('../../hooks/useOnboardingStepCount', () => ({
  useOnboardingStepCount: () => 2,
}))

jest.mock('../OnboardingLayout', () => ({
  OnboardingLayout: ({ main, footer }: { main: React.ReactNode; footer: React.ReactNode }) => (
    <div>
      {main}
      {footer}
    </div>
  ),
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
    mockCreatedSpaceId = undefined
    mockUseWorkspaceLock.mockReturnValue({ isLocked: true, isResolving: false, reason: 'trial-offered' })
  })

  it('offers the trial over the step once the Workspace exists; declining leaves for My accounts', () => {
    mockCreatedSpaceId = 'space-new'
    render(<CreateSpaceOnboarding />)

    expect(mockUseWorkspaceLock).toHaveBeenCalledWith('space-new')
    expect(screen.getByTestId('claim-trial-modal')).toHaveAttribute('data-space', 'space-new')
    expect(screen.getByTestId('claim-trial-modal')).toHaveAttribute('data-return', '/welcome/select-safes')
    expect(screen.getByTestId('claim-trial-modal')).toHaveAttribute('data-variant', 'new')
    expect(mockGoToSelectSafes).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'decline' }))
    expect(mockPush).toHaveBeenCalledWith('/welcome/accounts')
    expect(mockGoToSelectSafes).not.toHaveBeenCalled()
  })

  it('moves straight to the Safes step when the new Workspace is offered no trial', () => {
    mockCreatedSpaceId = 'space-new'
    mockUseWorkspaceLock.mockReturnValue({ isLocked: false, isResolving: false, reason: 'lapsed' })
    render(<CreateSpaceOnboarding />)

    expect(screen.queryByTestId('claim-trial-modal')).not.toBeInTheDocument()
    expect(mockGoToSelectSafes).toHaveBeenCalledWith('space-new')
  })

  it('waits for the offer to resolve before deciding', () => {
    mockCreatedSpaceId = 'space-new'
    mockUseWorkspaceLock.mockReturnValue({ isLocked: false, isResolving: true, reason: 'trial-offered' })
    render(<CreateSpaceOnboarding />)

    expect(screen.queryByTestId('claim-trial-modal')).not.toBeInTheDocument()
    expect(mockGoToSelectSafes).not.toHaveBeenCalled()
  })

  it('stays on the step and offers a retry when the trial offer cannot be read', () => {
    mockCreatedSpaceId = 'space-new'
    const retry = jest.fn()
    mockUseWorkspaceLock.mockReturnValue({
      isLocked: false,
      isResolving: false,
      isError: true,
      reason: 'lapsed',
      retry,
    })
    render(<CreateSpaceOnboarding />)

    expect(mockGoToSelectSafes).not.toHaveBeenCalled()
    expect(screen.queryByTestId('claim-trial-modal')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalled()
  })

  it('keeps Next and the name field locked once the Workspace is created, so it is never created twice', () => {
    mockCreatedSpaceId = 'space-new'
    mockUseWorkspaceLock.mockReturnValue({ isLocked: false, isResolving: true, reason: 'trial-offered' })
    render(<CreateSpaceOnboarding />)

    expect(screen.getByTestId('create-space-onboarding-continue-button')).toBeDisabled()
    expect(screen.getByTestId('space-name-input')).toBeDisabled()
  })

  it('shows no trial offer before the Workspace is created', () => {
    render(<CreateSpaceOnboarding />)

    expect(screen.queryByTestId('claim-trial-modal')).not.toBeInTheDocument()
    expect(mockUseWorkspaceLock).toHaveBeenCalledWith(null)
    expect(mockGoToSelectSafes).not.toHaveBeenCalled()
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

  it('shows the disallowed-character error for invalid characters', async () => {
    render(<CreateSpaceOnboarding />)

    const input = screen.getByTestId('space-name-input')
    fireEvent.change(input, { target: { value: 'Bad*name' } })

    await waitFor(() => {
      expect(screen.getByText(DISALLOWED_CHARACTER_MESSAGE)).toBeInTheDocument()
    })
    expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  it('enforces the maximum length', async () => {
    render(<CreateSpaceOnboarding />)

    fireEvent.change(screen.getByTestId('space-name-input'), {
      target: { value: 'a'.repeat(SPACE_NAME_MAX_LENGTH + 1) },
    })

    await waitFor(() => {
      expect(screen.getByText(`Names must be at most ${SPACE_NAME_MAX_LENGTH} characters long`)).toBeInTheDocument()
    })
  })

  it('sanitizes the value on blur', async () => {
    render(<CreateSpaceOnboarding />)

    const input = screen.getByTestId('space-name-input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '  O’Brien  ' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(input.value).toBe("O'Brien")
    })
  })

  it('accepts a valid UTF-8 name', async () => {
    render(<CreateSpaceOnboarding />)

    const input = screen.getByTestId('space-name-input')
    fireEvent.change(input, { target: { value: 'José' } })

    await waitFor(() => {
      expect(input).not.toHaveAttribute('aria-invalid')
    })
    expect(screen.queryByText(DISALLOWED_CHARACTER_MESSAGE)).not.toBeInTheDocument()
  })
})
