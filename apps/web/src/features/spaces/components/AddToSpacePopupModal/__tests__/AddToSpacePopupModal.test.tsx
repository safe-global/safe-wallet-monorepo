import { render, screen, fireEvent } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { AddToSpacePopupModal } from '../AddToSpacePopupModal'
import { AppRoutes } from '@/config/routes'

const mockPush = jest.fn()
let mockRouterQuery: Record<string, string> = {}

jest.mock('next/router', () => ({
  useRouter: () => ({ query: mockRouterQuery, push: mockPush }),
}))

jest.mock('@/hooks/useSafeAddressFromUrl', () => ({
  useSafeQueryParam: () => {
    const safe = mockRouterQuery.safe
    return typeof safe === 'string' ? safe : ''
  },
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className }: { children: ReactNode; className?: string }) => (
    <button type="button" className={className}>
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/typography', () => ({
  Typography: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}))

jest.mock('@/components/ui/dialog', () => ({
  DialogClose: ({
    children,
    'aria-label': ariaLabel,
    onClick,
    render: renderProp,
  }: {
    children: ReactNode
    'aria-label'?: string
    onClick?: () => void
    render?: ReactElement
  }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {renderProp ? null : null}
      {children}
    </button>
  ),
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

describe('AddToSpacePopupModal', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRouterQuery = {}
  })

  it('renders the "Add to Space" title', () => {
    render(<AddToSpacePopupModal />)

    expect(screen.getByText('Add to workspace')).toBeInTheDocument()
  })

  it('renders all three benefit items', () => {
    render(<AddToSpacePopupModal />)

    expect(screen.getByText('Keep all related Safes in one shared workspace')).toBeInTheDocument()
    expect(screen.getByText('Give teams shared context around transactions and activity')).toBeInTheDocument()
    expect(screen.getByText('Streamline coordination across initiators, approvers, and executors')).toBeInTheDocument()
  })

  it('renders a close button', () => {
    render(<AddToSpacePopupModal />)

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('navigates to createSpace with safe query param when "Create a Space" is clicked', () => {
    mockRouterQuery = { safe: '1:0xdeadbeef' }
    render(<AddToSpacePopupModal />)

    fireEvent.click(screen.getByRole('button', { name: /Create a workspace/i }))

    expect(mockPush).toHaveBeenCalledWith({
      pathname: AppRoutes.spaces.createSpace,
      query: { safe: '1:0xdeadbeef' },
    })
  })
})
