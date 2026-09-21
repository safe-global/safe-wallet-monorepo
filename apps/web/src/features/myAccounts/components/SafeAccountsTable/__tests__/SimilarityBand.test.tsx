import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { bandHeaderAt, SimilarityWarningIcon } from '../SimilarityBand'
import type { SimilarWarning } from '@/features/address-poisoning'

describe('bandHeaderAt', () => {
  const clusters =
    (byIndex: Record<number, string | undefined>) =>
    (index: number): string | undefined =>
      byIndex[index]

  it('returns null when the row is not in a cluster', () => {
    expect(bandHeaderAt(0, clusters({}), 3)).toBeNull()
    expect(bandHeaderAt(1, clusters({ 0: 'c1' }), 3)).toBeNull()
  })

  it('opens a band at the first row of a cluster run, including index 0', () => {
    expect(bandHeaderAt(0, clusters({ 0: 'c1' }), 3)).not.toBeNull()
    expect(bandHeaderAt(2, clusters({ 2: 'c1' }), 3)).not.toBeNull()
  })

  it('does not reopen the band while the same cluster continues', () => {
    expect(bandHeaderAt(1, clusters({ 0: 'c1', 1: 'c1' }), 3)).toBeNull()
  })

  it('opens a new band where an adjacent row belongs to a different cluster', () => {
    const header = bandHeaderAt(1, clusters({ 0: 'c1', 1: 'c2' }), 3)
    expect(header).not.toBeNull()
    expect(header?.key).toBe('band-c2')
  })
})

describe('SimilarityWarningIcon', () => {
  const warning = (over: Partial<SimilarWarning>): SimilarWarning => ({ trusted: [], owned: [], ...over })
  const icon = () => screen.getByLabelText('Possible address poisoning')

  it('lists only the non-empty peer section', async () => {
    render(<SimilarityWarningIcon warning={warning({ owned: ['0xdead'] })} />)

    await userEvent.hover(icon())
    expect(await screen.findByText('Similar accounts from owned safes:')).toBeInTheDocument()
    expect(screen.queryByText('Similar accounts from trusted safes:')).not.toBeInTheDocument()
    expect(screen.getByText('0xdead')).toBeInTheDocument()
  })

  it('lists both sections when the cluster spans both lists', async () => {
    render(<SimilarityWarningIcon warning={warning({ trusted: ['0xbeef'], owned: ['0xdead'] })} />)

    await userEvent.hover(icon())
    expect(await screen.findByText('Similar accounts from trusted safes:')).toBeInTheDocument()
    expect(screen.getByText('Similar accounts from owned safes:')).toBeInTheDocument()
  })

  it('swallows clicks so the selectable/navigable row underneath does not react', async () => {
    const onRowClick = jest.fn()
    render(
      <div onClick={onRowClick}>
        <SimilarityWarningIcon warning={warning({ owned: ['0xdead'] })} />
      </div>,
    )

    await userEvent.click(icon())
    expect(onRowClick).not.toHaveBeenCalled()
  })
})
