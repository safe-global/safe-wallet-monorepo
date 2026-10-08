import type { ReactElement, ReactNode } from 'react'
import { render, screen } from '@/tests/test-utils'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import SafeIdentity from '../components/SafeIdentity'

// Render the tooltip primitives inline so the wired content is assertable without a portal.
jest.mock('@/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ render: element, children }: { render?: ReactElement; children?: ReactNode }) => (
    <>
      {element}
      {children}
    </>
  ),
  TooltipContent: ({ children }: { children: ReactNode }) => <span data-testid="tooltip-content">{children}</span>,
}))

const ADDRESS = '0x9fC3dc011b461664c835F2527fffb1169b3C213e'

describe('SafeIdentity', () => {
  it('shows the address shortened, the way the frame does', () => {
    render(<SafeIdentity address={ADDRESS} name="Treasury" />)

    expect(screen.getByTestId('safe-account-address')).toHaveTextContent(shortenAddress(ADDRESS))
  })

  it('reveals the whole address in its tooltip, not the shortened form again', () => {
    render(<SafeIdentity address={ADDRESS} name="Treasury" />)

    const revealed = screen.getAllByTestId('tooltip-content').map((node) => node.textContent)

    expect(revealed).toContain(ADDRESS)
  })

  it('ellipsizes the address, so a narrow row cannot paint it over the stat columns', () => {
    render(<SafeIdentity address={ADDRESS} name="Treasury" />)

    expect(screen.getByTestId('safe-account-address')).toHaveClass('truncate', 'max-w-full')
  })
})
