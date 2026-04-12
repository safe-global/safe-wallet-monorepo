import type { SecurityScanner, ScanResult } from './types'

const BLOCKAID_API_URL = 'https://api.blockaid.io'

/** Map Safe chainId to Blockaid Risk Exposure supported chain name. */
const CHAIN_ID_TO_BLOCKAID: Record<string, string> = {
  '1': 'ethereum',
  '8453': 'base',
  '56': 'bsc',
  '42161': 'arbitrum',
  '137': 'polygon',
}

type RiskExposureResponse = {
  address: string
  blocklist: boolean
  name: string | null
  risk_summary: {
    risk_level: 'Malicious' | 'Warning' | 'Benign' | 'High-Risk'
    total_usd: number
    total_malicious_exposure: number
  }
  exposures: Array<{
    category: string
    amount_usd: number
    percentage: number
    risk_level: string
  }>
}

const fetchRiskExposure = async (address: string, chain: string, apiKey: string): Promise<RiskExposureResponse> => {
  const res = await fetch(`${BLOCKAID_API_URL}/v0/address/risk-exposure`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey },
    body: JSON.stringify({ address, chain }),
  })
  if (!res.ok) throw new Error(`Blockaid API error: ${res.status}`)
  return res.json()
}

const isFlagged = (result: RiskExposureResponse): boolean =>
  result.blocklist || result.risk_summary.risk_level === 'Malicious' || result.risk_summary.risk_level === 'High-Risk'

const isWarning = (result: RiskExposureResponse): boolean => result.risk_summary.risk_level === 'Warning'

const makeInconclusiveResult = (message: string): ScanResult => ({
  status: 'inconclusive',
  severity: 'Low',
  score: 50,
  evidence: [{ label: 'Status', value: message }],
  remediation: 'Manually verify that all signers are trustworthy and have not been compromised.',
  lastChecked: new Date().toISOString(),
})

export const signerIntegrityScanner: SecurityScanner = {
  id: 'signer_integrity',
  scan: async (ctx) => {
    const now = new Date().toISOString()
    const apiKey = process.env.NEXT_PUBLIC_BLOCKAID_API_KEY

    if (!apiKey) {
      return makeInconclusiveResult('Screening not configured')
    }

    const blockaidChain = CHAIN_ID_TO_BLOCKAID[ctx.chainId]
    if (!blockaidChain) {
      return makeInconclusiveResult('Screening not available on this network')
    }

    let results: RiskExposureResponse[]
    try {
      results = await Promise.all(ctx.owners.map((owner) => fetchRiskExposure(owner.value, blockaidChain, apiKey)))
    } catch {
      return makeInconclusiveResult('Screening service unavailable')
    }

    const flaggedSigners = results.filter(isFlagged)
    const warningSigners = results.filter((r) => !isFlagged(r) && isWarning(r))

    if (flaggedSigners.length > 0) {
      const evidence = flaggedSigners.flatMap((r) => {
        const items: Array<{ label: string; value: string }> = [
          { label: r.blocklist ? 'Blocklisted signer' : 'Flagged signer', value: r.address },
          { label: 'Risk level', value: r.risk_summary.risk_level },
        ]
        const topExposure = [...r.exposures].sort((a, b) => b.percentage - a.percentage)[0]
        if (topExposure) {
          items.push({ label: 'Top exposure', value: `${topExposure.category} (${topExposure.percentage}%)` })
        }
        return items
      })

      return {
        status: 'issue',
        severity: 'Critical',
        score: 0,
        evidence,
        remediation:
          'One or more signers have exposure to sanctioned or malicious sources. Review the flagged signers and consider replacing them.',
        lastChecked: now,
      }
    }

    if (warningSigners.length > 0) {
      const evidence = warningSigners.flatMap((r) => {
        const items: Array<{ label: string; value: string }> = [
          { label: 'Warning signer', value: r.address },
          { label: 'Risk level', value: r.risk_summary.risk_level },
        ]
        const topExposure = [...r.exposures].sort((a, b) => b.percentage - a.percentage)[0]
        if (topExposure) {
          items.push({ label: 'Top exposure', value: `${topExposure.category} (${topExposure.percentage}%)` })
        }
        return items
      })

      return {
        status: 'issue',
        severity: 'High',
        score: 30,
        evidence,
        remediation:
          'One or more signers have elevated compliance risk exposure. Review the flagged signers to ensure they meet your security requirements.',
        lastChecked: now,
      }
    }

    return {
      status: 'clear',
      severity: 'Low',
      score: 100,
      evidence: [
        { label: 'Status', value: 'All signers passed screening' },
        { label: 'Signers checked', value: `${results.length}` },
      ],
      remediation: '',
      lastChecked: now,
    }
  },
}
