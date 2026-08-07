import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EmailInfo from '@/components/common/EmailInfo'
import { faker } from '@faker-js/faker'

describe('EmailInfo', () => {
  it.each([
    ['empty string', ''],
    ['whitespace only', '   '],
    ['tabs and newlines', '\t\n '],
  ])('renders nothing when email is %s', (_, email) => {
    const { container } = render(<EmailInfo email={email} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the email and avatar when email is non-empty', () => {
    const email = faker.internet.email()
    const { getByText } = render(<EmailInfo email={email} />)
    expect(getByText(email)).toBeInTheDocument()
  })

  it('renders the email with tooltip on hover when showTooltip is true', async () => {
    const email = faker.internet.email()
    const { getByText, findByRole } = render(<EmailInfo email={email} showTooltip />)

    await userEvent.hover(getByText(email))

    const tooltip = await findByRole('tooltip')
    expect(tooltip).toHaveTextContent(email)
  })
})
