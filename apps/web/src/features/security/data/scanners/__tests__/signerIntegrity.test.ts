import { signerIntegrityScanner } from '../signerIntegrity'
import { createMockContext } from '../test-helpers'

const BLOCKAID_API_KEY = 'test-api-key'

const makeBenignResponse = (address: string) => ({
  address,
  blocklist: false,
  name: null,
  risk_summary: { risk_level: 'Benign', total_usd: 0, total_malicious_exposure: 0 },
  exposures: [],
})

const makeMaliciousResponse = (address: string) => ({
  address,
  blocklist: false,
  name: null,
  risk_summary: { risk_level: 'Malicious', total_usd: 150000, total_malicious_exposure: 120000 },
  exposures: [{ category: 'stolen_funds', amount_usd: 80000, percentage: 53.3, risk_level: 'Malicious' }],
})

const makeBlocklistedResponse = (address: string) => ({
  address,
  blocklist: true,
  name: null,
  risk_summary: { risk_level: 'Malicious', total_usd: 100000, total_malicious_exposure: 100000 },
  exposures: [{ category: 'sanctioned_entity', amount_usd: 100000, percentage: 100, risk_level: 'Malicious' }],
})

const makeWarningResponse = (address: string) => ({
  address,
  blocklist: false,
  name: null,
  risk_summary: { risk_level: 'Warning', total_usd: 50000, total_malicious_exposure: 10000 },
  exposures: [{ category: 'mixer', amount_usd: 10000, percentage: 20, risk_level: 'Warning' }],
})

describe('signerIntegrityScanner', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BLOCKAID_API_KEY

  beforeEach(() => {
    process.env.NEXT_PUBLIC_BLOCKAID_API_KEY = BLOCKAID_API_KEY
    jest.restoreAllMocks()
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_BLOCKAID_API_KEY = originalEnv
  })

  it('returns clear when all signers are benign', async () => {
    const owners = [
      { value: '0x1111111111111111111111111111111111111111' },
      { value: '0x2222222222222222222222222222222222222222' },
    ]
    jest.spyOn(global, 'fetch').mockImplementation((_, init) => {
      const body = JSON.parse((init as RequestInit).body as string)
      return Promise.resolve(new Response(JSON.stringify(makeBenignResponse(body.address)), { status: 200 }))
    })

    const result = await signerIntegrityScanner.scan(createMockContext({ owners, chainId: '1' }))
    expect(result.status).toBe('clear')
    expect(result.severity).toBe('Low')
    expect(result.score).toBe(100)
  })

  it('returns issue/Critical when a signer is malicious', async () => {
    const owners = [
      { value: '0x1111111111111111111111111111111111111111' },
      { value: '0xBADBADBADBADBADBADBADBADBADBADBADBADBADB' },
    ]
    jest.spyOn(global, 'fetch').mockImplementation((_, init) => {
      const body = JSON.parse((init as RequestInit).body as string)
      const response =
        body.address === '0xBADBADBADBADBADBADBADBADBADBADBADBADBADB'
          ? makeMaliciousResponse(body.address)
          : makeBenignResponse(body.address)
      return Promise.resolve(new Response(JSON.stringify(response), { status: 200 }))
    })

    const result = await signerIntegrityScanner.scan(createMockContext({ owners, chainId: '1' }))
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('Critical')
    expect(result.score).toBe(0)
  })

  it('returns issue/Critical when a signer is blocklisted', async () => {
    const owners = [{ value: '0xBLOCKLISTED0000000000000000000000000000' }]
    jest.spyOn(global, 'fetch').mockImplementation((_, init) => {
      const body = JSON.parse((init as RequestInit).body as string)
      return Promise.resolve(new Response(JSON.stringify(makeBlocklistedResponse(body.address)), { status: 200 }))
    })

    const result = await signerIntegrityScanner.scan(createMockContext({ owners, chainId: '1' }))
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('Critical')
    expect(result.evidence).toEqual(expect.arrayContaining([expect.objectContaining({ label: 'Blocklisted signer' })]))
  })

  it('returns issue/High when a signer has warning-level exposure', async () => {
    const owners = [{ value: '0xWARNING00000000000000000000000000000000' }]
    jest.spyOn(global, 'fetch').mockImplementation((_, init) => {
      const body = JSON.parse((init as RequestInit).body as string)
      return Promise.resolve(new Response(JSON.stringify(makeWarningResponse(body.address)), { status: 200 }))
    })

    const result = await signerIntegrityScanner.scan(createMockContext({ owners, chainId: '1' }))
    expect(result.status).toBe('issue')
    expect(result.severity).toBe('High')
    expect(result.score).toBe(30)
  })

  it('returns inconclusive when API key is not set', async () => {
    delete process.env.NEXT_PUBLIC_BLOCKAID_API_KEY

    const result = await signerIntegrityScanner.scan(createMockContext({ chainId: '1' }))
    expect(result.status).toBe('inconclusive')
    expect(result.evidence).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'Screening not configured' })]),
    )
  })

  it('returns inconclusive when chain is not supported', async () => {
    const result = await signerIntegrityScanner.scan(createMockContext({ chainId: '100' }))
    expect(result.status).toBe('inconclusive')
    expect(result.evidence).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'Screening not available on this network' })]),
    )
  })

  it('returns inconclusive when fetch fails', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'))

    const result = await signerIntegrityScanner.scan(createMockContext({ chainId: '1' }))
    expect(result.status).toBe('inconclusive')
    expect(result.evidence).toEqual(
      expect.arrayContaining([expect.objectContaining({ value: 'Screening service unavailable' })]),
    )
  })

  it('includes top exposure category in evidence for flagged signers', async () => {
    const owners = [{ value: '0xBAD0000000000000000000000000000000000000' }]
    jest.spyOn(global, 'fetch').mockImplementation((_, init) => {
      const body = JSON.parse((init as RequestInit).body as string)
      return Promise.resolve(new Response(JSON.stringify(makeMaliciousResponse(body.address)), { status: 200 }))
    })

    const result = await signerIntegrityScanner.scan(createMockContext({ owners, chainId: '1' }))
    expect(result.evidence).toEqual(
      expect.arrayContaining([expect.objectContaining({ label: 'Top exposure', value: 'stolen_funds (53.3%)' })]),
    )
  })
})
