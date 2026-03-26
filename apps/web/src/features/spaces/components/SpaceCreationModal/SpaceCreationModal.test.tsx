import type * as ReactHookForm from 'react-hook-form'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { trackEvent } from '@/services/analytics'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import SpaceCreationModal from './index'

const mockPush = jest.fn()
const mockDispatch = jest.fn()
const mockCreateSpaceWithUser = jest.fn()

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
}))

jest.mock('@/services/analytics/events/spaces', () => ({
  SPACE_EVENTS: {
    CREATE_SPACE: { action: 'Submit space creation', category: 'spaces' },
  },
  SPACE_LABELS: {},
}))

jest.mock('next/router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/store/notificationsSlice', () => ({
  showNotification: (payload: unknown) => ({ type: 'notifications/show', payload }),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  useSpacesCreateWithUserV1Mutation: () => [mockCreateSpaceWithUser],
}))

jest.mock('@/components/common/NameInput', () => ({
  __esModule: true,
  default: ({ name, label }: { name: string; label: string }) => {
    const rhf = jest.requireActual('react-hook-form') as typeof ReactHookForm
    const { register } = rhf.useFormContext()
    return <input aria-label={label} {...register(name, { required: true })} data-testid="space-name-input" />
  },
}))

jest.mock('@/components/common/ModalDialog', () => ({
  __esModule: true,
  default: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
}))

jest.mock('@/components/common/ExternalLink', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}))

jest.mock('@/config/routes', () => ({
  AppRoutes: { spaces: { index: '/spaces' }, privacy: '/privacy' },
}))

describe('SpaceCreationModal tracking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks CREATE_SPACE with spaceId sent to both GA (label) and Mixpanel (additionalParameters) after successful creation', async () => {
    mockCreateSpaceWithUser.mockResolvedValue({ data: { id: 99, name: 'My Space' } })

    render(<SpaceCreationModal onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('space-name-input'), { target: { value: 'My Space' } })

    const submitButton = screen.getByTestId('create-space-modal-button')
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        { ...SPACE_EVENTS.CREATE_SPACE, label: '99' }, // GA receives spaceId as label
        { spaceId: '99' }, // Mixpanel receives spaceId as additionalParameters
      )
    })
  })

  it('does not track CREATE_SPACE when the API returns an error', async () => {
    mockCreateSpaceWithUser.mockResolvedValue({ error: { status: 500 } })

    render(<SpaceCreationModal onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('space-name-input'), { target: { value: 'My Space' } })

    const submitButton = screen.getByTestId('create-space-modal-button')
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(trackEvent).not.toHaveBeenCalledWith(
        expect.objectContaining({ action: SPACE_EVENTS.CREATE_SPACE.action }),
        expect.anything(),
      )
    })
  })
})
