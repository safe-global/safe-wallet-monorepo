import type { ReactNode } from 'react'
import { render } from '@/tests/test-utils'
import MessagesPage from '@/pages/transactions/messages'
import { AppRoutes } from '@/config/routes'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { chainBuilder } from '@/tests/builders/chains'

const mockReplace = jest.fn()
jest.mock('next/router', () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

const mockUseCurrentChain = jest.fn()
jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => mockUseCurrentChain(),
}))

jest.mock('@/components/safe-messages/PaginatedMsgs', () => ({
  __esModule: true,
  default: () => <div data-testid="paginated-msgs" />,
}))
jest.mock('@/components/transactions/TxHeader', () => ({
  __esModule: true,
  default: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}))
jest.mock('@/components/transactions/SignedMessagesHelpLink', () => ({
  __esModule: true,
  default: () => <div />,
}))

describe('MessagesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not redirect while the chains config is still loading (chain === undefined)', () => {
    mockUseCurrentChain.mockReturnValue(undefined)

    render(<MessagesPage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('does not redirect when the chain supports EIP1271', () => {
    mockUseCurrentChain.mockReturnValue(
      chainBuilder()
        .with({ features: [FEATURES.EIP1271] })
        .build(),
    )

    render(<MessagesPage />)

    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('redirects to history when the chain is loaded but lacks EIP1271', () => {
    mockUseCurrentChain.mockReturnValue(chainBuilder().with({ features: [] }).build())

    render(<MessagesPage />)

    expect(mockReplace).toHaveBeenCalledWith(expect.objectContaining({ pathname: AppRoutes.transactions.history }))
  })
})
