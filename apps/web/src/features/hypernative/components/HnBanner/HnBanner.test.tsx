import { render, screen } from '@/tests/test-utils'
import HnBanner from './HnBanner'

describe('HnBanner', () => {
  it('renders title and CTA', () => {
    render(<HnBanner onDismiss={() => {}} href="#" />)

    expect(screen.getByText('Strengthen your Safe')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Learn more' })).toBeInTheDocument()
  })
})
