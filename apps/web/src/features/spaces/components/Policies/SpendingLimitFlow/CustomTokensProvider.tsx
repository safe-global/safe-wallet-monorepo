import { createContext, useCallback, useContext, useMemo, useState, type ReactElement, type ReactNode } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { TokenOption } from './utils/tokenOptions'

type CustomToken = { chainId: string; token: TokenOption }

type CustomTokens = {
  tokens: CustomToken[]
  addToken: (chainId: string, token: TokenOption) => void
}

const CustomTokensContext = createContext<CustomTokens>({ tokens: [], addToken: () => {} })

/** Tokens picked by pasting their address, kept above `TxFlow` so the Review step can still resolve them. */
export const CustomTokensProvider = ({ children }: { children: ReactNode }): ReactElement => {
  const [tokens, setTokens] = useState<CustomToken[]>([])

  const addToken = useCallback((chainId: string, token: TokenOption) => {
    setTokens((prev) =>
      prev.some((entry) => entry.chainId === chainId && sameAddress(entry.token.address, token.address))
        ? prev
        : [...prev, { chainId, token }],
    )
  }, [])

  const value = useMemo(() => ({ tokens, addToken }), [tokens, addToken])

  return <CustomTokensContext.Provider value={value}>{children}</CustomTokensContext.Provider>
}

export const useCustomTokens = (chainId: string): TokenOption[] => {
  const { tokens } = useContext(CustomTokensContext)
  return useMemo(() => tokens.filter((entry) => entry.chainId === chainId).map(({ token }) => token), [tokens, chainId])
}

export const useAddCustomToken = (): CustomTokens['addToken'] => useContext(CustomTokensContext).addToken
