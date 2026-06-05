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
    WORKSPACE_CREATED: { action: 'Workspace created', category: 'spaces' },
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
  useSpacesCreateV1Mutation: () => [mockCreateSpaceWithUser],
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

  it('tracks WORKSPACE_CREATED with spaceId sent to both GA (label) and Mixpanel (additionalParameters) after successful creation', async () => {
    mockCreateSpaceWithUser.mockResolvedValue({
      data: { id: 99, uuid: '11111111-1111-1111-1111-111111111111', name: 'My Space' },
    })

    render(<SpaceCreationModal onClose={jest.fn()} />)

    fireEvent.change(screen.getByTestId('space-name-input'), { target: { value: 'My Space' } })

    const submitButton = screen.getByTestId('create-space-modal-button')
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled()
    })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(trackEvent).toHaveBeenCalledWith(
        { ...SPACE_EVENTS.WORKSPACE_CREATED, label: '11111111-1111-1111-1111-111111111111' },
        { workspace_id: '11111111-1111-1111-1111-111111111111' },
      )
    })
  })

  it('does not track WORKSPACE_CREATED when the API returns an error', async () => {
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
        expect.objectContaining({ action: SPACE_EVENTS.WORKSPACE_CREATED.action }),
        expect.anything(),
      )
    })
  })
})
