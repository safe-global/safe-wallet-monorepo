import { render, screen, fakerChecksummedAddress, fakerLookalikeAddress } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { chainBuilder } from '@/tests/builders/chains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { getCommonAffixLengths } from '@safe-global/utils/utils/addressSimilarity'
import { bandHeaderAt, SimilarityWarningIcon } from '../SimilarityBand'
import type { SimilarWarning } from '@/features/address-poisoning'

jest.mock('@/hooks/useChains')
const mockUseChains = jest.requireMock('@/hooks/useChains').default as jest.Mock

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
  const peerOf = (address: string, chainIds = ['1']) => ({ address, chainIds })
  const icon = () => screen.getByLabelText('Possible address poisoning')
  const rowAddress = fakerChecksummedAddress()
  const tooltipOf = async (label: string) =>
    (await screen.findByText(label)).closest('[data-slot="tooltip-content"]') as HTMLElement

  beforeEach(() => {
    mockUseChains.mockReset()
    mockUseChains.mockReturnValue({ configs: [] })
  })

  it('lists only the non-empty peer section', async () => {
    render(<SimilarityWarningIcon address={rowAddress} warning={warning({ owned: [peerOf('0xdead')] })} />)

    await userEvent.hover(icon())
    expect(await screen.findByText('Similar accounts from owned safes:')).toBeInTheDocument()
    expect(screen.queryByText('Similar accounts from trusted safes:')).not.toBeInTheDocument()
    expect(screen.getByText('0xdead')).toBeInTheDocument()
  })

  it('lists both sections when the cluster spans both lists', async () => {
    render(
      <SimilarityWarningIcon
        address={rowAddress}
        warning={warning({ trusted: [peerOf('0xbeef')], owned: [peerOf('0xdead')] })}
      />,
    )

    await userEvent.hover(icon())
    expect(await screen.findByText('Similar accounts from trusted safes:')).toBeInTheDocument()
    expect(screen.getByText('Similar accounts from owned safes:')).toBeInTheDocument()
  })

  it('swallows clicks so the selectable/navigable row underneath does not react', async () => {
    const onRowClick = jest.fn()
    render(
      <div onClick={onRowClick}>
        <SimilarityWarningIcon address={rowAddress} warning={warning({ owned: [peerOf('0xdead')] })} />
      </div>,
    )

    await userEvent.click(icon())
    expect(onRowClick).not.toHaveBeenCalled()
  })

  it('bolds the ends each peer shares with the row address', async () => {
    const peer = fakerLookalikeAddress(rowAddress)
    render(<SimilarityWarningIcon address={rowAddress} warning={warning({ trusted: [peerOf(peer)] })} />)

    await userEvent.hover(icon())
    const tooltip = await tooltipOf('Similar accounts from trusted safes:')
    const { prefixLen, suffixLen } = getCommonAffixLengths(peer, rowAddress)

    expect(Array.from(tooltip.querySelectorAll('b')).map((b) => b.textContent)).toEqual([
      peer.slice(2, 2 + prefixLen),
      peer.slice(-suffixLen),
    ])
  })

  it("links a peer to the block explorer of the peer's own chain", async () => {
    const rowChain = chainBuilder().with({ chainId: '1' }).build()
    const peerChain = chainBuilder().with({ chainId: '137' }).build()
    mockUseChains.mockReturnValue({ configs: [rowChain, peerChain] })
    const peer = fakerLookalikeAddress(rowAddress)
    render(
      <SimilarityWarningIcon address={rowAddress} warning={warning({ owned: [peerOf(peer, [peerChain.chainId])] })} />,
    )

    await userEvent.hover(icon())
    const tooltip = await tooltipOf('Similar accounts from owned safes:')

    expect(tooltip.querySelector('a')).toHaveAttribute('href', getBlockExplorerLink(peerChain, peer)?.href)
  })

  it('does not link a peer that is listed on several chains', async () => {
    const chains = [chainBuilder().with({ chainId: '1' }).build(), chainBuilder().with({ chainId: '137' }).build()]
    mockUseChains.mockReturnValue({ configs: chains })
    const peer = fakerLookalikeAddress(rowAddress)
    render(
      <SimilarityWarningIcon
        address={rowAddress}
        warning={warning({
          owned: [
            peerOf(
              peer,
              chains.map((chain) => chain.chainId),
            ),
          ],
        })}
      />,
    )

    await userEvent.hover(icon())
    const tooltip = await tooltipOf('Similar accounts from owned safes:')

    expect(tooltip.querySelector('a')).not.toBeInTheDocument()
  })
})
