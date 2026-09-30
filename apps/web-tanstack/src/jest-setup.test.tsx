import { render, screen } from '@testing-library/react'

// Smoke test verifying the Jest toolchain: TSX transform, jsdom, and jest-dom.
const Hello = ({ name }: { name: string }) => <span>Hello {name}</span>

describe('jest setup', () => {
  it('renders a TSX component into jsdom', () => {
    render(<Hello name="Safe" />)
    expect(screen.getByText('Hello Safe')).toBeInTheDocument()
  })
})
