import { faker } from '@faker-js/faker'
import { render, screen } from '@testing-library/react'
import ContactCell from '../ContactCell'

describe('ContactCell', () => {
  it('marks a local contact', () => {
    render(<ContactCell name="Treasury" address={faker.finance.ethereumAddress()} isLocal />)

    expect(screen.getByText('Treasury')).toBeInTheDocument()
    expect(screen.getByLabelText('Local contact')).toBeInTheDocument()
  })

  it('does not mark a workspace contact as local', () => {
    render(<ContactCell name="Treasury" address={faker.finance.ethereumAddress()} />)

    expect(screen.queryByLabelText('Local contact')).not.toBeInTheDocument()
  })
})
