import userEvent from '@testing-library/user-event'
import { faker } from '@faker-js/faker'
import { render, screen, fakerChecksummedAddress } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { getCommonAffixLengths } from '@safe-global/utils/utils/addressSimilarity'
import { SimilarAddressTooltip } from '.'

jest.mock('@/hooks/useChains')
const mockUseCurrentChain = jest.requireMock('@/hooks/useChains').useCurrentChain as jest.Mock

const lookalikeOf = (address: string) =>
  `0x${address.slice(2, 6)}${faker.string.hexadecimal({ length: 32, prefix: '', casing: 'lower' })}${address.slice(-4)}`

describe('SimilarAddressTooltip', () => {
  const name = faker.company.name()
  const savedAddress = fakerChecksummedAddress()
  const enteredAddress = lookalikeOf(savedAddress)
  const chain = chainBuilder().build()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseCurrentChain.mockReturnValue(chain)
  })

  const hoverName = async () => {
    render(<SimilarAddressTooltip name={name} savedAddress={savedAddress} enteredAddress={enteredAddress} />)
    await userEvent.hover(screen.getByText(name))
    return screen.findByText('Address entered:')
  }

  it('shows the entered and the saved address on hover', async () => {
    const tooltip = (await hoverName()).closest('[data-slot="tooltip-content"]') as HTMLElement

    expect(screen.getByText(`Saved address (${name}):`)).toBeInTheDocument()
    expect(tooltip).toHaveTextContent(enteredAddress)
    expect(tooltip).toHaveTextContent(savedAddress)
  })

  it('bolds the ends the two addresses share', async () => {
    const tooltip = (await hoverName()).closest('[data-slot="tooltip-content"]') as HTMLElement
    const { prefixLen, suffixLen } = getCommonAffixLengths(enteredAddress, savedAddress)

    expect(Array.from(tooltip.querySelectorAll('b')).map((b) => b.textContent)).toEqual([
      enteredAddress.slice(2, 2 + prefixLen),
      enteredAddress.slice(-suffixLen),
      savedAddress.slice(2, 2 + prefixLen),
      savedAddress.slice(-suffixLen),
    ])
  })

  it('links both addresses to the block explorer of the current chain', async () => {
    await hoverName()

    const hrefs = screen.getAllByRole('link').map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual([
      getBlockExplorerLink(chain, enteredAddress)?.href,
      getBlockExplorerLink(chain, savedAddress)?.href,
    ])
  })
})
