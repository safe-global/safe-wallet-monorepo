import React from 'react'
import { render } from '@/src/tests/test-utils'
import { Identicon } from './index'
import { bloSvg } from 'blo'

jest.mock('blo', () => {
  const actual = jest.requireActual('blo')
  return {
    ...actual,
    bloSvg: jest.fn(actual.bloSvg),
  }
})

const mockedBloSvg = bloSvg as jest.MockedFunction<typeof bloSvg>

const ADDR_A = '0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6'
const ADDR_A_LOWER = '0xa77de01e157f9f57c7c4a326eee9c4874d0598b6'
const ADDR_B = '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326'

describe('Identicon', () => {
  beforeEach(() => {
    mockedBloSvg.mockClear()
  })

  it('renders correctly with address', () => {
    const { getByTestId } = render(<Identicon address={ADDR_A} />)
    const image = getByTestId('identicon-image')
    expect(image).toBeTruthy()
  })

  it('applies rounded style by default', () => {
    const { getByTestId } = render(<Identicon address={ADDR_A} />)
    const image = getByTestId('identicon-image-container')
    expect(image.props.style.borderRadius).toBe('50%')
  })

  it('applies not-rounded style when rounded false', () => {
    const { getByTestId } = render(<Identicon address={ADDR_A} rounded={false} />)
    const image = getByTestId('identicon-image-container')
    expect(image.props.style.borderRadius).toBe(0)
  })

  it('applies default size when size prop is not provided', () => {
    const { getByTestId } = render(<Identicon address={ADDR_A} />)
    const image = getByTestId('identicon-image')
    expect(image.props.width).toBe(56)
    expect(image.props.height).toBe(56)
  })

  it('applies custom size when size prop is provided', () => {
    const { getByTestId } = render(<Identicon address={ADDR_A} size={100} />)
    const image = getByTestId('identicon-image')

    expect(image.props.width).toBe(100)
    expect(image.props.height).toBe(100)
  })

  it('memoizes SVG generation across re-renders with the same address', () => {
    const { rerender } = render(<Identicon address={ADDR_B} />)
    const initialCalls = mockedBloSvg.mock.calls.length
    rerender(<Identicon address={ADDR_B} />)
    rerender(<Identicon address={ADDR_B} />)
    expect(mockedBloSvg.mock.calls.length).toBe(initialCalls)
  })

  it('reuses module-level cache across separate Identicon instances', () => {
    render(<Identicon address={ADDR_B} />)
    const firstCalls = mockedBloSvg.mock.calls.length
    render(<Identicon address={ADDR_B} />)
    render(<Identicon address={ADDR_B} size={32} />)
    expect(mockedBloSvg.mock.calls.length).toBe(firstCalls)
  })

  it('treats checksummed and lowercase forms as the same cache entry', () => {
    render(<Identicon address={ADDR_A} />)
    const callsAfterFirst = mockedBloSvg.mock.calls.length
    render(<Identicon address={ADDR_A_LOWER as `0x${string}`} />)
    expect(mockedBloSvg.mock.calls.length).toBe(callsAfterFirst)
  })

  it('renders a neutral placeholder when address is invalid', () => {
    const { getByTestId, queryByTestId } = render(<Identicon address={'not-an-address' as `0x${string}`} />)
    expect(getByTestId('identicon-image-placeholder')).toBeTruthy()
    expect(queryByTestId('identicon-image')).toBeNull()
  })

  it('renders a neutral placeholder when address is empty', () => {
    const { getByTestId } = render(<Identicon address={'' as `0x${string}`} />)
    expect(getByTestId('identicon-image-placeholder')).toBeTruthy()
  })

  it('does not call bloSvg for partial / invalid addresses', () => {
    mockedBloSvg.mockClear()
    render(<Identicon address={'0x123' as `0x${string}`} />)
    expect(mockedBloSvg).not.toHaveBeenCalled()
  })

  it('still renders a blockie for longer hex values (e.g. tx hashes)', () => {
    const txHash = ('0x' + 'a'.repeat(64)) as `0x${string}`
    const { getByTestId } = render(<Identicon address={txHash} />)
    expect(getByTestId('identicon-image')).toBeTruthy()
  })
})
