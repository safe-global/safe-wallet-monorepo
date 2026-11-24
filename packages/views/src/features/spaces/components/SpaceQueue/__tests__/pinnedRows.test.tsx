import type { ReactElement } from 'react'
import { render, screen, within } from '@testing-library/react'
import { Table, TableBody } from '@safe-global/views/components/ui/table'
import { QUEUE_ROW_LABEL } from '../columns'
import ChainHeaderRow from '../ChainHeaderRow'
import CollapseAllButton from '../CollapseAllButton'
import ConflictHeaderRow from '../ConflictHeaderRow'
import QueueGroupRow from '../QueueGroupRow'
import SafeBandRow from '../SafeBandRow'

const chain = { chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }

const renderRow = (row: ReactElement) =>
  render(
    <Table>
      <TableBody>{row}</TableBody>
    </Table>,
  )

describe('queue rows while the table scrolls sideways', () => {
  it.each([
    [
      'Safe band',
      <SafeBandRow key="safe" safeAddress="0x1" title="Treasury" collapsed={false} summary="" onToggle={jest.fn()} />,
    ],
    ['group band', <QueueGroupRow key="group" label="Next in line" count={2} collapsed={false} onToggle={jest.fn()} />],
    ['chain header', <ChainHeaderRow key="chain" chain={chain} collapsed={false} onToggle={jest.fn()} />],
    ['conflict header', <ConflictHeaderRow key="conflict" nonce={57} size={2} />],
  ])('pins the %s first cell and keeps its label beside it', (_, row) => {
    renderRow(row)

    const [first, label] = screen.getAllByRole('cell')
    expect(first).toHaveAttribute('data-pin', 'start')
    expect(label).not.toHaveAttribute('data-pin')
    expect(label.firstElementChild).toHaveClass(...QUEUE_ROW_LABEL.split(' '))
    expect(label.firstElementChild).not.toHaveClass('sticky')
  })

  it('wraps the conflict explanation instead of widening the table, the nonce beside its first line', () => {
    renderRow(<ConflictHeaderRow nonce={57} size={2} />)

    const [nonce, label] = screen.getAllByRole('cell')
    expect(nonce).toHaveClass('align-top')
    expect(label).toHaveClass('whitespace-normal')
    expect(label).not.toHaveClass('whitespace-nowrap')
    expect(label.firstElementChild).toHaveClass('flex-wrap')
    expect(within(label).getByText('Learn more')).toBeInTheDocument()
  })
})

describe('CollapseAllButton', () => {
  it('shows its label on hover by default', () => {
    render(<CollapseAllButton allCollapsed={false} count={2} onToggle={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Collapse all' })).toHaveTextContent('Collapse 2 Safes')
  })

  it('takes the label out when icon only, keeping the accessible name', () => {
    render(<CollapseAllButton allCollapsed count={2} unit={['network', 'networks']} onToggle={jest.fn()} iconOnly />)

    const button = screen.getByRole('button', { name: 'Expand all' })
    expect(button).toHaveTextContent('')
    expect(button.querySelector('svg')).toBeInTheDocument()
  })
})
