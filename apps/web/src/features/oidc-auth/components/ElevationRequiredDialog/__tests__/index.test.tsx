import { fireEvent, render, screen } from '@/tests/test-utils'
import ElevationRequiredDialog from '../index'

const mockStepUpWithRedirect = jest.fn()

jest.mock('../../../hooks/useStepUp', () => ({
  useStepUp: () => ({ stepUpWithRedirect: mockStepUpWithRedirect }),
}))

const mockClearPendingStepUpAction = jest.fn()

jest.mock('../../../utils/stepUpReplay', () => ({
  clearPendingStepUpAction: () => mockClearPendingStepUpAction(),
}))

const elevationRequired = { initialReduxState: { elevation: { isRequired: true } } }

describe('ElevationRequiredDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders nothing while no elevation is required', () => {
    const { container } = render(<ElevationRequiredDialog />, {
      initialReduxState: { elevation: { isRequired: false } },
    })

    expect(container).toBeEmptyDOMElement()
  })

  it('prompts for a second factor once elevation is required', () => {
    render(<ElevationRequiredDialog />, elevationRequired)

    expect(screen.getByText("Verify it's you")).toBeInTheDocument()
    expect(screen.getByTestId('elevation-verify-btn')).toBeInTheDocument()
  })

  it('starts the step-up round-trip on confirm', () => {
    render(<ElevationRequiredDialog />, elevationRequired)

    fireEvent.click(screen.getByTestId('elevation-verify-btn'))

    expect(mockStepUpWithRedirect).toHaveBeenCalledTimes(1)
  })

  it('does not redirect when the prompt is dismissed', () => {
    render(<ElevationRequiredDialog />, elevationRequired)

    fireEvent.click(screen.getByTestId('elevation-cancel-btn'))

    expect(mockStepUpWithRedirect).not.toHaveBeenCalled()
    expect(screen.queryByText("Verify it's you")).not.toBeInTheDocument()
  })

  it('abandons the interrupted action when dismissed', () => {
    render(<ElevationRequiredDialog />, elevationRequired)

    fireEvent.click(screen.getByTestId('elevation-cancel-btn'))

    expect(mockClearPendingStepUpAction).toHaveBeenCalled()
  })
})
