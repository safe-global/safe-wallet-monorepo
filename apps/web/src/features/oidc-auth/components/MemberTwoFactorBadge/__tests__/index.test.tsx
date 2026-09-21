import { render, screen } from '@/tests/test-utils'
import { memberBuilder, memberUserBuilder } from '@/tests/builders/member'
import MemberTwoFactorBadge from '../index'

describe('MemberTwoFactorBadge', () => {
  it('shows an active badge for a member signed in with email or Google', () => {
    const member = memberBuilder()
      .with({ status: 'ACTIVE', user: memberUserBuilder().with({ email: 'alice@example.com' }).build() })
      .build()

    render(<MemberTwoFactorBadge member={member} />)

    expect(screen.getByTestId('member-2fa-badge')).toHaveTextContent('Active')
  })

  it('shows a wallet sign-in badge for a member without an email', () => {
    const member = memberBuilder()
      .with({ status: 'ACTIVE', user: memberUserBuilder().with({ email: null }).build() })
      .build()

    render(<MemberTwoFactorBadge member={member} />)

    expect(screen.getByTestId('member-2fa-badge')).toHaveTextContent('Wallet sign-in')
  })

  it('shows a pending badge for an invited member', () => {
    const member = memberBuilder()
      .with({
        status: 'INVITED',
        user: memberUserBuilder().with({ status: 'PENDING', email: 'bob@example.com' }).build(),
      })
      .build()

    render(<MemberTwoFactorBadge member={member} />)

    expect(screen.getByTestId('member-2fa-badge')).toHaveTextContent('Invite pending')
  })

  it('renders nothing for a declined invite', () => {
    const member = memberBuilder()
      .with({ status: 'DECLINED', user: memberUserBuilder().with({ status: 'PENDING' }).build() })
      .build()

    const { container } = render(<MemberTwoFactorBadge member={member} />)

    expect(container).toBeEmptyDOMElement()
  })
})
