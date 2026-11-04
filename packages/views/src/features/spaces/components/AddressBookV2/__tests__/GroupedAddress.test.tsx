import { render, screen } from '@testing-library/react'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import GroupedAddress from '../GroupedAddress'
import { ADDRESSES } from '../mocks/fixtures'

const checksummed = checksumAddress(ADDRESSES.treasury)

describe('GroupedAddress', () => {
  it('shows the whole checksummed address, never shortened', () => {
    render(<GroupedAddress address={ADDRESSES.treasury.toLowerCase()} />)

    expect(screen.getByTestId('grouped-address')).toHaveTextContent(checksummed)
  })

  it('splits the address after 0x into ten groups of four', () => {
    render(<GroupedAddress address={ADDRESSES.treasury} />)

    const groups = Array.from(screen.getByTestId('grouped-address').children).map((group) => group.textContent)

    expect(groups[0]).toBe('0x')
    expect(groups.slice(1)).toEqual(checksummed.slice(2).match(/.{4}/g))
  })
})
