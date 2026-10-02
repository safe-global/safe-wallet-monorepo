import { fireEvent } from '@testing-library/react'
import { render, screen } from '@/tests/test-utils'
import SecurityDrawerContent from './SecurityDrawerContent'

const renderContent = () =>
  render(<SecurityDrawerContent scanContext={null} results={{}} isComplete={false} lastScannedAt={null} />)

describe('SecurityDrawerContent', () => {
  it('selects the Checks tab by default', () => {
    renderContent()

    expect(screen.getByRole('tab', { name: 'Checks' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'false')
  })

  it('switches to the Details tab on click', () => {
    renderContent()

    fireEvent.click(screen.getByRole('tab', { name: 'Details' }))

    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Checks' })).toHaveAttribute('aria-selected', 'false')
  })
})
