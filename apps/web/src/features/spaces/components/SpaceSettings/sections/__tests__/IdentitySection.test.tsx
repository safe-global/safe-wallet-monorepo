import { fireEvent, waitFor, screen, render as rtlRender } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import IdentitySection from '../IdentitySection'
import { spaceBuilder } from '@/tests/builders/space'
import { DISALLOWED_CHARACTER_MESSAGE } from '@safe-global/utils/validation/names'
import { SPACE_NAME_MAX_LENGTH } from '@/features/spaces/constants'

const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'

const mockUnwrap = jest.fn()
const mockUpdateSpace = jest.fn(() => ({ unwrap: mockUnwrap }))
const mockUseIsAdmin = jest.fn()

jest.mock('@/features/spaces', () => ({
  useIsAdmin: jest.fn(() => mockUseIsAdmin()),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesUpdateV1Mutation: jest.fn(() => [mockUpdateSpace, { isLoading: false }]),
}))

const renderWithStore = (ui: React.ReactElement) => {
  const store = makeStore(undefined, { skipBroadcast: true })
  const result = rtlRender(ui, {
    wrapper: ({ children }: { children: React.ReactNode }) => <Provider store={store}>{children}</Provider>,
  })
  return { ...result, store }
}

describe('IdentitySection', () => {
  const mockSpace = spaceBuilder().with({ uuid: MOCK_SPACE_UUID, name: 'Test Space', members: [] }).build()

  const setup = (isAdmin: boolean) => {
    mockUseIsAdmin.mockReturnValue(isAdmin)
    return renderWithStore(<IdentitySection space={mockSpace} />)
  }

  const getInput = () => screen.getByTestId('space-name-input') as HTMLInputElement
  const getSaveButton = () => screen.getByTestId('space-save-button')

  beforeEach(() => {
    jest.clearAllMocks()
    mockUnwrap.mockReset()
    mockUseIsAdmin.mockReset()
  })

  it('sanitizes the value on blur', async () => {
    setup(true)

    const input = getInput()
    fireEvent.change(input, { target: { value: '  O’Brien  ' } })
    fireEvent.blur(input)

    await waitFor(() => {
      expect(input.value).toBe("O'Brien")
    })
  })

  it('shows the disallowed-character error for invalid characters', async () => {
    setup(true)

    fireEvent.change(getInput(), { target: { value: 'Alice*~' } })

    await waitFor(() => {
      expect(screen.getByText(DISALLOWED_CHARACTER_MESSAGE)).toBeInTheDocument()
    })
  })

  it('enforces the minimum length', async () => {
    setup(true)

    fireEvent.change(getInput(), { target: { value: 'Jo' } })

    await waitFor(() => {
      expect(screen.getByText('Names must be at least 3 character(s) long')).toBeInTheDocument()
    })
    expect(getSaveButton()).toBeDisabled()
  })

  it('enforces the maximum length', async () => {
    setup(true)

    fireEvent.change(getInput(), { target: { value: 'a'.repeat(SPACE_NAME_MAX_LENGTH + 1) } })

    await waitFor(() => {
      expect(screen.getByText(`Names must be at most ${SPACE_NAME_MAX_LENGTH} characters long`)).toBeInTheDocument()
    })
    expect(getSaveButton()).toBeDisabled()
  })

  it('keeps Save disabled while the name is invalid', async () => {
    setup(true)

    fireEvent.change(getInput(), { target: { value: 'Bad*name' } })

    await waitFor(() => {
      expect(getSaveButton()).toBeDisabled()
    })
  })

  it('sends the sanitized name to the mutation on save', async () => {
    mockUnwrap.mockResolvedValue({})
    setup(true)

    fireEvent.change(getInput(), { target: { value: '  New Name  ' } })

    await waitFor(() => {
      expect(getSaveButton()).not.toBeDisabled()
    })
    fireEvent.click(getSaveButton())

    await waitFor(() => {
      expect(mockUpdateSpace).toHaveBeenCalledWith({
        id: MOCK_SPACE_UUID,
        updateSpaceDto: { name: 'New Name' },
      })
    })
  })

  it('does not show a validation error for the pristine saved name', () => {
    setup(true)

    expect(getInput().value).toBe('Test Space')
    expect(screen.queryByText(DISALLOWED_CHARACTER_MESSAGE)).not.toBeInTheDocument()
  })
})
