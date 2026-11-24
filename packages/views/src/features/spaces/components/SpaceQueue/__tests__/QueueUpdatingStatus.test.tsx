import { render, screen } from '@testing-library/react'
import QueueUpdatingStatus from '../QueueUpdatingStatus'

describe('QueueUpdatingStatus', () => {
  it('says the results are updating while the queue is stale', () => {
    render(<QueueUpdatingStatus isStale />)

    expect(screen.getByRole('status')).toHaveTextContent('Updating results…')
  })

  it('stays in the page, empty, once the queue is current', () => {
    render(<QueueUpdatingStatus isStale={false} />)

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
  })
})
