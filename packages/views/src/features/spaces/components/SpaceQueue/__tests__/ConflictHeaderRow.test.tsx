import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { render, screen } from '@/tests/test-utils'
import ConflictHeaderRow from '../ConflictHeaderRow'

const renderHeader = (size: number) =>
  render(
    <table>
      <tbody>
        <ConflictHeaderRow nonce={4} size={size} />
      </tbody>
    </table>,
  )

describe('ConflictHeaderRow', () => {
  it('says only one of the transactions sharing the nonce can execute', () => {
    renderHeader(3)

    expect(
      screen.getByText('Only 1/3 transactions can execute. Once it does, the others become invalid.'),
    ).toBeInTheDocument()
  })

  it('links to the help article on conflicting transactions', () => {
    renderHeader(2)

    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
      'href',
      HelpCenterArticle.CONFLICTING_TRANSACTIONS,
    )
  })
})
