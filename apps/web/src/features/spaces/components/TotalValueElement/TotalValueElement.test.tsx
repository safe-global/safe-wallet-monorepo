import { render } from '@testing-library/react'
import { TotalValueElement } from './TotalValueElement'

describe('TotalValueElement', () => {
  it('renders the value', () => {
    const { getByText } = render(<TotalValueElement value="$100.00" />)
    expect(getByText('$100.00')).toBeInTheDocument()
  })

  it('shows the error subtitle when error is set', () => {
    const { getByText } = render(<TotalValueElement value="--" error />)
    expect(getByText(/couldn't load your balance/i)).toBeInTheDocument()
  })

  it('does not show the error subtitle without error', () => {
    const { queryByText } = render(<TotalValueElement value="$100.00" />)
    expect(queryByText(/couldn't load your balance/i)).not.toBeInTheDocument()
  })
})
