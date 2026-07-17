export type TokenListEntry = {
  chainId: number
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

type TokenList = {
  tokens: TokenListEntry[]
}

const TOKEN_LIST_URL = 'https://tokens.uniswap.org/'

const PRIORITY_SYMBOLS = [
  'USDC',
  'USDT',
  'DAI',
  'FRAX',
  'PYUSD',
  'USDE',
  'WETH',
  'STETH',
  'WSTETH',
  'RETH',
  'WBTC',
  'CBBTC',
  'LINK',
  'UNI',
  'AAVE',
  'MKR',
  'COMP',
  'CRV',
  'LDO',
  'SAFE',
  'OP',
  'ARB',
  'MATIC',
  'PEPE',
  'SHIB',
]

let cachedList: TokenList | null = null
let inflight: Promise<TokenList> | null = null

export const loadTokenList = async (): Promise<TokenList> => {
  if (cachedList) return cachedList
  if (!inflight) {
    inflight = fetch(TOKEN_LIST_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`Token list HTTP ${res.status}`)
        return res.json() as Promise<TokenList>
      })
      .then((list) => {
        cachedList = list
        return list
      })
      .catch((err) => {
        inflight = null
        throw err
      })
  }
  return inflight
}

const priorityIndex = (symbol: string): number => {
  const idx = PRIORITY_SYMBOLS.indexOf(symbol.toUpperCase())
  return idx === -1 ? Number.POSITIVE_INFINITY : idx
}

export const tokensForChain = async (chainId: string): Promise<TokenListEntry[]> => {
  const numChainId = Number(chainId)
  if (!Number.isFinite(numChainId)) return []
  const list = await loadTokenList()
  const filtered = list.tokens.filter((t) => t.chainId === numChainId)
  return filtered.sort((a, b) => {
    const pa = priorityIndex(a.symbol)
    const pb = priorityIndex(b.symbol)
    if (pa !== pb) return pa - pb
    return a.symbol.localeCompare(b.symbol)
  })
}
