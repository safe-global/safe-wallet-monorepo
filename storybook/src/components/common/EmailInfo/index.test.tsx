import { render, screen } from '@testing-library/react'
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
    // The email appears both in the trigger and the tooltip, so the trigger is
    // located via the avatar's sibling span and the tooltip via its data-slot.
    const { getAllByText } = render(<EmailInfo email={email} showTooltip />)

    await userEvent.hover(getAllByText(email)[0])

    // Base UI tooltips are portal-rendered with data-slot="tooltip-content"
    // (no role="tooltip"), so query the content by its slot.
    const tooltip = await screen.findByText(email, { selector: '[data-slot="tooltip-content"]' })
    expect(tooltip).toHaveTextContent(email)
  })
})
