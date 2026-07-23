import { render, screen, fireEvent } from '@/tests/test-utils'
import type { TokenInfo } from '@safe-global/store/gateway/policies/types'
import { TokenSelector } from '../TokenSelector'

const USDC: TokenInfo = {
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  symbol: 'USDC',
  decimals: 6,
  logoUri: null,
}
const DAI: TokenInfo = {
  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  symbol: 'DAI',
  decimals: 18,
  logoUri: null,
}

describe('TokenSelector', () => {
  it('renders the provided tokens', () => {
    render(<TokenSelector tokens={[USDC, DAI]} selected={[]} onChange={jest.fn()} />)
    expect(screen.getByText('USDC')).toBeInTheDocument()
    expect(screen.getByText('DAI')).toBeInTheDocument()
  })

  it('renders nothing selectable when the token list is empty', () => {
    const { container } = render(<TokenSelector tokens={[]} selected={[]} onChange={jest.fn()} />)
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0)
  })

  it('marks selected tokens via aria-pressed', () => {
    render(<TokenSelector tokens={[USDC, DAI]} selected={[USDC]} onChange={jest.fn()} />)
    expect(screen.getByText('USDC').closest('[role="button"]')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('DAI').closest('[role="button"]')).toHaveAttribute('aria-pressed', 'false')
  })

  it('selects a token on click', () => {
    const onChange = jest.fn()
    render(<TokenSelector tokens={[USDC, DAI]} selected={[]} onChange={onChange} />)
    fireEvent.click(screen.getByText('USDC'))
    expect(onChange).toHaveBeenCalledWith([USDC])
  })

  it('deselects an already-selected token on click', () => {
    const onChange = jest.fn()
    render(<TokenSelector tokens={[USDC, DAI]} selected={[USDC]} onChange={onChange} />)
    fireEvent.click(screen.getByText('USDC'))
    expect(onChange).toHaveBeenCalledWith([])
  })
})
