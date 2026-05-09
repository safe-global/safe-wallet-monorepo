import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  InputAdornment,
  MenuItem,
  Select,
  Typography,
  Alert,
  Paper,
  Grid,
} from '@mui/material'
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
    <Paper data-testid="fee-token-preference-section" sx={{ padding: 4, mt: 2 }}>
      <Grid
        container
        direction="row"
        spacing={3}
        sx={{
          justifyContent: 'space-between',
        }}
      >
        <Grid item lg={4} xs={12}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
            }}
          >
            Fee token preference
          </Typography>
        </Grid>

        <Grid item xs>
          {wallet ? (
            <Box>
              <Typography mb={3}>
                Select your preferred token for paying transaction fees on Tempo. This preference will be used for all
                future transactions for the connected wallet.
              </Typography>

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(undefined)}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
                  Fee token preference updated successfully!
                </Alert>
              )}

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="fee-token-label">Fee token</InputLabel>
                <Select
                  labelId="fee-token-label"
                  label="Fee token"
                  value={loading ? '' : selectedToken || ''}
                  onChange={(e) => {
                    setSelectedToken(e.target.value as `0x${string}`)
                    setSuccess(false)
                  }}
                  disabled={loading || saving}
                  startAdornment={
                    loading ? (
                      <InputAdornment position="start">
                        <CircularProgress size={20} />
                      </InputAdornment>
                    ) : undefined
                  }
                >
                  {loading && (
                    <MenuItem disabled>
                      <Box display="flex" alignItems="center" gap={1}>
                        <CircularProgress size={16} />
                        <Typography>Loading...</Typography>
                      </Box>
                    </MenuItem>
                  )}
                  {!loading &&
                    tokenOptions.map((token) => {
                      const balanceStr = formatVisualAmount(token.balance.toString(), token.decimals)

                      return (
                        <MenuItem key={token.address} value={token.address}>
                          <Box display="flex" justifyContent="space-between" width="100%">
                            <Typography>{token.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Balance: {balanceStr}
                            </Typography>
                          </Box>
                        </MenuItem>
                      )
                    })}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!selectedToken || saving || loading}
                sx={{ minWidth: 120 }}
              >
                {saving ? (
                  <>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    Saving...
                  </>
                ) : (
                  'Save preference'
                )}
              </Button>
            </Box>
          ) : (
            <Typography>Please connect your wallet to configure fee token preference.</Typography>
          )}
        </Grid>
      </Grid>
    </Paper>
  )
}
