import { render, screen } from '@testing-library/react'
import SafeInfoDisplay from '../SafeInfoDisplay'

const baseProps = {
  name: 'My Safe',
  address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
}

describe('SafeInfoDisplay', () => {
  it('renders the threshold badge on the avatar when threshold and owners are provided', () => {
    render(<SafeInfoDisplay {...baseProps} threshold={2} owners={3} />)
    expect(screen.getByTestId('safe-selector-threshold')).toHaveTextContent('2/3')
  })

  it('does not render the threshold badge when threshold/owners are omitted', () => {
    render(<SafeInfoDisplay {...baseProps} />)
    expect(screen.queryByTestId('safe-selector-threshold')).not.toBeInTheDocument()
  })

  it('does not render the threshold badge when threshold or owners is 0', () => {
    render(<SafeInfoDisplay {...baseProps} threshold={0} owners={0} />)
    expect(screen.queryByTestId('safe-selector-threshold')).not.toBeInTheDocument()
  })

  it('renders the name and a copy button on the address line', () => {
    render(<SafeInfoDisplay {...baseProps} />)
    expect(screen.getByText('My Safe')).toBeInTheDocument()
    expect(screen.getByTestId('safe-item-copy-address')).toBeInTheDocument()
  })
})
