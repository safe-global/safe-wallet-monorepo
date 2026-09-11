import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import NativeSwapsCard from './index'

jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { safe: 'eth:0x123' },
  }),
}))

describe('NativeSwapsCard', () => {
  it('renders as a shadcn Card with promo content', () => {
    render(<NativeSwapsCard onDismiss={jest.fn()} />)

    expect(screen.getByText('Native swaps are here!')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Try now' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: "Don't show" })).toBeInTheDocument()

    const card = screen.getByText('Native swaps are here!').closest('[data-slot="card"]')
    expect(card).toHaveAttribute('data-size', 'none')
  })

  it('calls onDismiss when the user opts out', async () => {
    const onDismiss = jest.fn()
    render(<NativeSwapsCard onDismiss={onDismiss} />)

    await userEvent.click(screen.getByRole('button', { name: "Don't show" }))

    expect(onDismiss).toHaveBeenCalled()
  })
})
