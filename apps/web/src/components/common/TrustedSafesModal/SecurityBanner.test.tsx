import { render, screen } from '@/tests/test-utils'
import SecurityBanner from './SecurityBanner'

describe('SecurityBanner', () => {
  it('renders the optional title', () => {
    render(<SecurityBanner title="Verify before you trust" />)
    expect(screen.getByText('Verify before you trust')).toBeInTheDocument()
  })

  it('renders the impersonation warning copy with a "Learn more" link', () => {
    render(<SecurityBanner title="Verify before you trust" />)

    expect(
      screen.getByText(
        /Some Safe accounts may be malicious or impersonations\. Only trust Safe accounts you can verify\./,
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Learn more')).toBeInTheDocument()
  })
})
