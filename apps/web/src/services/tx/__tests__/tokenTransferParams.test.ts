import {
  createTokenTransferParams,
  createNftTransferParams,
  createMultiTokenTransferParams,
} from '../tokenTransferParams'

describe('Token transfer encoder', () => {
  describe('createTokenTransferParams', () => {
    it('should encode the transfer of 2 ETH', () => {
      const recipient = '0x0000000000000000000000000000000000000000'
      const amount = '2'
      const decimals = 18
      const tokenAddress = '0x0000000000000000000000000000000000000000'
      const txParams = createTokenTransferParams(recipient, amount, decimals, tokenAddress)
      expect(txParams.to).toBe(recipient)
      expect(txParams.value).toBe('2000000000000000000')
      expect(txParams.data).toBe('0x')
    })

    it('should encode the transfer of 0.1 USDC', () => {
      const recipient = '0x0000000000000000000000000000000000000000'
      const amount = '0.1'
      const decimals = 6
      const tokenAddress = '0x0000000000000000000000000000000000000001'
      const txParams = createTokenTransferParams(recipient, amount, decimals, tokenAddress)

      expect(txParams).not.toBe(null)
      expect(txParams.to).toBe(tokenAddress)
      expect(txParams.value).toBe('0')
      expect(txParams.data).toBe(
        '0xa9059cbb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000186a0',
      )
    })
  })

  describe('createNftTransferParams', () => {
    it('should encode the transfer of token 0x1', () => {
      const from = '0x0000000000000000000000000000000000000001'
      const to = '0x0000000000000000000000000000000000000002'
      const tokenId = '985'
      const tokenAddress = '0x0000000000000000000000000000000000000003'
      const txParams = createNftTransferParams(from, to, tokenId, tokenAddress)

      expect(txParams).not.toBe(null)
      expect(txParams.to).toBe(tokenAddress)
      expect(txParams.value).toBe('0')
      expect(txParams.data).toBe(
        '0x42842e0e0000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000003d9',
      )
    })

    it('should encode the transfer of a CryptoKittie', () => {
      const from = '0x0000000000000000000000000000000000000001'
      const to = '0x0000000000000000000000000000000000000002'
      const tokenId = '123'
      const tokenAddress = '0x06012c8cf97bead5deae237070f9587f8e7a266d'
      const txParams = createNftTransferParams(from, to, tokenId, tokenAddress)

      expect(txParams.to).toBe(tokenAddress)
      expect(txParams.value).toBe('0')
      expect(txParams.data).toBe(
        '0xa9059cbb0000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000007b',
      )
    })
  })

  describe('createMultiTokenTransferParams', () => {
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    const RECIPIENT = '0x8b0aB586dF1Ca1f360cb26b34eEC2C3AF969E821'
    const tokens = [{ tokenInfo: { address: USDC.toLowerCase(), decimals: 6 } }]

    it('encodes each recipient with its token decimals', () => {
      expect(
        createMultiTokenTransferParams([{ recipient: RECIPIENT, amount: '1.5', tokenAddress: USDC }], tokens),
      ).toEqual([createTokenTransferParams(RECIPIENT, '1.5', 6, USDC)])
    })

    it('skips a recipient whose token is unknown', () => {
      const unknownToken = '0x1111111111111111111111111111111111111111'

      expect(
        createMultiTokenTransferParams([{ recipient: RECIPIENT, amount: '1', tokenAddress: unknownToken }], tokens),
      ).toEqual([])
    })
  })
})
