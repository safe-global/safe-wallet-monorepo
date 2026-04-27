import { render, screen, fireEvent } from '@testing-library/react'
import type { ComponentProps } from 'react'
import type * as SpacesModule from '@/features/spaces'
import type { SpacesFeedbackPopup as SpacesFeedbackPopupComponent } from '../SpacesFeedbackPopup'
import { SpacesFeedbackPopupContainer } from '../SpacesFeedbackPopupContainer'

const DISMISSED_KEY = 'spacesFeedbackPopupDismissed'
const SETUP_DISMISSED_KEY = 'setupWidgetDismissed'

type PopupProps = ComponentProps<typeof SpacesFeedbackPopupComponent>

const mockSetDismissed = jest.fn()
let mockDismissed: boolean | undefined = undefined
let mockSetupDismissed: Record<string, number> | undefined = undefined

jest.mock('@/services/local-storage/useLocalStorage', () => ({
  __esModule: true,
  default: jest.fn((key: string) => {
    if (key === 'spacesFeedbackPopupDismissed') return [mockDismissed, mockSetDismissed]
    if (key === 'setupWidgetDismissed') return [mockSetupDismissed, jest.fn()]
    return [undefined, jest.fn()]
  }),
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: jest.fn(() => '1'),
  useSpaceMembersByStatus: jest.fn(() => ({ activeMembers: [], invitedMembers: [] })),
}))

jest.mock('../SpacesFeedbackPopup', () => ({
  SpacesFeedbackPopup: (props: PopupProps) => (
    <div data-testid="feedback-popup" data-cta-href={props.ctaHref}>
      <button data-testid="popup-close" onClick={props.onClose}>
        close
      </button>
    </div>
  ),
}))

const mockMembers = (active: number, invited: number) => {
  const { useSpaceMembersByStatus } = jest.requireMock<typeof SpacesModule>('@/features/spaces')
  ;(useSpaceMembersByStatus as jest.Mock).mockReturnValue({
    activeMembers: new Array(active).fill({}),
    invitedMembers: new Array(invited).fill({}),
  })
}

const mockSpaceId = (id: string | undefined) => {
  const { useCurrentSpaceId } = jest.requireMock<typeof SpacesModule>('@/features/spaces')
  ;(useCurrentSpaceId as jest.Mock).mockReturnValue(id)
}

describe('SpacesFeedbackPopupContainer', () => {
  beforeEach(() => {
    mockSetDismissed.mockClear()
    mockDismissed = undefined
    mockSetupDismissed = undefined
    mockSpaceId('1')
    mockMembers(1, 0)
  })

  it('does not render when the space has only the creator and setup is not dismissed', () => {
    mockMembers(1, 0)
    mockSetupDismissed = {}

    render(<SpacesFeedbackPopupContainer />)

    expect(screen.queryByTestId('feedback-popup')).not.toBeInTheDocument()
  })

  it('renders when the space has more than one member (active + invited > 1)', () => {
    mockMembers(2, 0)

    render(<SpacesFeedbackPopupContainer />)

    expect(screen.getByTestId('feedback-popup')).toBeInTheDocument()
  })

  it('renders when the space has invited members on top of the creator', () => {
    mockMembers(1, 1)

    render(<SpacesFeedbackPopupContainer />)

    expect(screen.getByTestId('feedback-popup')).toBeInTheDocument()
  })

  it('renders when the SetupWidget has been dismissed for the current space and the entry has not expired', () => {
    mockMembers(1, 0)
    mockSetupDismissed = { '1': Date.now() + 60_000 }

    render(<SpacesFeedbackPopupContainer />)

    expect(screen.getByTestId('feedback-popup')).toBeInTheDocument()
  })

  it('does not render when the SetupWidget dismissal for the current space has expired', () => {
    mockMembers(1, 0)
    mockSetupDismissed = { '1': Date.now() - 60_000 }

    render(<SpacesFeedbackPopupContainer />)

    expect(screen.queryByTestId('feedback-popup')).not.toBeInTheDocument()
  })

  it('does not render when the SetupWidget dismissal belongs to a different space', () => {
    mockMembers(1, 0)
    mockSetupDismissed = { '2': Date.now() + 60_000 }

    render(<SpacesFeedbackPopupContainer />)

    expect(screen.queryByTestId('feedback-popup')).not.toBeInTheDocument()
  })

  it('does not render when the popup has been globally dismissed, even if triggers are active', () => {
    mockMembers(5, 0)
    mockDismissed = true

    render(<SpacesFeedbackPopupContainer />)

    expect(screen.queryByTestId('feedback-popup')).not.toBeInTheDocument()
  })

  it('passes the Calendly URL to the popup', () => {
    mockMembers(2, 0)

    render(<SpacesFeedbackPopupContainer />)

    expect(screen.getByTestId('feedback-popup')).toHaveAttribute('data-cta-href', 'https://calendly.com/iva-safe/30min')
  })

  it('persists the global dismissal when the popup close handler fires', () => {
    mockMembers(2, 0)

    render(<SpacesFeedbackPopupContainer />)

    fireEvent.click(screen.getByTestId('popup-close'))

    expect(mockSetDismissed).toHaveBeenCalledWith(true)
  })

  it('uses the right localStorage keys', () => {
    mockMembers(2, 0)

    const useLocalStorage = jest.requireMock<{ default: jest.Mock }>('@/services/local-storage/useLocalStorage').default

    render(<SpacesFeedbackPopupContainer />)

    const keysUsed = useLocalStorage.mock.calls.map((call: unknown[]) => call[0])
    expect(keysUsed).toContain(DISMISSED_KEY)
    expect(keysUsed).toContain(SETUP_DISMISSED_KEY)
  })
})
