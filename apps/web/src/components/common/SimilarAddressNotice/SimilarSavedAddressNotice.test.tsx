import { faker } from '@faker-js/faker'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { SimilarSavedAddressNotice } from '.'

describe('SimilarSavedAddressNotice', () => {
  const enteredAddress = fakerChecksummedAddress()
  const savedAddress = fakerChecksummedAddress()

  it('names the saved contact and says it is in the address book', () => {
    const name = faker.person.fullName()

    render(
      <SimilarSavedAddressNotice
        subject="This address"
        enteredAddress={enteredAddress}
        similar={{ address: savedAddress, name, source: 'addressBook' }}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(`This address is similar to ${name} in your address book.`)
  })

  it('shows the shortened address of an unnamed Safe in my accounts', () => {
    render(
      <SimilarSavedAddressNotice
        subject="This Safe account"
        enteredAddress={enteredAddress}
        similar={{ address: savedAddress, source: 'accounts' }}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      `This Safe account is similar to ${shortenAddress(savedAddress)} in your accounts.`,
    )
  })
})
