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
