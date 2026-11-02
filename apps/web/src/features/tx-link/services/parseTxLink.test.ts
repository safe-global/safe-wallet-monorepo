import { parseTxLink, parseTxLinkNonce } from './parseTxLink'

const RECIPIENT = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
const TOKEN = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

describe('parseTxLink', () => {
  it('should, when given a native transfer, return one call with empty data', () => {
    const txs = parseTxLink(JSON.stringify([{ to: RECIPIENT, value: '20000000000000000' }]))

    expect(txs).toEqual([{ to: RECIPIENT, value: '20000000000000000', data: '0x' }])
  })

  it('should, when given a single object instead of an array, return it as one call', () => {
    const txs = parseTxLink(JSON.stringify({ to: RECIPIENT, value: '1' }))

    expect(txs).toEqual([{ to: RECIPIENT, value: '1', data: '0x' }])
  })

  it('should, when given raw calldata, pass it through unchanged with value 0', () => {
    const data =
      '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000001'

    const txs = parseTxLink(JSON.stringify([{ to: TOKEN, data }]))

    expect(txs).toEqual([{ to: TOKEN, value: '0', data }])
  })

  it('should, when given a method signature and args, return the encoded calldata', () => {
    const txs = parseTxLink(
      JSON.stringify([{ to: TOKEN, method: 'transfer(address to, uint256 amount)', args: [RECIPIENT, '1'] }]),
    )

    expect(txs[0].data).toBe(
      '0xa9059cbb000000000000000000000000d8da6bf26964af9d7eed9e03e53415d37aa960450000000000000000000000000000000000000000000000000000000000000001',
    )
  })

  it('should, when given a hex value, return it as a decimal string', () => {
    const txs = parseTxLink(JSON.stringify([{ to: RECIPIENT, value: '0x10' }]))

    expect(txs[0].value).toBe('16')
  })

  it('should, when given a lowercase address, return it checksummed', () => {
    const txs = parseTxLink(JSON.stringify([{ to: RECIPIENT.toLowerCase() }]))

    expect(txs[0].to).toBe(RECIPIENT)
  })

  it('should, when given several calls, return them in the same order', () => {
    const txs = parseTxLink(
      JSON.stringify([
        { to: TOKEN, method: 'approve(address,uint256)', args: [RECIPIENT, '5'] },
        { to: RECIPIENT, value: '7' },
      ]),
    )

    expect(txs).toHaveLength(2)
    expect(txs[0].to).toBe(TOKEN)
    expect(txs[0].data.startsWith('0x095ea7b3')).toBe(true)
    expect(txs[1]).toEqual({ to: RECIPIENT, value: '7', data: '0x' })
  })

  it('should, when the input is not JSON, throw a message naming the query parameter', () => {
    expect(() => parseTxLink('not-json')).toThrow('"txs" is not valid JSON')
  })

  it('should, when the array is empty, throw a message asking for at least one call', () => {
    expect(() => parseTxLink('[]')).toThrow('"txs" must contain at least one call')
  })

  it('should, when "to" is not an address, throw a message naming the call', () => {
    expect(() => parseTxLink(JSON.stringify([{ to: RECIPIENT }, { to: '0x123' }]))).toThrow(
      'Call 2: "to" must be an address',
    )
  })

  it('should, when both "data" and "method" are set, throw a message saying only one is allowed', () => {
    expect(() =>
      parseTxLink(JSON.stringify([{ to: TOKEN, data: '0x', method: 'transfer(address,uint256)', args: [] }])),
    ).toThrow('Call 1: set either "data" or "method", not both')
  })

  it('should, when "data" is not hex, throw a message naming the field', () => {
    expect(() => parseTxLink(JSON.stringify([{ to: TOKEN, data: 'hello' }]))).toThrow(
      'Call 1: "data" must be a hex string',
    )
  })

  it('should, when "value" is a decimal fraction, throw a message asking for wei', () => {
    expect(() => parseTxLink(JSON.stringify([{ to: RECIPIENT, value: '0.02' }]))).toThrow(
      'Call 1: "value" must be an integer amount in wei, got "0.02"',
    )
  })

  it('should, when "value" is negative, throw a message saying it must not be negative', () => {
    expect(() => parseTxLink(JSON.stringify([{ to: RECIPIENT, value: '-1' }]))).toThrow(
      'Call 1: "value" must not be negative',
    )
  })

  it('should, when the args do not match the method, throw a message naming the method', () => {
    expect(() =>
      parseTxLink(JSON.stringify([{ to: TOKEN, method: 'transfer(address,uint256)', args: [RECIPIENT] }])),
    ).toThrow('Call 1: cannot encode "transfer(address,uint256)"')
  })
})

describe('parseTxLinkNonce', () => {
  it('should, when given a non-negative integer, return it as a number', () => {
    expect(parseTxLinkNonce('8')).toBe(8)
  })

  it('should, when given a negative number, throw a message naming the query parameter', () => {
    expect(() => parseTxLinkNonce('-1')).toThrow('"nonce" must be a non-negative integer')
  })

  it('should, when given a fraction, throw a message naming the query parameter', () => {
    expect(() => parseTxLinkNonce('1.5')).toThrow('"nonce" must be a non-negative integer')
  })
})
