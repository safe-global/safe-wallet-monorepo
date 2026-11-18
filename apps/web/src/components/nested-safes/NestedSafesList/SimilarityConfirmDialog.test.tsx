import { render, screen, fakerChecksummedAddress } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'
import { SimilarityConfirmDialog } from './SimilarityConfirmDialog'

describe('SimilarityConfirmDialog (nested Safes)', () => {
  const address = fakerChecksummedAddress()
  const similarAddresses = [fakerChecksummedAddress()]

  beforeEach(() => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(undefined)
  })

  const renderDialog = () =>
    render(
      <SimilarityConfirmDialog
        address={address}
        similarAddresses={similarAddresses}
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />,
    )

  it('shows each address without a chain prefix', () => {
    jest.spyOn(useChains, 'useChain').mockReturnValue(chainBuilder().with({ shortName: 'eth' }).build())

    renderDialog()

    expect(screen.queryAllByText('eth:')).toHaveLength(0)
  })

  it('bolds the first and last four hex characters of each address', () => {
    renderDialog()

    const bold = Array.from(screen.getByRole('dialog').querySelectorAll('b')).map((b) => b.textContent)
    expect(bold).toEqual([address, ...similarAddresses].flatMap((a) => [a.slice(2, 6), a.slice(-4)]))
  })
})
