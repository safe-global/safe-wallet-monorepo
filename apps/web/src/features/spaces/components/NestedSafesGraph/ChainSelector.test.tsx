import { render, screen, renderWithUserEvent } from '@/tests/test-utils'
import ChainSelector from './ChainSelector'

const chains = [
  { chainId: '1', chainName: 'Ethereum', count: 5 },
  { chainId: '137', chainName: 'Polygon', count: 2 },
]

describe('ChainSelector', () => {
  it('shows the selected chain with its count', () => {
    render(<ChainSelector chains={chains} value="1" onChange={jest.fn()} />)
    expect(screen.getByText('Ethereum (5)')).toBeInTheDocument()
  })

  it('calls onChange when another chain is picked', async () => {
    const onChange = jest.fn()
    const { user } = renderWithUserEvent(<ChainSelector chains={chains} value="1" onChange={onChange} />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByText('Polygon (2)'))
    expect(onChange).toHaveBeenCalledWith('137')
  })
})
