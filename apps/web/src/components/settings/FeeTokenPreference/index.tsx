import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Typography } from '@/components/ui/typography'
import { Label } from '@/components/ui/label'
import { Alert, AlertAction, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { XIcon } from 'lucide-react'
import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { multicall } from '@safe-global/utils/utils/multicall'
import { getERC20TokenInfoOnChain } from '@/utils/tokens'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { Interface } from 'ethers'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { formatVisualAmount } from '@safe-global/utils/utils/formatters'
import { isWalletRejection } from '@/utils/wallets'
import { didRevert, didReprice, type EthersError } from '@/utils/ethers-utils'
import type { Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import SettingsCard from '@/components/settings/SettingsCard'

// TODO: move to external source to prevent code edits
const TEMPO_FEE_TOKENS = [
  { name: 'PathUSD', address: '0x20c0000000000000000000000000000000000000' as `0x${string}` },
  { name: 'AlphaUSD', address: '0x20c0000000000000000000000000000000000001' as `0x${string}` },
  { name: 'BetaUSD', address: '0x20c0000000000000000000000000000000000002' as `0x${string}` },
  { name: 'ThetaUSD', address: '0x20c0000000000000000000000000000000000003' as `0x${string}` },
] as const

type TokenWithBalance = Erc20Token & {
  balance: bigint
}

// Read more: https://docs.tempo.xyz/protocol/transactions/spec-tempo-transaction#fee-payer-signature
const FEE_PRECOMPILE_ADDRESS = '0xfeec000000000000000000000000000000000000' as `0x${string}`

const FEE_PRECOMPILE_ABI = [
  'function setUserToken(address token)',
  'function userTokens(address user) view returns (address)',
] as const

const feePrecompile_interface = new Interface(FEE_PRECOMPILE_ABI)

const FEE_TOKEN_ERRORS = {
  FAILED_TO_FETCH_PREFERENCE: 'Failed to fetch current preference',
  PLEASE_SELECT_TOKEN: 'Please select a token',
  TRANSACTION_FAILED: 'Transaction failed',
  TRANSACTION_REJECTED: 'Transaction rejected',
  FAILED_TO_UPDATE: 'Failed to update preference. Please try again.',
} as const

const useTempoFeeTokenBalances = () => {
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()
  const walletAddress = wallet?.address

  return useAsync<TokenWithBalance[]>(async () => {
    if (!web3ReadOnly || !walletAddress) {
      return []
    }

    const tokenAddresses = TEMPO_FEE_TOKENS.map((token) => token.address)

    const tokenInfos = await getERC20TokenInfoOnChain(tokenAddresses)
    if (!tokenInfos) {
      return []
    }

    const erc20Interface = ERC20__factory.createInterface()
    const balanceCalls = tokenAddresses.map((address) => ({
      to: address,
      data: erc20Interface.encodeFunctionData('balanceOf', [walletAddress]),
    }))

    const balanceResults = await multicall(web3ReadOnly, balanceCalls)

    const balances: TokenWithBalance[] = []
    for (let i = 0; i < TEMPO_FEE_TOKENS.length; i++) {
      const token = TEMPO_FEE_TOKENS[i]
      const tokenInfo = tokenInfos.find((info) => info.address.toLowerCase() === token.address.toLowerCase())
      const balanceResult = balanceResults[i]

      if (tokenInfo && balanceResult?.success) {
        balances.push({
          ...tokenInfo,
          name: token.name,
          logoUri: '',
          type: 'ERC20',
          balance: BigInt(balanceResult.returnData),
        })
      }
    }

    return balances
  }, [web3ReadOnly, walletAddress])
}

const useTempoUserPreference = () => {
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()
  const walletAddress = wallet?.address

  return useAsync<`0x${string}` | null>(
    async () => {
      if (!web3ReadOnly || !walletAddress) {
        return null
      }

      try {
        const data = feePrecompile_interface.encodeFunctionData('userTokens', [walletAddress])

        const result = await web3ReadOnly.call({
          to: FEE_PRECOMPILE_ADDRESS,
          data,
        })

        if (result === '0x' || result === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          return null
        }

        const address = feePrecompile_interface.decodeFunctionResult('userTokens', result)[0] as string

        if (address && address !== '0x0000000000000000000000000000000000000000') {
          const normalizedAddress = address.toLowerCase() as `0x${string}`
          const isValidToken = TEMPO_FEE_TOKENS.some((token) => token.address.toLowerCase() === normalizedAddress)
          return isValidToken ? normalizedAddress : null
        }

        return null
      } catch (e: unknown) {
        const err = e as { code?: string; reason?: string }
        const isRevert = err?.code === 'CALL_EXCEPTION' || err?.reason?.includes('reverted')
        if (!isRevert) {
          throw e
        }
        return null
      }
    },
    [web3ReadOnly, walletAddress],
    false,
  )
}

export const FeeTokenPreference = () => {
  const wallet = useWallet()
  const web3ReadOnly = useWeb3ReadOnly()
  const isEnabled = useHasFeature(FEATURES.TEMPO_GAS_TOKEN)
  const [balances, , loadingBalances] = useTempoFeeTokenBalances()
  const [currentPreference, preferenceError, loadingPreference] = useTempoUserPreference()
  const [selectedToken, setSelectedToken] = useState<`0x${string}` | ''>('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (wallet?.address) {
      setSelectedToken('')
      setError(undefined)
      setSuccess(false)
    }
  }, [wallet?.address])

  useEffect(() => {
    if (currentPreference && !selectedToken) {
      setSelectedToken(currentPreference)
    }
  }, [currentPreference, selectedToken])

  useEffect(() => {
    if (preferenceError) {
      setError(FEE_TOKEN_ERRORS.FAILED_TO_FETCH_PREFERENCE)
    }
  }, [preferenceError])

  if (!isEnabled) {
    return null
  }

  const tokenOptions = TEMPO_FEE_TOKENS.map((token) => {
    const tokenBalance = balances?.find((b) => b.address === token.address)
    return {
      ...token,
      balance: tokenBalance?.balance ?? 0n,
      decimals: tokenBalance?.decimals ?? 18,
    }
  })

  const handleSave = async () => {
    if (!selectedToken || !wallet?.address || !wallet?.provider || !web3ReadOnly) {
      setError(FEE_TOKEN_ERRORS.PLEASE_SELECT_TOKEN)
      return
    }

    setSaving(true)
    setError(undefined)
    setSuccess(false)

    try {
      const data = feePrecompile_interface.encodeFunctionData('setUserToken', [selectedToken as `0x${string}`])

      const txHash = await wallet.provider.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: wallet.address,
            to: FEE_PRECOMPILE_ADDRESS,
            data,
            value: '0x0',
            // @ts-ignore - feeToken override for this transaction
            feeToken: selectedToken as `0x${string}`,
          },
        ],
      })

      try {
        const receipt = await web3ReadOnly.waitForTransaction(txHash as string)

        if (!receipt) {
          setError(FEE_TOKEN_ERRORS.TRANSACTION_FAILED)
        } else if (didRevert(receipt)) {
          setError(FEE_TOKEN_ERRORS.TRANSACTION_FAILED)
        } else {
          setSuccess(true)
        }
      } catch (waitError: unknown) {
        const error = waitError as EthersError
        if (didReprice(error)) {
          setSuccess(true)
        } else {
          const msg = (waitError as { message?: string })?.message
          setError(msg || FEE_TOKEN_ERRORS.TRANSACTION_FAILED)
        }
      }
    } catch (err: unknown) {
      const castErr = err as EthersError
      if (isWalletRejection(castErr)) {
        setError(FEE_TOKEN_ERRORS.TRANSACTION_REJECTED)
      } else {
        setError(castErr?.message || FEE_TOKEN_ERRORS.FAILED_TO_UPDATE)
      }
    } finally {
      setSaving(false)
    }
  }

  const loading = loadingBalances || loadingPreference

  return (
    <SettingsCard title="Fee token preference" data-testid="fee-token-preference-section" className="mt-4">
      {wallet ? (
        <div>
          <Typography className="mb-6">
            Select your preferred token for paying transaction fees on Tempo. This preference will be used for all
            future transactions for the connected wallet.
          </Typography>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
              <AlertAction>
                <Button variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={() => setError(undefined)}>
                  <XIcon />
                </Button>
              </AlertAction>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertDescription>Fee token preference updated successfully!</AlertDescription>
              <AlertAction>
                <Button variant="ghost" size="icon-xs" aria-label="Dismiss" onClick={() => setSuccess(false)}>
                  <XIcon />
                </Button>
              </AlertAction>
            </Alert>
          )}

          <div className="mb-4 flex flex-col gap-1.5">
            <Label htmlFor="fee-token">Fee token</Label>
            <Select
              value={loading ? null : selectedToken || null}
              onValueChange={(value) => {
                setSelectedToken(value as `0x${string}`)
                setSuccess(false)
              }}
              disabled={loading || saving}
            >
              <SelectTrigger id="fee-token" className="w-full">
                {loading && <Spinner className="size-5" />}
                <SelectValue placeholder={loading ? 'Loading...' : 'Fee token'} />
              </SelectTrigger>
              <SelectContent>
                {tokenOptions.map((token) => {
                  const balanceStr = formatVisualAmount(token.balance.toString(), token.decimals)

                  return (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex w-full justify-between">
                        <Typography>{token.name}</Typography>
                        <Typography variant="paragraph-small" className="text-muted-foreground">
                          Balance: {balanceStr}
                        </Typography>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleSave} disabled={!selectedToken || saving || loading}>
            {saving ? (
              <>
                <Spinner className="mr-1 size-4" />
                Saving...
              </>
            ) : (
              'Save preference'
            )}
          </Button>
        </div>
      ) : (
        <Typography>Please connect your wallet to configure fee token preference.</Typography>
      )}
    </SettingsCard>
  )
}
