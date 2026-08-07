import { render } from '@/tests/test-utils'
import { screen } from '@testing-library/react'

import NavTabs from '@/components/common/NavTabs'
import { AppRoutes } from '@/config/routes'

const tabs = [
  { label: 'Tokens', href: AppRoutes.balances.index },
  { label: 'NFTs', href: AppRoutes.balances.nfts },
]

describe('NavTabs', () => {
  it('renders nothing while the tabs are still loading', () => {
    const { container } = render(<NavTabs tabs={[]} />, { routerProps: { pathname: AppRoutes.balances.nfts } })

    expect(container).toBeEmptyDOMElement()
  })

  it('marks the tab matching the route as selected when tabs arrive after mount', () => {
    const { rerender } = render(<NavTabs tabs={[]} />, { routerProps: { pathname: AppRoutes.balances.nfts } })

    rerender(<NavTabs tabs={tabs} />)

    expect(screen.getByRole('tab', { name: 'NFTs' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Tokens' })).toHaveAttribute('aria-selected', 'false')
  })

  it('falls back to the first tab when the route matches no tab', () => {
    render(<NavTabs tabs={tabs} />, { routerProps: { pathname: '/unknown' } })

    expect(screen.getByRole('tab', { name: 'Tokens' })).toHaveAttribute('aria-selected', 'true')
  })
})
