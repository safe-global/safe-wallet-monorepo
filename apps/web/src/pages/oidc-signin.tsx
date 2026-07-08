import { useState } from 'react'
import type { NextPage } from 'next'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { Box, Button, Paper, Typography } from '@mui/material'
import ConnectWalletButton from '@/components/common/ConnectWallet/ConnectWalletButton'
import EthHashInfo from '@/components/common/EthHashInfo'
import { BRAND_NAME } from '@/config/constants'
import { GATEWAY_URL } from '@/config/gateway'
import useWallet from '@/hooks/wallets/useWallet'
import { createWeb3 } from '@/hooks/wallets/web3'
import { getSignableMessage } from '@/services/siwe/utils'
import { asError } from '@safe-global/utils/services/exceptions/utils'

/**
 * Sign-in with Ethereum page for the CGW OIDC provider.
 *
 * CGW's `/v1/oauth2/authorize` endpoint redirects here with a `request_id`
 * and a SiWe `nonce`. The user signs the SiWe message with their wallet,
 * the signature is verified by CGW's `/v1/oauth2/signin` endpoint (the same
 * validation as the regular SiWe login) and the browser is redirected back
 * to the OIDC client (e.g. Auth0) with an authorization code.
 */
const OidcSignInPage: NextPage = () => {
  const router = useRouter()
  const wallet = useWallet()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const requestId = router.query.request_id?.toString()
  const nonce = router.query.nonce?.toString()

  const onSign = async () => {
    if (!wallet || !requestId || !nonce) return

    setLoading(true)
    setError(undefined)

    try {
      const provider = createWeb3(wallet.provider)
      const [network, signer] = await Promise.all([provider.getNetwork(), provider.getSigner()])
      const message = getSignableMessage(signer.address, network.chainId, nonce)
      const signature = await signer.signMessage(message)

      const res = await fetch(`${GATEWAY_URL}/v1/oauth2/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, message, signature }),
      })
      if (!res.ok) {
        throw new Error((await res.text()) || `Sign-in failed with status ${res.status}`)
      }

      const { redirect_url } = await res.json()
      window.location.assign(redirect_url)
    } catch (e) {
      setError(asError(e).message)
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>{`${BRAND_NAME} – Sign in with Ethereum`}</title>
      </Head>

      <main>
        <Box display="flex" justifyContent="center" mt={10}>
          <Paper sx={{ p: 4, maxWidth: 480, width: '100%' }}>
            <Typography variant="h2" mb={2}>
              Sign in with Ethereum
            </Typography>

            {!requestId || !nonce ? (
              <Typography color="error">Invalid sign-in request. Please start over from the application.</Typography>
            ) : (
              <>
                <Typography mb={3}>
                  Sign a message with your wallet to prove ownership of your address. This does not initiate a
                  transaction or cost any fees.
                </Typography>

                {wallet ? (
                  <>
                    <Box mb={3}>
                      <EthHashInfo address={wallet.address} showCopyButton avatarSize={24} />
                    </Box>
                    <Button variant="contained" onClick={onSign} disabled={loading} fullWidth>
                      {loading ? 'Signing in…' : 'Sign in'}
                    </Button>
                  </>
                ) : (
                  <ConnectWalletButton fullWidth />
                )}

                {error && (
                  <Typography color="error" mt={2}>
                    {error}
                  </Typography>
                )}
              </>
            )}
          </Paper>
        </Box>
      </main>
    </>
  )
}

export default OidcSignInPage
