import { fireEvent, render, screen } from '@testing-library/react'
import { QueueGroupByMenu } from '../QueueGroupByMenu'

describe('QueueGroupByMenu', () => {
  it('names the current grouping on its button', () => {
    render(<QueueGroupByMenu value="next" onChange={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Group by Up next' })).toHaveTextContent('Group by: Up next')
  })

  it('offers every grouping and reports the one picked', () => {
    const onChange = jest.fn()
    render(<QueueGroupByMenu value="status" onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Group by Status' }))
    const options = screen.getAllByRole('menuitemradio')
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Network/ }))

    expect(options.map((option) => option.textContent)).toEqual([
      'StatusTransactions listed by order of urgency',
      'Up nextNext transaction on each Safe',
      'SafeGrouped by Safe, network and nonce order',
      'NetworkGrouped by network',
    ])
    expect(onChange).toHaveBeenCalledWith('network')
  })
})
