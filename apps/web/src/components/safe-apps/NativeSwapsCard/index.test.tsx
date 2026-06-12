import { render, screen } from '@/tests/test-utils'
import NativeSwapsCard from './index'

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { safe: 'eth:0x123' },
  }),
}))

jest.mock('@/features/swap', () => ({
  useIsSwapFeatureEnabled: () => true,
}))

jest.mock('@/services/local-storage/useLocalStorage', () => ({
  __esModule: true,
  default: () => [true, jest.fn()],
}))

describe('NativeSwapsCard', () => {
  it('renders as a shadcn Card with promo content', () => {
    render(<NativeSwapsCard />)

    expect(screen.getByText('Native swaps are here!')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Try now' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: "Don't show" })).toBeInTheDocument()

    const card = screen.getByText('Native swaps are here!').closest('[data-slot="card"]')
    expect(card).toHaveClass('border-0')
  })
})
