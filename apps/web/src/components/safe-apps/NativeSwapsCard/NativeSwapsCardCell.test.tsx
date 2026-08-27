import { render, screen } from '@/tests/test-utils'
import NativeSwapsCardCell from './NativeSwapsCardCell'
import { useNativeSwapsCard } from './useNativeSwapsCard'

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { safe: 'eth:0x123' },
  }),
}))

jest.mock('./useNativeSwapsCard', () => ({
  useNativeSwapsCard: jest.fn(),
}))

const mockUseNativeSwapsCard = useNativeSwapsCard as jest.MockedFunction<typeof useNativeSwapsCard>

describe('NativeSwapsCardCell', () => {
  it('wraps the card in a list item when visible', () => {
    mockUseNativeSwapsCard.mockReturnValue({ isVisible: true, dismiss: jest.fn() })

    const { container } = render(<NativeSwapsCardCell />)

    expect(screen.getByText('Native swaps are here!')).toBeInTheDocument()
    expect(container.querySelector('li')).toBeInTheDocument()
  })

  it('renders no list item at all once dismissed', () => {
    mockUseNativeSwapsCard.mockReturnValue({ isVisible: false, dismiss: jest.fn() })

    const { container } = render(<NativeSwapsCardCell />)

    expect(screen.queryByText('Native swaps are here!')).not.toBeInTheDocument()
    expect(container.querySelector('li')).not.toBeInTheDocument()
  })
})
