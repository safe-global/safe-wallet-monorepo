import { buildGetCallsResult, type CallsStatusTx, type RawTxReceipt } from '../getCallsStatus'

const receipt: RawTxReceipt = {
  logs: [{ address: '0xabc' }],
  blockHash: '0xbbb',
  blockNumber: '0x10',
  gasUsed: '0x5208',
  transactionHash: '0xrcptHash',
}

describe('buildGetCallsResult', () => {
  describe('status mapping', () => {
    it.each([
      ['SUCCESS', 200],
      ['CANCELLED', 400],
      ['FAILED', 500],
      ['AWAITING_CONFIRMATIONS', 100],
      ['AWAITING_EXECUTION', 100],
      [undefined, 100],
    ])('maps txStatus %s to %i', (txStatus, expected) => {
      const result = buildGetCallsResult('0xhash', '1', { txStatus: txStatus as string }, null)
      expect(result.status).toBe(expected)
    })
  })

  it('returns a receipt-less envelope when no receipt is provided', () => {
    const result = buildGetCallsResult('0xhash', '137', { txStatus: 'AWAITING_EXECUTION', txHash: null }, null)
    expect(result).toEqual({ version: '2.0.0', id: '0xhash', chainId: '0x89', status: 100, atomic: true })
    expect(result.receipts).toBeUndefined()
  })

  it('hex-encodes the chain id in the envelope', () => {
    expect(buildGetCallsResult('0xhash', '11155111', {}, null).chainId).toBe('0xaa36a7')
  })

  it('builds one receipt with normalized hex fields for a confirmed single call', () => {
    const tx: CallsStatusTx = { txStatus: 'SUCCESS', txHash: '0xtxHash' }
    const result = buildGetCallsResult('0xhash', '1', tx, receipt)
    expect(result.receipts).toHaveLength(1)
    expect(result.receipts?.[0]).toEqual({
      logs: receipt.logs,
      status: '0x1',
      blockHash: '0xbbb',
      blockNumber: '0x10',
      gasUsed: '0x5208',
      transactionHash: '0xtxHash',
    })
  })

  it('marks the on-chain receipt status 0x0 for a non-success tx', () => {
    const result = buildGetCallsResult('0xhash', '1', { txStatus: 'FAILED', txHash: '0xtxHash' }, receipt)
    expect(result.receipts?.[0].status).toBe('0x0')
  })

  it('replicates the receipt once per bundled call from valueDecoded', () => {
    const tx: CallsStatusTx = {
      txStatus: 'SUCCESS',
      txHash: '0xtxHash',
      txData: { dataDecoded: { parameters: [{ valueDecoded: [{}, {}, {}] }] } },
    }
    const result = buildGetCallsResult('0xhash', '1', tx, receipt)
    expect(result.receipts).toHaveLength(3)
  })

  it('falls back to the receipt transactionHash when the tx hash is absent', () => {
    const result = buildGetCallsResult('0xhash', '1', { txStatus: 'SUCCESS' }, receipt)
    expect(result.receipts?.[0].transactionHash).toBe('0xrcptHash')
  })

  it('normalizes zero-padded receipt hex (e.g. 0x010) to canonical form', () => {
    const padded: RawTxReceipt = { ...receipt, blockNumber: '0x010', gasUsed: '0x0a' }
    const result = buildGetCallsResult('0xhash', '1', { txStatus: 'SUCCESS', txHash: '0xtxHash' }, padded)
    expect(result.receipts?.[0].blockNumber).toBe('0x10')
    expect(result.receipts?.[0].gasUsed).toBe('0xa')
  })
})
