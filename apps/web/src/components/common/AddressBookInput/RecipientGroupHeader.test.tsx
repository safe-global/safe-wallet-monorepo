import { render, screen } from '@testing-library/react'
import { ContactSource } from '@/hooks/useAllAddressBooks'
import RecipientGroupHeader from './RecipientGroupHeader'

describe('RecipientGroupHeader', () => {
  it('renders the local contacts group with the count', () => {
    render(<RecipientGroupHeader source={ContactSource.local} count={3} />)

    expect(screen.getByTestId('contact-group-header')).toHaveTextContent('Local contacts')
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('renders the workspace name in the shared contacts group', () => {
    render(<RecipientGroupHeader source={ContactSource.space} workspaceName="Treasury ops" count={12} />)

    expect(screen.getByTestId('contact-group-header')).toHaveTextContent('Contacts ofTreasury ops')
    expect(screen.getByText('12')).toBeInTheDocument()
  })
})
